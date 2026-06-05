import { ApiException } from '@/api';

/**
 * 커뮤니티 게시글(작성·수정·삭제) 도메인의 백엔드 에러 코드를 사용자용 메시지로 매핑한다.
 *
 * 매핑 없는 code는 백엔드 message를 그대로 노출하고, ApiException이 아니면 일반 문구로 폴백한다.
 */
export function communityErrorMessage(err: unknown): string {
  if (err instanceof ApiException) {
    switch (err.code) {
      case 'COMMON4031':
        return '본인이 작성한 글만 수정·삭제할 수 있어요.';
      case 'COMMUNITY4001':
        return '이미 삭제되었거나 존재하지 않는 글이에요.';
      case 'COMMON4001':
        return '입력 값을 다시 확인해 주세요. (제목·본문·카테고리)';
      default:
        return err.message;
    }
  }
  return '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.';
}
