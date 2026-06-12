import { useQuery } from '@tanstack/react-query';
import { rewardApi, type StampCardResponse } from '@/api/reward';

/**
 * 송금 적립 스탬프 카드 조회 hook (GET /api/v1/rewards/stamp-card — 백엔드 #215).
 *
 * <p>적립은 송금 직후(백엔드 AFTER_COMMIT 동기 처리) 반영되므로, 송금 완료 화면 진입 시 조회하면
 * 최신값을 본다. 항상 최신을 보여야 하므로 staleTime=0 (useBalances와 동일 가이드).
 *
 * <p>적립 이력이 없어도 에러가 아니라 0/target 응답이 온다(빈 카드).
 *
 * @example
 *   const { data } = useStampCard();
 *   const filled = data?.current_count ?? 0;
 *   const target = data?.target ?? 5;
 */
export const useStampCard = () =>
  useQuery<StampCardResponse>({
    queryKey: ['reward', 'stamp-card'],
    queryFn: () => rewardApi.getStampCard(),
    staleTime: 0,
  });
