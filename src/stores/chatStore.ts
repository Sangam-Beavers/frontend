// ─────────────────────────────────────────────────────────────
// stores/chatStore.ts — 분석 결과 후속 질문 챗봇 전역 상태
//
// 시트를 여는 진입점이 두 곳(메인 FAB + 카드별 "더 묻기" 칩)이라 전역 상태가
// 필요하다. zustand로 가볍게 묶는다.
//
// 책임:
//  - 시트 열림/닫힘
//  - 현재 분석 문서 ID (시트 안에서 호출할 때 필요)
//  - 메시지 배열 (사용자/봇 + 스트리밍 중 부분 텍스트)
//  - session_id (다음 턴 이어가기)
//  - 초기 프롬프트 (AskMoreChip에서 미리 박아둘 때 사용)
//  - 진행중인 SSE AbortController (시트 닫힘 시 정리)
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** 봇 메시지는 스트리밍 도중 부분 텍스트가 누적된다. */
  text: string;
  /** 봇 메시지 한정 — 스트리밍 진행중 여부. */
  streaming?: boolean;
}

interface ChatState {
  // ── UI 상태 ───────────────────────────────────────
  isOpen: boolean;
  /** 시트가 열린 시점에 알고 있던 분석 문서 ID. */
  documentPublicId: string | null;
  /** 입력창에 미리 박아둘 텍스트 (AskMoreChip에서 사용). */
  initialPrompt: string;

  // ── 대화 상태 ─────────────────────────────────────
  messages: ChatMessage[];
  /** 백엔드가 발급한 세션 식별자. 다음 요청에 그대로 실어 보낸다. */
  sessionId: string | null;
  isStreaming: boolean;
  /** 진행 중인 SSE 취소용. 시트 닫기/페이지 이동 시 abort. */
  abortController: AbortController | null;

  // ── 액션 ──────────────────────────────────────────
  open: (documentPublicId: string, initialPrompt?: string) => void;
  close: () => void;
  setInitialPrompt: (text: string) => void;
  appendMessage: (msg: ChatMessage) => void;
  /** 마지막 봇 메시지에 토큰을 이어붙임. 스트리밍 중에 매 토큰마다 호출. */
  appendToLastAssistant: (chunk: string) => void;
  finishStreaming: (sessionId: string) => void;
  failStreaming: (errorText: string) => void;
  setAbortController: (controller: AbortController | null) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  isOpen: false,
  documentPublicId: null as string | null,
  initialPrompt: '',
  messages: [] as ChatMessage[],
  sessionId: null as string | null,
  isStreaming: false,
  abortController: null as AbortController | null,
};

/**
 * 새 ID는 crypto.randomUUID 사용. (Vite 환경 + 모던 브라우저 모두 지원)
 */
const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const useChatStore = create<ChatState>((set, get) => ({
  ...INITIAL_STATE,

  open: (documentPublicId, initialPrompt = '') => {
    // 다른 문서로 열렸으면 기존 대화는 정리. 같은 문서면 이어쓰기.
    const prevDoc = get().documentPublicId;
    if (prevDoc && prevDoc !== documentPublicId) {
      get().abortController?.abort();
      set({
        ...INITIAL_STATE,
        isOpen: true,
        documentPublicId,
        initialPrompt,
      });
      return;
    }
    set({ isOpen: true, documentPublicId, initialPrompt });
  },

  close: () => {
    // 시트 닫아도 대화는 보존. 진행 중인 스트림만 끊는다.
    get().abortController?.abort();
    set({ isOpen: false, abortController: null, isStreaming: false });
  },

  setInitialPrompt: (text) => set({ initialPrompt: text }),

  appendMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  appendToLastAssistant: (chunk) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const last = s.messages[s.messages.length - 1];
      if (last.role !== 'assistant') return s;
      const updated: ChatMessage = { ...last, text: last.text + chunk };
      return { messages: [...s.messages.slice(0, -1), updated] };
    }),

  finishStreaming: (sessionId) =>
    set((s) => {
      const messages = s.messages.map((m, i) =>
        i === s.messages.length - 1 && m.role === 'assistant' ? { ...m, streaming: false } : m
      );
      return {
        messages,
        sessionId: sessionId || s.sessionId,
        isStreaming: false,
        abortController: null,
      };
    }),

  failStreaming: (errorText) =>
    set((s) => {
      const messages = s.messages.map((m, i) =>
        i === s.messages.length - 1 && m.role === 'assistant'
          ? { ...m, text: errorText, streaming: false }
          : m
      );
      return { messages, isStreaming: false, abortController: null };
    }),

  setAbortController: (controller) =>
    set({ abortController: controller, isStreaming: !!controller }),

  reset: () => {
    get().abortController?.abort();
    set({ ...INITIAL_STATE });
  },
}));

/** 새 ChatMessage 헬퍼 — 컴포넌트에서 ID 만들 때 사용. */
export const createMessage = (role: ChatRole, text: string, streaming = false): ChatMessage => ({
  id: newId(),
  role,
  text,
  streaming,
});
