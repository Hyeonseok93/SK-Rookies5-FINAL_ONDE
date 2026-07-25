import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravelStore } from '@/store/useTravelStore';

/**
 * 외부 PG 리다이렉트 콜백 경로.
 * ONDE는 인앱 지갑 결제만 지원하므로 콜백 파라미터를 파싱·승인하지 않는다.
 */
export const PaymentCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useTravelStore((s) => s.addToast);

  useEffect(() => {
    addToast(
      '외부 결제 콜백은 지원되지 않습니다. 결제는 앱 내 결제 화면에서 완료해 주세요.',
      'warning'
    );
    navigate('/mypage', { replace: true });
  }, [navigate, addToast]);

  return (
    <div className="payment-page page-hero-gap">
      <div className="payment-shell payment-success-panel">
        <div className="payment-success-icon">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h2 className="payment-success-title">지원되지 않는 결제 콜백</h2>
        <p className="payment-success-desc">
          ONDE 결제는 앱 내에서만 완료됩니다. 마이페이지로 이동합니다.
        </p>
      </div>
    </div>
  );
};
