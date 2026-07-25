import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { StayDto, CalendarDayInfo } from '@/api/stayApi';
import { book_stay_api, get_inventory_calendar_api } from '@/api/stayApi';
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

import { StayDetailHeader } from './StayDetailModal/StayDetailHeader';
import { StayDetailDescription } from './StayDetailModal/StayDetailDescription';
import { StayDetailDateBanner } from './StayDetailModal/StayDetailDateBanner';
import { StayDetailCalendar } from './StayDetailModal/StayDetailCalendar';
import { StayDetailGuestPicker } from './StayDetailModal/StayDetailGuestPicker';
import { StayDetailFooter } from './StayDetailModal/StayDetailFooter';

interface StayDetailModalProps {
  stay: StayDto;
  roomId: number;
  soldOutDays?: number[];
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: number;
  defaultRooms?: number;
  onClose: () => void;
}

export const StayDetailModal: React.FC<StayDetailModalProps> = ({
  stay,
  roomId,
  soldOutDays = [],
  defaultCheckIn,
  defaultCheckOut,
  defaultGuests,
  defaultRooms,
  onClose,
}) => {
  const navigate = useNavigate();
  const addToast = useTravelStore((s) => s.addToast);
  const isLoggedIn = useTravelStore((s) => s.isLoggedIn);
  const openAuthModal = useTravelStore((s) => s.openAuthModal);

  // stay.soldOutDays를 Set으로 변환 (백엔드 연동 시 API 응답값으로 대체)
  const [booking, setBooking] = useState(false);
  const soldOutDaysSet = useMemo(() => new Set(soldOutDays), [soldOutDays]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const preferredCheckIn = defaultCheckIn ?? todayStr();
  const preferredCheckOut = defaultCheckOut ?? addDaysStr(preferredCheckIn, 1);
  const { checkIn: initCheckIn, checkOut: initCheckOut } = resolveValidStayRange(
    preferredCheckIn,
    preferredCheckOut,
    soldOutDays,
  );

  const [checkIn, setCheckIn] = useState<string>(initCheckIn);
  const [checkOut, setCheckOut] = useState<string>(initCheckOut);
  const [selecting, setSelecting] = useState<'in' | 'out' | null>(null);
  const [adultCount, setAdultCount] = useState(defaultGuests ?? 2);
  const [roomCount, setRoomCount] = useState(defaultRooms ?? 1);

  // Calendar month navigation
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [calendarData, setCalendarData] = useState<Record<string, CalendarDayInfo>>({});
  const [knownPrices, setKnownPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    const fetchCalendar = async () => {
      const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
      try {
        const res = await get_inventory_calendar_api('ROOM', roomId, monthStr);
        if (res.success && active) {
          setCalendarData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch calendar:', err);
      }
    };
    fetchCalendar();
    return () => { active = false; };
  }, [calYear, calMonth, roomId]);

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

  const nightlyRate = stay.pricePerNight ?? 0;
  const BASE_CAPACITY = 2;
  const SURCHARGE_PER_PERSON = 20000;

  const cells = useMemo(() => {
    const rawCells = buildCalendarMonth(calYear, calMonth, nightlyRate, {
      weekendSurchargeRate: 0,
      disabledDays: soldOutDaysSet,
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
  }, [calYear, calMonth, nightlyRate, soldOutDaysSet, calendarData]);

  // Billing
  const isRangeSelected = !!(checkIn && checkOut);
  const nights = isRangeSelected ? countNights(checkIn, checkOut) : 0;

  const surchargePerNight = useMemo(() => {
    return adultCount > BASE_CAPACITY ? (adultCount - BASE_CAPACITY) * SURCHARGE_PER_PERSON : 0;
  }, [adultCount]);

  const rawTotal = useMemo(() => {
    if (!isRangeSelected) return 0;
    let total = 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const cur = new Date(start);
    while (cur < end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const price = knownPrices[dateStr] ?? nightlyRate;
      total += (price + surchargePerNight);
      cur.setDate(cur.getDate() + 1);
    }
    return total;
  }, [isRangeSelected, checkIn, checkOut, knownPrices, nightlyRate, surchargePerNight]);

  const finalTotal = rawTotal * roomCount;

  function buildBillingDesc(): string {
    if (!isRangeSelected) return '일정을 완료해 주세요';
    if (!hasDisplayPrice(nightlyRate)) return '—';
    const average = rawTotal / nights;
    const baseAverage = average - surchargePerNight;
    
    return (
      `₩${baseAverage.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}` +
      (surchargePerNight > 0 ? ` (+인원추가 ₩${surchargePerNight.toLocaleString()})` : '') +
      `/박 평균 × ${nights}박 × 객실 ${roomCount}개`
    );
  }

  // Check if any sold-out day falls within the occupied stay nights
  function hasSoldOutInRange(start: string, end: string): boolean {
    return !isStayRangeAvailable(start, end, soldOutDays);
  }

  // Calendar click
  function handleCellClick(dateStr: string, disabled: boolean) {
    if (disabled) return;
    if (selecting === null || selecting === 'in') {
      setCheckIn(dateStr);
      setCheckOut('');
      setSelecting('out');
    } else {
      if (dateStr <= checkIn) {
        // Clicked before or on check-in → restart from here
        setCheckIn(dateStr);
        setCheckOut('');
        setSelecting('out');
      } else {
        // Validate: no sold-out day inside the range
        if (hasSoldOutInRange(checkIn, dateStr)) {
          addToast(
            '⚠️ 예약 불가 기간 포함 — 선택하신 일정 사이에 이미 매진된 품절(Sold Out) 일자가 포함되어 예약할 수 없습니다.',
            'warning'
          );
          // Reset: use the last clicked date as new check-in
          setCheckIn(dateStr);
          setCheckOut('');
          setSelecting('out');
          return;
        }
        setCheckOut(dateStr);
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
      addToast('로그인 후에 숙소를 예약하실 수 있습니다.', 'warning');
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
      const res = await book_stay_api({
        roomId,
        checkIn,
        checkOut,
        guests: adultCount,
        totalPrice: finalTotal,
      });
      if (!res.success || !res.data?.reservationId) {
        addToast(res.message || '숙소 예약에 실패했습니다.', 'warning');
        return;
      }
      onClose();
      navigate('/payment', {
        state: buildPaymentCheckout({
          reservationType: 'ROOM',
          reservationId: res.data.reservationId,
          productTitle: stay.title,
          productSubtitle: stay.location,
          productImageUrl: hasDisplayImage(stay.imageUrl) ? stay.imageUrl : undefined,
          categoryLabel: '숙소',
          categoryIcon: 'fa-hotel',
          totalAmount: res.data.totalPrice ?? finalTotal,
          usedMileage: 0,
          dateSummary: `${checkIn} ~ ${checkOut} (${nights}박)`,
          detailLines: [
            ...(hasDisplayPrice(nightlyRate)
              ? [`₩${(rawTotal / nights).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}/박 평균 × ${nights}박 × 객실 ${roomCount}개`]
              : []),
            `객실 ${roomCount}개 / 성인 ${adultCount}명`,
          ],
          returnPath: '/',
        }),
      });
    } catch (err: unknown) {
      addToast(extractApiErrorMessage(err, '숙소 예약 중 오류가 발생했습니다.'), 'warning');
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '580px',
          maxWidth: '95%',
          padding: '1.8rem',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
          animation: 'zoomIn 0.22s ease',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '18px', right: '18px',
            background: 'none', border: 'none',
            fontSize: '1.2rem', color: '#717171',
            cursor: 'pointer', lineHeight: 1,
            padding: '4px',
          }}
        >
          <i className="fa-solid fa-xmark" />
        </button>

        <StayDetailHeader stay={stay} />

        {/* ── Scrollable Body ── */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.4rem', marginBottom: '0.8rem' }}>
          {stay.description && <StayDetailDescription description={stay.description} />}

          <StayDetailDateBanner
            checkIn={checkIn}
            checkOut={checkOut}
            isRangeSelected={isRangeSelected}
            nights={nights}
          />

          <StayDetailCalendar
            calYear={calYear}
            calMonth={calMonth}
            cells={cells}
            checkIn={checkIn}
            checkOut={checkOut}
            onPrevMonth={() => {
              if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
              else setCalMonth(m => m - 1);
            }}
            onNextMonth={() => {
              if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
              else setCalMonth(m => m + 1);
            }}
            onCellClick={handleCellClick}
          />

          <StayDetailGuestPicker
            adultCount={adultCount}
            roomCount={roomCount}
            onAdultChange={setAdultCount}
            onRoomChange={setRoomCount}
          />
        </div>

        <StayDetailFooter
          isRangeSelected={isRangeSelected}
          nights={nights}
          roomCount={roomCount}
          finalTotal={finalTotal}
          billingDesc={buildBillingDesc()}
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
