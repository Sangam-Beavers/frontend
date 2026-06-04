import { apiClient } from './client';

/**
 * community-service API 호출 함수 모음.
 *
 * - 타입은 5단계(OpenAPI → TS 자동 생성) 후 `@/types/api/community`에서 import.
 * - 지금은 인라인 타입으로 시작하고, 타입 생성 도입 시 교체한다.
 * - hook은 별도 src/hooks/use*.ts에서 TanStack Query로 감싼다 (관심사 분리).
 */

// ---------- 인라인 타입 (5단계 도입 후 @/types/api/community로 교체) ----------

export interface QnaPostItem {
  public_id: string;
  title: string;
  comment_count: number;
  created_at: string;
}

export interface QnaListResponse {
  posts: QnaPostItem[];
}

// ---------- API 함수 ----------

export const communityApi = {
  /**
   * 주요 QnA 목록 조회 (api-spec §8).
   * 인증 불필요(SecurityConfig permitAll). category 미입력 시 QUESTION 카테고리만 반환.
   */
  getQna: (params?: { category?: string; size?: number }) =>
    apiClient.get<unknown, QnaListResponse>('/community/qna', { params }),

  // TODO: 다음 사이클에서 추가
  //   getPosts, getPostDetail, createPost, deletePost, likePost, unlikePost
  //   getComments, createComment, deleteComment
};
