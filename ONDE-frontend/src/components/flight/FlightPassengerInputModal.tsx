import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { book_flight_reservation_api } from '@/api/flightApi';
import { buildPaymentCheckout } from '@/utils/paymentCheckout';
import { useTravelStore } from '@/store/useTravelStore';
import { extractApiErrorMessage } from '@/utils/apiResponse';
import { FlightPassengerModalHeader } from './FlightPassengerModalHeader';
import { FlightPassengerJourneySummary } from './FlightPassengerJourneySummary';
import { FlightPassengerFormCard, type Passenger } from './FlightPassengerFormCard';
import { FlightPassengerPriceSummary } from './FlightPassengerPriceSummary';
import { FlightPassengerModalActions } from './FlightPassengerModalActions';
import { FlightPassengerModalStyles } from './FlightPassengerModalStyles';

interface FlightPassengerInputModalProps {
  flightInfo?: {
    scheduleId: number;
    flightNumber: string;
    departureAirport: string;
    departureTime?: string;
    arrivalAirport: string;
    arrivalTime?: string;
    classType: string;
    seatClass: string;
    basePrice: number;
    passengerCount: number;
  };
  onClose: () => void;
}

export const FlightPassengerInputModal: React.FC<FlightPassengerInputModalProps> = ({
  flightInfo = {
    scheduleId: 0,
    flightNumber: 'OD-702',
    departureAirport: 'ICN (서울/인천)',
    departureTime: '2026-06-03T10:15:00',
    arrivalAirport: 'NRT (도쿄/나리타)',
    arrivalTime: '2026-06-03T12:45:00',
    classType: 'Business Class',
    seatClass: 'BUSINESS',
    basePrice: 650000,
    passengerCount: 1,
  },
  onClose,
}) => {
  const navigate = useNavigate();
  const addToast = useTravelStore((s) => s.addToast);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPassengers(
      Array.from({ length: flightInfo.passengerCount }, () => ({
        name: '',
        passportNumber: '',
        birthdate: '',
      }))
    );
  }, [flightInfo.passengerCount]);

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
    const updated = [...passengers];
    updated[index] = {
      ...updated[index],
      [field]: field === 'name' ? value.toUpperCase() : value, // 영문 대문자 변환 자동화
    };
    setPassengers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name || !p.name.trim()) {
        addToast(`탑승객 ${i + 1}의 영문 성명을 입력해 주세요.`, 'warning');
        return;
      }
      if (!p.passportNumber || !p.passportNumber.trim()) {
        addToast(`탑승객 ${i + 1}의 여권번호를 입력해 주세요.`, 'warning');
        return;
      }
      if (!p.birthdate) {
        addToast(`탑승객 ${i + 1}의 생년월일을 선택해 주세요.`, 'warning');
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      if (p.birthdate > today) {
        addToast(`탑승객 ${i + 1}의 생년월일은 미래 날짜일 수 없습니다.`, 'warning');
        return;
      }
    }

    if (!flightInfo.scheduleId) {
      addToast('항공 스케줄 정보가 없습니다. 다시 검색해 주세요.', 'warning');
      return;
    }

    if (passengers.length > 1) {
      addToast('현재 백엔드는 1명씩 예약만 지원합니다. 첫 번째 탑승객으로 진행합니다.', 'info');
    }

    const primary = passengers[0];
    // 백엔드는 1명 예약만 저장 — 결제·청구는 항상 1좌석
    const billablePassengerCount = 1;
    const totalAmount = flightInfo.basePrice * billablePassengerCount;

    setIsSubmitting(true);
    try {
      const res = await book_flight_reservation_api({
        scheduleId: flightInfo.scheduleId,
        seatClass: flightInfo.seatClass,
        passengerName: primary.name.trim(),
        passengerPassport: primary.passportNumber.trim(),
        passengerBirthdate: primary.birthdate,
        passengerCount: billablePassengerCount,
        totalPrice: totalAmount,
      });

      if (!res.success || !res.data?.bookingCode) {
        addToast(res.message || '항공 예약에 실패했습니다.', 'warning');
        return;
      }

      addToast('좌석 선점이 완료되었습니다. 결제 단계로 이동합니다.', 'success');

      const checkoutState = buildPaymentCheckout({
        reservationType: 'FLIGHT',
        reservationId: res.data.bookingId,
        flightBookingCode: res.data.bookingCode,
        productTitle: `${flightInfo.flightNumber} (${flightInfo.classType})`,
        productSubtitle: `${flightInfo.departureAirport} → ${flightInfo.arrivalAirport}`,
        categoryLabel: '항공권',
        categoryIcon: 'fa-plane',
        totalAmount: Number(res.data.totalPrice ?? totalAmount),
        usedMileage: 0,
        dateSummary: `탑승객 ${billablePassengerCount}명`,
        detailLines: [
          `₩${flightInfo.basePrice.toLocaleString()} × ${billablePassengerCount}명`,
          `Booking: ${res.data.bookingCode}`,
          `Passenger: ${primary.name}`,
        ],
        returnPath: '/flight',
      });

      onClose();
      navigate('/payment', { state: checkoutState });
    } catch (err: unknown) {
      addToast(extractApiErrorMessage(err, '항공 예약 중 오류가 발생했습니다.'), 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 멀티 탑승객 폼은 UX용 — 결제 예정 금액은 1좌석 기준
  const billablePassengerCount = 1;
  const totalAmount = flightInfo.basePrice * billablePassengerCount;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 20000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: 'Pretendard, -apple-system, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '32px',
          width: '640px',
          maxWidth: '95%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 럭셔리 라인 */}
        <div
          style={{
            height: '6px',
            background: 'linear-gradient(90deg, #005ce6 0%, #ff5a5f 100%)',
          }}
        />

        <FlightPassengerModalHeader onClose={onClose} />

        {/* ── Scrollable Body ── */}
        <div
          style={{
            padding: '1.5rem 2rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
          className="passenger-modal-body"
        >
          <FlightPassengerJourneySummary
            flightNumber={flightInfo.flightNumber}
            classType={flightInfo.classType}
            departureAirport={flightInfo.departureAirport}
            departureTime={flightInfo.departureTime}
            arrivalAirport={flightInfo.arrivalAirport}
            arrivalTime={flightInfo.arrivalTime}
          />

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            noValidate
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {passengers.map((passenger, index) => (
                <FlightPassengerFormCard
                  key={index}
                  index={index}
                  passenger={passenger}
                  onChange={handlePassengerChange}
                />
              ))}
            </div>

            <FlightPassengerPriceSummary
              passengerCount={billablePassengerCount}
              basePrice={flightInfo.basePrice}
              totalAmount={totalAmount}
            />

            <FlightPassengerModalActions isSubmitting={isSubmitting} onClose={onClose} />
          </form>
        </div>
      </div>

      <FlightPassengerModalStyles />
    </div>,
    document.body
  );
};
