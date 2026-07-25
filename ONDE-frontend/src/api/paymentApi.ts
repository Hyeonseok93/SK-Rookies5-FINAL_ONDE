import { userAxios } from '@/api/axiosInstance';
import type { PaymentPrepareDto, PaymentReservationType, PaymentValidateDto } from '@/types/payment';
import { unwrapApi } from '@/utils/apiResponse';

export interface PaymentPrepareRequest {
  reservationId: number;
  reservationType: PaymentReservationType;
  usedMileage: number;
}

export interface PaymentValidateRequest {
  impUid: string;
  merchantUid: string;
  pgAmount: number;
}

export const prepare_payment_api = async (
  body: PaymentPrepareRequest
): Promise<{ success: boolean; data: PaymentPrepareDto; message: string }> => {
  const raw = await userAxios.post('/api/v1/payments/prepare', body);
  const res = unwrapApi<Record<string, unknown>>(raw);
  const d = res.data ?? {};
  const walletTxId =
    d.walletTxId != null && String(d.walletTxId).trim() !== ''
      ? String(d.walletTxId)
      : undefined;
  const impUid =
    d.impUid != null && String(d.impUid).trim() !== ''
      ? String(d.impUid)
      : undefined;
  if (d.pgAmount == null || d.pgAmount === '') {
    return {
      success: false,
      message: res.message || '서버 결제 금액이 없습니다.',
      data: {
        merchantUid: '',
        pgAmount: 0,
        usedMileage: 0,
        reservationId: 0,
      },
    };
  }
  return {
    success: res.success,
    message: res.message,
    data: {
      merchantUid: String(d.merchantUid ?? ''),
      pgAmount: Number(d.pgAmount),
      usedMileage: Number(d.usedMileage ?? 0),
      reservationId: Number(d.reservationId ?? 0),
      ...(walletTxId ? { walletTxId } : {}),
      ...(impUid ? { impUid } : {}),
    },
  };
};

export const validate_payment_api = async (
  body: PaymentValidateRequest
): Promise<{ success: boolean; data: PaymentValidateDto; message: string }> => {
  const raw = await userAxios.post('/api/v1/payments/validate', body);
  const res = unwrapApi<Record<string, unknown>>(raw);
  const d = res.data ?? {};
  return {
    success: res.success,
    message: res.message,
    data: {
      paymentId: Number(d.paymentId ?? 0),
      merchantUid: String(d.merchantUid ?? ''),
      status: String(d.status ?? ''),
      amount: Number(d.pgAmount ?? d.totalAmount ?? 0),
    },
  };
};

export const cancel_payment_api = async (
  paymentId: number,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  const raw = await userAxios.post(`/api/v1/payments/${paymentId}/cancel`, { reason });
  const res = unwrapApi<unknown>(raw);
  return { success: res.success, message: res.message };
};
