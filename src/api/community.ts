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

/** 게시글 카테고리 (백엔드 enum SSOT). API 요청/응답 모두 대문자. */
export type PostCategory =
  | 'LIFE_INFO'
  | 'JOB'
  | 'VISA'
  | 'COUNTRY'
  | 'RESIDENCE'
  | 'QUESTION'
  | 'FREE';

/** 게시글 목록 한 건 (백엔드 PostSummaryResponse). 실제 응답은 snake_case(Jackson 전역). */
export interface PostSummaryItem {
  public_id: string;
  /** 카테고리 (예: "JOB"). */
  category: string;
  title: string;
  /** 본문 미리보기 — 앞 100자, 초과 시 … 표기. */
  content_preview: string;
  author_nickname: string;
  like_count: number;
  comment_count: number;
  /** 작성 시각 (ISO 8601 UTC Z). */
  created_at: string;
}

/** 게시글 목록·검색 응답 (GET /community/posts) — 페이지 메타 포함. */
export interface PostListResponse {
  posts: PostSummaryItem[];
  /** 현재 페이지 (0부터). */
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/** 게시글 목록·검색 쿼리 파라미터 (전부 선택). */
export interface PostListParams {
  /** 카테고리 필터 (미지정 시 전체). */
  category?: string;
  /** 제목·본문 검색어. */
  keyword?: string;
  /** 정렬 (예: "latest" / "popular" — 백엔드 정의 따름). */
  sort?: string;
  /** 0부터. */
  page?: number;
  size?: number;
}

/** 게시글 단건 조회 응답 (GET /community/posts/{id}). 실제 응답은 snake_case. */
export interface PostDetailResponse {
  public_id: string;
  category: string;
  title: string;
  /** 본문 전체. */
  content: string;
  author_nickname: string;
  /** 작성자 인증 배지 여부. */
  author_is_verified: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

/** 댓글 한 건 (백엔드 CommentResponse). */
export interface CommentItem {
  public_id: string;
  post_public_id: string;
  /** 대댓글이면 부모 댓글 id, 최상위면 null. */
  parent_comment_public_id: string | null;
  content: string;
  author_nickname: string;
  author_is_verified: boolean;
  created_at: string;
}

/** 댓글 목록 응답 (GET /community/posts/{id}/comments) — 페이지 메타 포함. */
export interface CommentListResponse {
  comments: CommentItem[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/** 게시글 작성 요청 body (POST /community/posts). 전부 필수. */
export interface PostCreateRequest {
  /** 카테고리 — 백엔드 enum 대문자 (예: "JOB", "LIFE_INFO"). */
  category: string;
  title: string;
  content: string;
}

// ---------- API 함수 ----------

export const communityApi = {
  /**
   * 주요 QnA 목록 조회 (api-spec §8).
   * 인증 불필요(SecurityConfig permitAll). category 미입력 시 QUESTION 카테고리만 반환.
   */
  getQna: (params?: { category?: string; size?: number }) =>
    apiClient.get<unknown, QnaListResponse>('/community/qna', { params }),

  /**
   * 게시글 목록·검색 조회 (200) — 카테고리·검색어·정렬·페이지로 게시글을 조회한다.
   *
   * <p>모든 파라미터 선택. category 미지정 시 전체, keyword로 제목·본문 검색.
   * 응답에 페이지 메타(page/size/total_elements/total_pages)와 posts 배열이 함께 온다.
   * 인증 불필요(공개 API).
   */
  getPosts: (params?: PostListParams) =>
    apiClient.get<unknown, PostListResponse>('/community/posts', { params }),

  /**
   * 게시글 단건 조회 (200) — public_id로 게시글 상세를 조회한다.
   *
   * <p>존재하지 않으면 COMMUNITY4001(404), public_id 형식 오류 COMMON4001(400) → ApiException.
   */
  getPostDetail: (postId: string) =>
    apiClient.get<unknown, PostDetailResponse>(`/community/posts/${postId}`),

  /**
   * 댓글 목록 조회 (200) — 게시글의 댓글을 페이지로 조회한다. page/size 선택(0부터).
   */
  getComments: (postId: string, params?: { page?: number; size?: number }) =>
    apiClient.get<unknown, CommentListResponse>(`/community/posts/${postId}/comments`, { params }),

  /**
   * 게시글 작성 (201) — 성공 시 생성된 게시글(PostDetailResponse)을 반환한다.
   *
   * <p>필수값 누락·잘못된 category는 COMMON4001(400) → ApiException. 인증 필요(AUTH4011).
   * 작성 후 목록 갱신은 ['community','posts'] invalidate(useCreatePost hook가 처리).
   */
  createPost: (body: PostCreateRequest) =>
    apiClient.post<unknown, PostDetailResponse>('/community/posts', body),

  // TODO: 다음 사이클에서 추가
  //   updatePost, deletePost, likePost, unlikePost
  //   createComment, deleteComment
};
