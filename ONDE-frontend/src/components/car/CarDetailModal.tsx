import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { CarDto, CalendarDayInfo } from '@/api/carApi';
import { book_car_api, get_inventory_calendar_api } from '@/api/carApi';
import { buildPaymentCheckout } from '@/utils/paymentCheckout';
import {
  buildCalendarMonth,
  countNights,
  todayStr,
  addDaysStr,
  isStayRangeAvailable,
  resolveValidStayRange,
} from '@/utils/calendarUtils';
import { useTravelStore } from '@/store/useTravelStore';
import { extractApiErrorMessage } from '@/utils/apiResponse';
import { hasDisplayImage, hasDisplayPrice } from '@/utils/listingDisplay';

import { CarDetailHeader } from './CarDetailModal/CarDetailHeader';
import { CarDetailDateBanner } from './CarDetailModal/CarDetailDateBanner';
import { CarDetailVehicleSelector } from './CarDetailModal/CarDetailVehicleSelector';
import { CarDetailCalendar } from './CarDetailModal/CarDetailCalendar';
import { CarDetailFooter } from './CarDetailModal/CarDetailFooter';

interface CarDetailModalProps {
  car: CarDto;
  vehicles?: CarDto[];
  soldOutDays?: number[];
  defaultPickup?: string;
  defaultReturn?: string;
  onClose: () => void;
}

export const CarDetailModal: React.FC<CarDetailModalProps> = ({
  car,
  vehicles = [],
  soldOutDays = [],
  defaultPickup,
  defaultReturn,
  onClose,
}) => {
  const navigate = useNavigate();
  const addToast = useTravelStore((s) => s.addToast);
  const isLoggedIn = useTravelStore((s) => s.isLoggedIn);
  const openAuthModal = useTravelStore((s) => s.openAuthModal);

  // car.unavailableDays를 Set으로 변환 (백엔드 연동 시 API 응답값으로 대체)
  const [booking, setBooking] = useState(false);
  const unavailableDaysSet = useMemo(() => new Set(soldOutDays), [soldOutDays]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const preferredPickup = defaultPickup ?? todayStr();
  const preferredReturn = defaultReturn ?? addDaysStr(preferredPickup, 1);
  const { checkIn: initPickup, checkOut: initReturn } = resolveValidStayRange(
    preferredPickup,
    preferredReturn,
    soldOutDays,
  );

  const [pickupDate, setPickupDate] = useState<string>(initPickup);
  const [returnDate, setReturnDate] = useState<string>(initReturn);
  const [selecting, setSelecting] = useState<'pickup' | 'return' | null>(null);

  // Calendar month navigation
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [calendarData, setCalendarData] = useState<Record<string, CalendarDayInfo>>({});
  const [knownPrices, setKnownPrices] = useState<Record<string, number>>({});
  const [individualCalendars, setIndividualCalendars] = useState<Record<number, Record<string, CalendarDayInfo>>>({});

  const targetVehicles = useMemo(() => {
    return vehicles && vehicles.length > 0 ? vehicles : [car];
  }, [vehicles, car]);

  const [selectedCarId, setSelectedCarId] = useState<number>(car.carId);

  const selectedVehicle = useMemo(() => {
    return targetVehicles.find(v => v.carId === selectedCarId) || car;
  }, [targetVehicles, selectedCarId, car]);

  useEffect(() => {
    let active = true;
    const fetchCalendar = async () => {
      const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
      try {
        const promises = targetVehicles.map(async (v) => {
          const res = await get_inventory_calendar_api('CAR', v.carId, monthStr);
          return { carId: v.carId, success: res.success, data: res.data };
        });
        const results = await Promise.all(promises);

        const calendarsMap: Record<number, Record<string, CalendarDayInfo>> = {};
        const mergedData: Record<string, CalendarDayInfo> = {};

        results.forEach((res) => {
          if (res.success && res.data) {
            calendarsMap[res.carId] = res.data;
            Object.entries(res.data).forEach(([day, info]) => {
              if (!mergedData[day]) {
                mergedData[day] = {
                  price: info.price,
                  stock: info.stock ?? 0,
                  isClosed: info.isClosed,
                };
              } else {
                mergedData[day].stock = (mergedData[day].stock ?? 0) + (info.stock ?? 0);
                if (!info.isClosed && (info.stock ?? 0) > 0) {
                  mergedData[day].isClosed = false;
                }
                if (info.price > 0 && (mergedData[day].price === 0 || info.price < mergedData[day].price)) {
                  mergedData[day].price = info.price;
                }
              }
            });
          }
        });

        if (active) {
          setIndividualCalendars(calendarsMap);
          setCalendarData(mergedData);
        }
      } catch (err) {
        console.error('Failed to fetch calendar:', err);
      }
    };
    fetchCalendar();
    return () => { active = false; };
  }, [calYear, calMonth, targetVehicles]);

  useEffect(() => {
    if (Object.keys(calendarData).length > 0) {
      setKnownPrices(prev => {
        const next = { ...prev };
        Object.entries(calendarData).forEach(([day, info]) => {
          const mm = String(calMonth + 1).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          const dateStr = `${calYear}-${mm}-${dd}`;
          next[dateStr] = info.price;
        });
        return next;
      });
    }
  }, [calendarData, calYear, calMonth]);

  const cells = useMemo(() => {
    const rawCells = buildCalendarMonth(calYear, calMonth, car.pricePerDay, {
      weekendSurchargeRate: 0,
      disabledDays: unavailableDaysSet,
      disableBeforeToday: true,
    });
    return rawCells.map(cell => {
      if (cell.isEmpty) return cell;
      const dayKey = String(cell.day);
      const dbInfo = calendarData[dayKey];
      if (dbInfo) {
        return {
          ...cell,
          price: dbInfo.price > 0 ? dbInfo.price : cell.price,
          disabled: cell.disabled || dbInfo.isClosed || dbInfo.stock <= 0,
          stock: dbInfo.stock,
        };
      }
      return cell;
    });
  }, [calYear, calMonth, car.pricePerDay, unavailableDaysSet, calendarData]);

  // Days rented
  const isRangeSelected = !!(pickupDate && returnDate);
  const rentalDays = isRangeSelected ? countNights(pickupDate, returnDate) : 0;

  const rawTotal = useMemo(() => {
    if (!isRangeSelected) return 0;
    let total = 0;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const cur = new Date(start);
    while (cur < end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const price = knownPrices[dateStr] ?? car.pricePerDay;
      total += price;
      cur.setDate(cur.getDate() + 1);
    }
    return total;
  }, [isRangeSelected, pickupDate, returnDate, knownPrices, car.pricePerDay]);

  const finalTotal = rawTotal;

  const availableVehicles = useMemo(() => {
    if (!pickupDate || !returnDate || targetVehicles.length === 0) {
      return targetVehicles;
    }

    return targetVehicles.filter(v => {
      const cal = individualCalendars[v.carId];
      if (!cal) return true;

      const start = new Date(pickupDate);
      const end = new Date(returnDate);
      const cur = new Date(start);

      while (cur < end) {
        const d = String(cur.getDate());
        const info = cal[d];
        if (info && (info.isClosed || info.stock <= 0)) {
          return false;
        }
        cur.setDate(cur.getDate() + 1);
      }
      return true;
    });
  }, [pickupDate, returnDate, targetVehicles, individualCalendars]);

  useEffect(() => {
    if (availableVehicles.length > 0) {
      const isStillAvailable = availableVehicles.some(v => v.carId === selectedCarId);
      if (!isStillAvailable) {
        setSelectedCarId(availableVehicles[0].carId);
      }
    }
  }, [availableVehicles, selectedCarId]);

  function hasSoldOutInRange(start: string, end: string): boolean {
    return !isStayRangeAvailable(start, end, soldOutDays);
  }

  function handleCellClick(dateStr: string, disabled: boolean) {
    if (disabled) return;
    if (selecting === null || selecting === 'pickup') {
      setPickupDate(dateStr);
      setReturnDate('');
      setSelecting('return');
    } else {
      if (dateStr <= pickupDate) {
        setPickupDate(dateStr);
        setReturnDate('');
        setSelecting('return');
      } else {
        if (hasSoldOutInRange(pickupDate, dateStr)) {
          addToast(
            '⚠️ 예약 불가 기간 포함 — 선택하신 일정 사이에 이미 예약 마감된 날짜가 포함되어 있습니다.',
            'warning'
          );
          setPickupDate(dateStr);
          setReturnDate('');
          setSelecting('return');
          return;
        }
        setReturnDate(dateStr);
        setSelecting(null);
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleBook() {
    if (!isLoggedIn) {
      addToast('로그인 후에 렌터카를 예약하실 수 있습니다.', 'warning');
      onClose();
      openAuthModal('login');
      return;
    }
    if (!isRangeSelected) {
      addToast('일정을 완료해 주세요.', 'warning');
      return;
    }

    setBooking(true);
    try {
      const orderTotal = finalTotal;
      const res = await book_car_api({
        carId: selectedCarId,
        startDate: pickupDate,
        endDate: returnDate,
        totalPrice: orderTotal,
      });
      if (!res.success || !res.data?.reservationId) {
        addToast(res.message || '렌터카 예약에 실패했습니다.', 'warning');
        return;
      }
      onClose();
      navigate('/payment', {
        state: buildPaymentCheckout({
          reservationType: 'CAR',
          reservationId: res.data.reservationId,
          productTitle: selectedVehicle.name,
          productSubtitle: `${selectedVehicle.typeLabel} (${selectedVehicle.licensePlate || ''})`,
          productImageUrl: hasDisplayImage(selectedVehicle.imageUrl) ? selectedVehicle.imageUrl : undefined,
          categoryLabel: '렌터카',
          categoryIcon: 'fa-car',
          totalAmount: res.data.totalPrice ?? orderTotal,
          usedMileage: 0,
          dateSummary: `${pickupDate} ~ ${returnDate} (${rentalDays}일 대여)`,
          detailLines: [
            ...(hasDisplayPrice(selectedVehicle.pricePerDay)
              ? [`₩${(orderTotal / rentalDays).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}/일 평균 × ${rentalDays}일`]
              : []),
            ...(selectedVehicle.fuel && selectedVehicle.seats
              ? [`${selectedVehicle.fuel} · ${selectedVehicle.seats}인승`]
              : selectedVehicle.fuel
                ? [selectedVehicle.fuel]
                : selectedVehicle.seats
                  ? [`${selectedVehicle.seats}인승`]
                  : []),
          ],
          returnPath: '/car',
        }),
      });
    } catch (err: unknown) {
      addToast(extractApiErrorMessage(err, '렌터카 예약 중 오류가 발생했습니다.'), 'warning');
    } finally {
      setBooking(false);
    }
  }

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.52)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '580px', maxWidth: '95%',
          padding: '1.8rem',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
          animation: 'zoomIn 0.22s ease',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '18px', right: '18px',
            background: 'none', border: 'none',
            fontSize: '1.2rem', color: '#717171', cursor: 'pointer',
            lineHeight: 1, padding: '4px',
          }}
        >
          <i className="fa-solid fa-xmark" />
        </button>

        <CarDetailHeader car={car} selectedVehicle={selectedVehicle} />

        {/* ── Scrollable Body ── */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.4rem', marginBottom: '0.8rem' }}>
          <CarDetailDateBanner
            pickupDate={pickupDate}
            returnDate={returnDate}
            isRangeSelected={isRangeSelected}
            rentalDays={rentalDays}
          />

          <CarDetailVehicleSelector
            targetVehicles={targetVehicles}
            availableVehicles={availableVehicles}
            selectedCarId={selectedCarId}
            onSelect={setSelectedCarId}
          />

          <CarDetailCalendar
            calYear={calYear}
            calMonth={calMonth}
            cells={cells}
            pickupDate={pickupDate}
            returnDate={returnDate}
            onPrevMonth={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
            onNextMonth={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
            onCellClick={handleCellClick}
          />
        </div>

        <CarDetailFooter
          isRangeSelected={isRangeSelected}
          rentalDays={rentalDays}
          rawTotal={rawTotal}
          finalTotal={finalTotal}
          booking={booking}
          onBook={handleBook}
        />
      </div>

      <style>{`
        @keyframes zoomIn {
          from { transform: scale(0.94); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
};
