/**
 * 앱 공개 API (app-admin-service, port 8086)
 * 인증 불필요 — 모든 사용자가 조회 가능.
 * /api/v1/app-admin/app/* 경로.
 */
import { apiClient } from './client';

export interface NoticeItem {
  public_id: string;
  title: string;
  content: string;
  pinned: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaqItem {
  publicId: string;
  question: string;
  answer: string;
  category: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const noticesApi = {
  listPublished: () => apiClient.get<unknown, NoticeItem[]>('/app-admin/app/notices'),
  getOne: (publicId: string) =>
    apiClient.get<unknown, NoticeItem>(`/app-admin/app/notices/${publicId}`),
};

export const faqsApi = {
  listPublished: (category?: string) =>
    apiClient.get<unknown, FaqItem[]>('/app-admin/app/faqs', {
      params: category ? { category } : undefined,
    }),
};
