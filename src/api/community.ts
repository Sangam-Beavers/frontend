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
  /**
   * 작성 언어 코드(ko/en/vi/fil). 목록 카드의 "Translate" 버튼 가드용 —
   * `i18n.language`와 같으면 버튼 숨김. 백엔드 #161 머지 전 응답엔 없을 수 있어 optional.
   */
  language?: string;
  /** 작성자 식별자(UUID). 기본 아바타(identicon) 시드 — 마이페이지와 동일 시드라 같은 사용자는 같은 그림. */
  author_public_id: string;
  author_nickname: string;
  /** 작성자 프로필 사진 URL. 미설정 시 null — 프론트는 기본 아바타로 대체. */
  author_profile_image_url: string | null;
  /**
   * 작성자 신뢰등급. 값: 'NEWCOMER' | 'VERIFIED' (Phase 1) — 아바타 테두리 톤 매핑(이슈 #175).
   * 수동 추가 — BE #194 배포 전 응답엔 없어 optional(누락 시 프론트는 회색 폴백).
   * TODO: BE #194 배포 후 openapi 재생성 필요.
   */
  author_trust_grade?: string;
  /** 작성자 아바타 색조 회전 각도(0~359°). 마이페이지 '색깔 변경' 저장값 — hue-rotate 표시용. 누락 시 0. */
  author_avatar_hue?: number;
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
  /** 작성자 식별자(UUID). 기본 아바타(identicon) 시드 — 마이페이지와 동일 시드라 같은 사용자는 같은 그림. */
  author_public_id: string;
  author_nickname: string;
  /** 작성자 프로필 사진 URL. 미설정 시 null — 프론트는 기본 아바타로 대체. */
  author_profile_image_url: string | null;
  /** 작성자 인증 배지 여부. */
  author_is_verified: boolean;
  /** 작성자 신뢰등급(NEWCOMER/VERIFIED/CONNECTED/TRUSTED/GOLD). 누락 시 NEWCOMER 폴백. */
  author_trust_grade?: string;
  /** 작성자 아바타 색조 회전 각도(0~359°). 마이페이지 저장값 — 미설정 시 0. */
  author_avatar_hue?: number;
  /** 요청자가 작성자인지 — 수정·삭제 노출 판단. 비로그인/타인은 false. */
  is_author: boolean;
  like_count: number;
  /**
   * 요청자가 이 글을 좋아요했는지 — 하트 초기 상태용.
   * 백엔드 미제공 시 undefined → 화면은 "미관여(♡)"로 간주하고, 첫 클릭의 409(이미 좋아요)로 보정한다.
   */
  is_liked?: boolean;
  comment_count: number;
  created_at: string;
  updated_at: string;
  /**
   * 원문 언어 코드 (예: "ko" / "en" / "vi" / "fil"). 백엔드 #161에서 추가 예정 — 호환을 위해 optional.
   *
   * <p>"번역 보기" 버튼 노출 가드용 — 사용자 i18n.language와 같으면 버튼을 숨긴다.
   * 백엔드가 아직 안 내려주는 동안은 undefined → 버튼은 항상 노출(있는 그대로 사용자가 시도).
   */
  language?: string;
}

/** 좋아요 저장/취소 응답 (POST·DELETE /community/posts/{id}/likes). */
export interface PostLikeResponse {
  post_public_id: string;
  /** 갱신된 좋아요 수. */
  like_count: number;
  /** 요청자의 현재 좋아요 여부 (저장=true, 취소=false). */
  liked: boolean;
}

/** 관심글 목록 한 건 (LikedPostSummaryResponse) — 게시글 요약 + 좋아요 누른 시각. */
export interface LikedPostSummaryItem extends PostSummaryItem {
  /** 좋아요 누른 시각 (ISO 8601 UTC Z). */
  liked_at: string;
}

/** 관심글 목록 응답 (GET /community/posts/liked) — 페이지 메타 포함. */
export interface LikedPostListResponse {
  posts: LikedPostSummaryItem[];
  /** 현재 페이지 (0부터). */
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/** 관심글 목록 쿼리 파라미터 (전부 선택). */
export interface LikedPostListParams {
  /** 정렬 — latest(좋아요 누른 시각순, 기본) / popular(좋아요 수순). */
  sort?: string;
  /** 0부터. */
  page?: number;
  size?: number;
}

/** 댓글 한 건 (백엔드 CommentResponse). */
export interface CommentItem {
  public_id: string;
  post_public_id: string;
  /** 대댓글이면 부모 댓글 id, 최상위면 null. */
  parent_comment_public_id: string | null;
  content: string;
  /** 작성자 식별자(UUID). 기본 아바타(identicon) 시드 — 마이페이지와 동일 시드라 같은 사용자는 같은 그림. */
  author_public_id: string;
  author_nickname: string;
  /** 작성자 프로필 사진 URL. 미설정 시 null — 프론트는 기본 아바타로 대체. */
  author_profile_image_url: string | null;
  author_is_verified: boolean;
  /** 작성자 아바타 색조 회전 각도(0~359°). 마이페이지 저장값 — 미설정 시 0. */
  author_avatar_hue?: number;
  /** 요청자가 작성자인지 — 댓글 삭제 노출 판단. 비로그인/타인은 false. */
  is_author: boolean;
  created_at: string;
  /**
   * 댓글 원문 언어 코드. 백엔드 #161에서 추가 예정 — 호환을 위해 optional.
   * 게시글과 동일하게 i18n.language와 같으면 "번역 보기" 버튼을 숨긴다.
   */
  language?: string;
}

/** 댓글 목록 응답 (GET /community/posts/{id}/comments) — 페이지 메타 포함. */
export interface CommentListResponse {
  comments: CommentItem[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/** 게시글 작성 요청 body (POST /community/posts). category/title/content 필수. */
export interface PostCreateRequest {
  /** 카테고리 — 백엔드 enum 대문자 (예: "JOB", "LIFE_INFO"). */
  category: string;
  title: string;
  content: string;
  /**
   * 작성 언어 코드(ko/en/vi/fil) — 프론트가 명시 전달한다(api-spec §2).
   * 미전송 시 백엔드가 ko 기본값. 화이트리스트 외 값은 COMMUNITY4003(400).
   * 보통 useCreatePost hook가 본문에서 언어를 감지(franc)해 자동 주입하므로 호출 측에서 직접 채울
   * 필요는 없다 — 앱 UI 언어가 아니라 실제 본문 언어로 저장된다(한국어 앱으로 영어 글 작성 등 대응).
   */
  language?: string;
}

/** 댓글 작성 요청 body (POST /community/posts/{id}/comments). content 필수. 대댓글 미지원. */
export interface CommentCreateRequest {
  content: string;
}

/** 게시글 수정 요청 body (PATCH /community/posts/{id}). 부분 수정 — 보낸 필드만 변경. */
export interface PostUpdateRequest {
  category?: string;
  title?: string;
  content?: string;
}

/**
 * 게시글 동적 번역 응답 (GET /community/posts/{id}/translation, 이슈 #160 / 백엔드 #161).
 *
 * <p>사용자가 "번역 보기" 버튼을 누르면 호출 — 트리거 lazy. 목록에서는 호출하지 않는다.
 * 응답 언어는 요청 시 `language` 쿼리 파라미터 그대로 (예: 'ko'/'en'/'vi'/'fil').
 * 같은 언어 요청은 프론트에서 가드(버튼 비노출)하므로 정상 흐름에선 안 옴.
 */
export interface PostTranslationResponse {
  /** 번역된 제목. */
  translated_title: string;
  /** 번역된 본문. */
  translated_content: string;
  /** 번역 결과 언어 코드 (요청한 language와 동일). */
  translated_language: string;
}

/**
 * 댓글 동적 번역 응답 (GET /community/posts/{postId}/comments/{commentId}/translation, 이슈 #160 / 백엔드 #161).
 *
 * <p>게시글 번역과 동일 패턴 — 댓글은 제목이 없어 content만 반환한다.
 */
export interface CommentTranslationResponse {
  /** 번역된 댓글 본문. */
  translated_content: string;
  /** 번역 결과 언어 코드 (요청한 language와 동일). */
  translated_language: string;
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

  /**
   * 게시글 수정 (200) — 보낸 필드만 부분 수정한다. 성공 시 수정된 게시글(PostDetailResponse) 반환.
   *
   * <p>본인 글이 아니면 COMMON4031(403), 없는 글 COMMUNITY4001(404),
   * 잘못된 category/형식 COMMON4001(400) → ApiException.
   */
  updatePost: (postId: string, body: PostUpdateRequest) =>
    apiClient.patch<unknown, PostDetailResponse>(`/community/posts/${postId}`, body),

  /**
   * 게시글 삭제 (200, data: null). 본인 글만 삭제 가능.
   *
   * <p>본인 글이 아니면 COMMON4031(403), 없는 글 COMMUNITY4001(404) → ApiException.
   */
  deletePost: (postId: string) => apiClient.delete<unknown, null>(`/community/posts/${postId}`),

  /**
   * 댓글 작성 (201) — 성공 시 생성된 댓글(CommentItem)을 반환한다.
   *
   * <p>content 필수. 빈 값·형식 오류는 COMMON4001(400), 없는 글 COMMUNITY4001(404) → ApiException.
   * 인증 필요(AUTH4011). 작성 후 갱신은 ['community','comments',postId] invalidate(useCreateComment hook).
   */
  createComment: (postId: string, body: CommentCreateRequest) =>
    apiClient.post<unknown, CommentItem>(`/community/posts/${postId}/comments`, body),

  /**
   * 댓글 삭제 (200, data: null). 본인 댓글만 삭제 가능.
   *
   * <p>본인 댓글이 아니면 COMMON4031(403), 없는 댓글/글 COMMUNITY4001(404) → ApiException.
   * 삭제 후 갱신은 ['community','comments',postId] invalidate(useDeleteComment hook).
   */
  deleteComment: (postId: string, commentId: string) =>
    apiClient.delete<unknown, null>(`/community/posts/${postId}/comments/${commentId}`),

  /**
   * 관심글 저장(좋아요) (201) — like_count +1. 갱신된 like_count·liked(=true)를 반환한다.
   *
   * <p>이미 좋아요한 글이면 COMMON4091(409), 없거나 삭제된 글 COMMUNITY4001(404) → ApiException.
   * 인증 필요(AUTH4011).
   */
  likePost: (postId: string) =>
    apiClient.post<unknown, PostLikeResponse>(`/community/posts/${postId}/likes`),

  /**
   * 관심글 취소(좋아요 취소) (200) — like_count -1. 갱신된 like_count·liked(=false)를 반환한다.
   *
   * <p>안 누른 글을 취소하면 멱등 no-op(200, 변화 없음). 없는 글 COMMUNITY4001(404) → ApiException.
   * 인증 필요(AUTH4011).
   */
  unlikePost: (postId: string) =>
    apiClient.delete<unknown, PostLikeResponse>(`/community/posts/${postId}/likes`),

  /**
   * 관심글 목록 조회 (200) — 요청자가 좋아요한 게시글을 페이지로 조회한다.
   *
   * <p>sort latest(기본, 좋아요 누른 시각순)·popular(좋아요 수순). 각 항목에 liked_at 포함,
   * 삭제된 글은 제외. 잘못된 sort/page/size는 COMMON4001(400) → ApiException. 인증 필요(AUTH4011).
   */
  getLikedPosts: (params?: LikedPostListParams) =>
    apiClient.get<unknown, LikedPostListResponse>('/community/posts/liked', { params }),

  /**
   * 게시글 동적 번역 조회 (200) — 이슈 #160 / 백엔드 #161.
   *
   * <p>사용자가 "번역 보기" 버튼을 누른 시점에만 호출(lazy). 대상 언어는 현재 i18n.language.
   * 원문 언어와 같으면 프론트에서 호출 자체를 막는다(버튼 비노출).
   *
   * <p>실패 코드:
   * <ul>
   *   <li>COMMUNITY4001 — 없는 게시글(404)</li>
   *   <li>COMMUNITY4003 — 지원하지 않는 언어(400)</li>
   *   <li>COMMUNITY4004 — 본문이 너무 김(400)</li>
   * </ul>
   *
   * <p>응답은 캐시해 두는 편이 좋다 — 같은 (post, language) 조합에 대한 두 번째 클릭은
   * react-query 캐시로 즉시 반환된다(useMutation 대신 useQuery + enabled 토글 패턴).
   */
  getPostTranslation: (postId: string, language: string) =>
    apiClient.get<unknown, PostTranslationResponse>(`/community/posts/${postId}/translation`, {
      params: { language },
    }),

  /**
   * 댓글 동적 번역 조회 (200) — 이슈 #160 / 백엔드 #161.
   *
   * <p>게시글 번역과 동일 패턴. 댓글은 제목이 없어 content만 반환한다.
   * 실패 코드도 게시글과 동일(COMMUNITY4001/4003/4004).
   */
  getCommentTranslation: (postId: string, commentId: string, language: string) =>
    apiClient.get<unknown, CommentTranslationResponse>(
      `/community/posts/${postId}/comments/${commentId}/translation`,
      { params: { language } }
    ),
};
