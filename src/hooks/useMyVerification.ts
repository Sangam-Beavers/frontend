import { useQuery } from '@tanstack/react-query';
import { ApiException } from '@/api';
import { verificationApi, type VerificationStatusResult } from '@/api/member';

/**
 * 내 신분증 인증 상태 조회 hook (api-spec — GET /api/v1/members/me/verification).
 *
 * <p>인증 이력 1건(가장 최근)을 반환한다. 마이페이지 닉네임 옆 '인증' 배지, 설정 '추가 인증' 옆 '완료'
 * 배지 표시에 사용. status === 'APPROVED'일 때만 인증 완료로 간주한다.
 *
 * <p><b>404 매핑 정책:</b> 인증 이력이 없는 신규 회원에게 백엔드는 404 MEMBER4001을 던지지만,
 * 화면 입장에선 "아직 인증 안 함" 상태로 자연스럽게 표시해야 한다. 그래서 queryFn에서 해당 에러만
 * 잡아 {@code null}로 매핑하고, 그 외 에러는 그대로 전파한다. 이렇게 두면:
 *   - data === null  → 미인증 (배지 미표시)
 *   - data.status === 'APPROVED' → 인증 완료 (배지 표시)
 *   - data.status === 'PENDING' / 'REJECTED' → 인증 진행/거절 (배지 미표시, 상세 페이지에서 안내)
 *
 * <p>staleTime 5분 — 인증 상태는 자주 안 바뀌고, 변경 시(인증 제출)는 호출 측에서 invalidate.
 */
export const useMyVerification = () =>
  useQuery<VerificationStatusResult | null>({
    queryKey: ['member', 'me', 'verification'],
    queryFn: async () => {
      try {
        return await verificationApi.getStatus();
      } catch (e) {
        // 인증 이력 없음 — 정상 흐름의 일부라 에러로 두지 않는다(매번 retry 부담도 회피).
        if (e instanceof ApiException && e.code === 'MEMBER4001') {
          return null;
        }
        throw e;
      }
    },
    staleTime: 5 * 60_000,
  });
