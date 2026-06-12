import { apiClient } from './client';

/**
 * reward(송금 적립 스탬프/쿠폰) API 호출 함수 모음 — 백엔드 wallet-service #215.
 *
 * - 모두 인증 필요(JWT) — interceptor가 토큰 자동 부착.
 * - 응답 타입은 인라인 snake_case로 작성한다(wallet.ts와 동일 컨벤션 — 실제 응답이 snake_case).
 * - envelope(ApiResponse)은 interceptor가 풀어, 호출 측은 data만 받는다.
 */

// ---------- Response 타입 (인라인, 백엔드 명세 기준 snake_case) ----------

/** GET /rewards/stamp-card 응답 (백엔드 StampCardResponse). */
export interface StampCardResponse {
  /** 현재 카드에서 채워진 스탬프 수(누적 % target). 카드 UI는 이 값/target을 쓴다. */
  current_count: number;
  /** 쿠폰 1장에 필요한 스탬프 수(카드 한 장의 칸 수). */
  target: number;
  /** 누적 적립 스탬프 총합(모든 사이클 포함). */
  total_stamps: number;
  /** 사용 가능한(발급·미사용) 쿠폰 수. */
  available_coupon_count: number;
}

/** 쿠폰 종류(백엔드 CouponType enum SSOT). 현재 "송금 수수료 무료 1회" 한 종류. */
export type CouponType = 'TRANSFER_FEE_FREE';

/** 쿠폰 상태(백엔드 CouponStatus enum SSOT). 현재 발급은 ISSUED만. */
export type CouponStatus = 'ISSUED' | 'USED' | 'EXPIRED';

/** 쿠폰 한 건 (백엔드 CouponListResponse.CouponItem). 시각은 ISO 8601 UTC Z. */
export interface CouponInfo {
  public_id: string;
  type: CouponType;
  status: CouponStatus;
  issued_at: string;
  expires_at: string;
}

/** GET /rewards/coupons 응답 (백엔드 CouponListResponse). 발급 최신순. */
export interface CouponListResponse {
  coupons: CouponInfo[];
}

// ---------- API 함수 ----------

export const rewardApi = {
  /**
   * 스탬프 카드 진행도 조회 (200) — 현재 카드 채워진 칸/목표/누적/사용가능 쿠폰 수.
   * 적립 이력이 없으면 0/target. 인증 누락은 AUTH4011(interceptor 처리).
   */
  getStampCard: () => apiClient.get<unknown, StampCardResponse>('/rewards/stamp-card'),

  /**
   * 보유 쿠폰 목록 조회 (200) — 발급 최신순. 보유 쿠폰이 없으면 빈 배열.
   * 인증 누락은 AUTH4011(interceptor 처리).
   */
  getCoupons: () => apiClient.get<unknown, CouponListResponse>('/rewards/coupons'),
};
