import { isAdminRole } from '@/utils/memberRole';

/** 관리자 포탈 탭 ID */
export type AdminTabId = 'stat' | 'approve' | 'book' | 'user' | 'lbs' | 'settlement' | 'community' | 'password';

const USER_ADMIN_ROLES = new Set([
  'USER_ADMIN',
  'ROLE_USER_ADMIN',
  'GENERAL_ADMIN',
  'ROLE_GENERAL_ADMIN',
]);

const SELLER_ADMIN_ROLES = new Set([
  'SELLER_ADMIN',
  'ROLE_SELLER_ADMIN',
  'SALES_ADMIN',
  'ROLE_SALES_ADMIN',
]);

const SUPER_ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ROLE_SUPER_ADMIN']);

const SETTLEMENT_ACCESS_ROLES = new Set([
  'SUPER_ADMIN',
  'ROLE_SUPER_ADMIN',
  'SELLER_ADMIN',
  'ROLE_SELLER_ADMIN',
  'SALES_ADMIN',
  'ROLE_SALES_ADMIN',
]);

function normalizeRole(role: string): string {
  return role.trim().toUpperCase();
}

export function isUserAdmin(role: string | null | undefined): boolean {
  if (!role) return false;
  return USER_ADMIN_ROLES.has(normalizeRole(role));
}

/** 영업·판매 관리자 (정산·검수 실행 권한) */
export function isSellerAdmin(role: string | null | undefined): boolean {
  if (!role) return false;
  return SELLER_ADMIN_ROLES.has(normalizeRole(role));
}

export function isSuperAdmin(role: string | null | undefined): boolean {
  if (!role) return false;
  return SUPER_ADMIN_ROLES.has(normalizeRole(role));
}

/** USER_ADMIN — 상품 검수·예약 제어 없이 조회만 */
export function isViewOnlyAdmin(role: string | null | undefined): boolean {
  return isUserAdmin(role);
}

export function canApproveProducts(role: string | null | undefined): boolean {
  if (!role || !isAdminRole(role)) return false;
  return !isViewOnlyAdmin(role);
}

export function canManageMembers(role: string | null | undefined): boolean {
  return isSuperAdmin(role) || isUserAdmin(role);
}

export function canAccessSettlement(role: string | null | undefined): boolean {
  if (!role || !isAdminRole(role)) return false;
  return SETTLEMENT_ACCESS_ROLES.has(normalizeRole(role));
}

export function canDeployLbsMarkers(role: string | null | undefined): boolean {
  return isSuperAdmin(role);
}

export function canExportBookingCsv(role: string | null | undefined): boolean {
  return canApproveProducts(role);
}

export function canReadDashboardSummary(role: string | null | undefined): boolean {
  return isSuperAdmin(role) || isSellerAdmin(role);
}

export function canReadDashboardOperational(role: string | null | undefined): boolean {
  return isUserAdmin(role);
}

export function canReadDashboardCharts(role: string | null | undefined): boolean {
  return isSuperAdmin(role) || isSellerAdmin(role) || isUserAdmin(role);
}

/**
 * 관리자 사이드바 탭 접근.
 * - viewOnly(USER_ADMIN): stat / approve / book / community / password (approve·book은 조회)
 * - settlement: canAccessSettlement
 * - user: canManageMembers
 * - lbs: canDeployLbsMarkers (슈퍼만)
 * - mutate 권한은 canApproveProducts 등 별도 가드
 */
export function canAccessAdminTab(role: string | null | undefined, tab: AdminTabId): boolean {
  if (!role || !isAdminRole(role)) return false;

  switch (tab) {
    case 'settlement':
      return canAccessSettlement(role);
    case 'user':
      return canManageMembers(role);
    case 'lbs':
      return canDeployLbsMarkers(role);
    case 'stat':
    case 'approve':
    case 'book':
    case 'community':
    case 'password':
      return true;
    default:
      return false;
  }
}
