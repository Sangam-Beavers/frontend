/**
 * 앱 관리 API (app-admin-service, port 8086)
 * - 공개 읽기:  GET /api/v1/app/{resource}
 * - 관리자 쓰기: POST/PATCH/DELETE /api/v1/admin/app/{resource}
 *
 * apiClient request interceptor가 JWT Bearer 헤더 자동 부착.
 * response interceptor가 ApiResponse envelope 자동 언래핑.
 * apiClient.get<unknown, T> — 두 번째 제네릭이 interceptor 반환 타입.
 */
import { apiClient } from './client';

// ─────── 공통 타입 ────────────────────────────────────────────────────────────

export interface NoticeResponse {
  public_id: string;
  title: string;
  content: string;
  pinned: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaqResponse {
  publicId: string;
  question: string;
  answer: string;
  category: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeePolicyResponse {
  publicId: string;
  serviceType: string;
  feeType: string;
  feeValue: string;
  minFee: string | null;
  maxFee: string | null;
  currency: string;
  active: boolean;
  updatedAt: string;
}

export interface ServiceSettingResponse {
  public_id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
  active: boolean;
  updated_at: string;
}

export interface AppMemberResponse {
  user_public_id: string;
  email: string;
  name: string;
  nickname: string;
  nationality: string;
  status: 'ACTIVE' | 'SUSPENDED';
  kyc_status: string;
  community_banned: boolean;
  joined_at: string;
}

export interface AppMemberPageResponse {
  members: AppMemberResponse[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

export interface UserPostView {
  public_id: string;
  category: string;
  title: string;
  comment_count: number;
  like_count: number;
  created_at: string;
}

export interface UserCommentView {
  public_id: string;
  post_public_id: string;
  content: string;
  like_count: number;
  created_at: string;
}

export interface UserActivityResponse {
  posts: UserPostView[];
  post_page: number;
  post_size: number;
  post_total: number;
  comments: UserCommentView[];
  comment_page: number;
  comment_size: number;
  comment_total: number;
}

// ─────── 공지사항 ──────────────────────────────────────────────────────────────

export const noticeApi = {
  listAll: () => apiClient.get<unknown, NoticeResponse[]>('/admin/app/notices'),
  create: (data: { title: string; content: string; pinned?: boolean; published?: boolean }) =>
    apiClient.post<unknown, NoticeResponse>('/admin/app/notices', data),
  update: (
    publicId: string,
    data: Partial<{ title: string; content: string; pinned: boolean; published: boolean }>
  ) => apiClient.patch<unknown, NoticeResponse>(`/admin/app/notices/${publicId}`, data),
  delete: (publicId: string) => apiClient.delete<unknown, void>(`/admin/app/notices/${publicId}`),
};

// ─────── FAQ ─────────────────────────────────────────────────────────────────

export const faqApi = {
  listAll: () => apiClient.get<unknown, FaqResponse[]>('/admin/app/faqs'),
  create: (data: {
    question: string;
    answer: string;
    category: string;
    published?: boolean;
    sortOrder?: number;
  }) => apiClient.post<unknown, FaqResponse>('/admin/app/faqs', data),
  update: (
    publicId: string,
    data: Partial<{
      question: string;
      answer: string;
      category: string;
      published: boolean;
      sortOrder: number;
    }>
  ) => apiClient.patch<unknown, FaqResponse>(`/admin/app/faqs/${publicId}`, data),
  delete: (publicId: string) => apiClient.delete<unknown, void>(`/admin/app/faqs/${publicId}`),
};

// ─────── 수수료 정책 (EXCHANGE: 환전, CASHOUT: 외부 은행 출금) ────────────────

export const feePolicyApi = {
  listAll: () => apiClient.get<unknown, FeePolicyResponse[]>('/admin/app/fee-policies'),
  update: (
    publicId: string,
    data: Partial<{
      feeType: string;
      feeValue: string;
      minFee: string;
      maxFee: string;
      active: boolean;
    }>
  ) => apiClient.patch<unknown, FeePolicyResponse>(`/admin/app/fee-policies/${publicId}`, data),
};

// ─────── 서비스 설정 ────────────────────────────────────────────────────────────

export const serviceSettingApi = {
  listAll: () => apiClient.get<unknown, ServiceSettingResponse[]>('/admin/app/settings'),
  create: (data: {
    setting_key: string;
    setting_value: string;
    description?: string;
    active?: boolean;
  }) => apiClient.post<unknown, ServiceSettingResponse>('/admin/app/settings', data),
  update: (
    publicId: string,
    data: Partial<{ setting_value: string; description: string; active: boolean }>
  ) => apiClient.patch<unknown, ServiceSettingResponse>(`/admin/app/settings/${publicId}`, data),
};

// ─────── 환율 정책 ────────────────────────────────────────────────────────────

export interface ExchangeRatePolicyResponse {
  publicId: string;
  currencyCode: string;
  spread: string;
  active: boolean;
  updatedAt: string;
}

export const exchangeRatePolicyApi = {
  listAll: () =>
    apiClient.get<unknown, ExchangeRatePolicyResponse[]>('/admin/app/exchange-rate-policies'),
  create: (data: { currencyCode: string; spread: string; active: boolean }) =>
    apiClient.post<unknown, ExchangeRatePolicyResponse>('/admin/app/exchange-rate-policies', data),
  update: (publicId: string, data: Partial<{ spread: string; active: boolean }>) =>
    apiClient.patch<unknown, ExchangeRatePolicyResponse>(
      `/admin/app/exchange-rate-policies/${publicId}`,
      data
    ),
};

// ─────── 신고 관리 ────────────────────────────────────────────────────────────

export interface ReportedAuthorSummary {
  author_public_id: string;
  name: string | null;
  nickname: string | null;
  total_report_count: number;
  reported_content_count: number;
}

export interface ReportedAuthorPageResponse {
  authors: ReportedAuthorSummary[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

export interface MemberReportItemResponse {
  post_public_id: string;
  post_title: string | null;
  author_public_id: string;
  target_type: 'POST' | 'COMMENT';
  category: 'SPAM' | 'ABUSE' | 'FRAUD' | 'SEXUAL' | 'ETC';
  report_count: number;
  status: 'PENDING' | 'RESOLVED_DELETED' | 'DISMISSED';
  last_reported_at: string;
}

export interface MemberReportsResponse {
  author_public_id: string;
  name: string | null;
  nickname: string | null;
  reports: MemberReportItemResponse[];
}

export const adminReportApi = {
  // 신고당한 회원 목록
  getReportedAuthors: (params?: { page?: number; size?: number }) =>
    apiClient.get<unknown, ReportedAuthorPageResponse>('/admin/app/reports', { params }),
  // 특정 회원이 받은 신고 상세
  getMemberReports: (userPublicId: string) =>
    apiClient.get<unknown, MemberReportsResponse>(`/admin/app/members/${userPublicId}/reports`),
};

// ─────── 회원 관리 ────────────────────────────────────────────────────────────

export const adminMemberApi = {
  // 프론트 → app-admin-service(8086) → member-service(8081) 내부 API
  search: (params?: { q?: string; kycStatus?: string; page?: number; size?: number }) =>
    apiClient.get<unknown, AppMemberPageResponse>('/admin/app/members', { params }),
  changeStatus: (userPublicId: string, status: 'ACTIVE' | 'SUSPENDED') =>
    apiClient.patch<unknown, void>(`/admin/app/members/${userPublicId}/status`, null, {
      params: { status },
    }),
  setCommunityBan: (userPublicId: string, banned: boolean) =>
    apiClient.patch<unknown, void>(`/admin/app/members/${userPublicId}/community-ban`, null, {
      params: { banned },
    }),
  // 프론트 → app-admin-service(8086) → community-service(8083) 내부 API
  getActivity: (
    userPublicId: string,
    params?: { postPage?: number; commentPage?: number; size?: number }
  ) =>
    apiClient.get<unknown, UserActivityResponse>(`/admin/app/members/${userPublicId}/activity`, {
      params,
    }),
};
