import { useQuery } from '@tanstack/react-query';
import { rewardApi, type CouponListResponse } from '@/api/reward';

/**
 * 보유 쿠폰 목록 조회 hook (GET /api/v1/rewards/coupons — 백엔드 #215).
 *
 * <p>발급 최신순. 보유 쿠폰이 없으면 coupons=[] 빈 배열. 쿠폰 발급은 송금 적립이 카드를 채울 때
 * 일어나므로, 송금 onSuccess에서 ['reward','coupons']를 invalidate해 최신화한다.
 *
 * @example
 *   const { data } = useCoupons();
 *   const coupons = data?.coupons ?? [];
 */
export const useCoupons = () =>
  useQuery<CouponListResponse>({
    queryKey: ['reward', 'coupons'],
    queryFn: () => rewardApi.getCoupons(),
    staleTime: 0,
  });
