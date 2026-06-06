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
import { fetchChatHistory } from '@/api/chat';

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
  /**
   * 서버 이력 복원 완료 여부 — 같은 문서에서 중복 조회 방지.
   * 서버(DynamoDB)가 대화의 SSOT라 session_id는 영속화하지 않는다(스레드 정체성 = user+document).
   */
  historyLoaded: boolean;

  // ── 액션 ──────────────────────────────────────────
  open: (documentPublicId: string, initialPrompt?: string) => void;
  /** 서버에 저장된 이전 대화를 불러와 시드. open()이 내부에서 호출 — 실패해도 채팅은 빈 상태로 진행. */
  loadHistory: (documentPublicId: string) => Promise<void>;
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
  historyLoaded: false,
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
    } else {
      set({ isOpen: true, documentPublicId, initialPrompt });
    }
    // 서버 이력 복원(재방문 복원) — fire-and-forget. 실패해도 채팅은 빈 상태로 진행.
    void get().loadHistory(documentPublicId);
  },

  loadHistory: async (documentPublicId) => {
    const s = get();
    // 이미 복원했거나 이번 세션에서 대화가 시작됐으면 덮어쓰지 않는다.
    if (s.historyLoaded || s.messages.length > 0) return;
    try {
      const history = await fetchChatHistory(documentPublicId);
      // await 사이에 사용자가 메시지를 보냈거나 다른 문서로 바뀌었으면 무시(레이스 방지).
      const now = get();
      if (now.messages.length > 0 || now.documentPublicId !== documentPublicId) return;
      set({
        messages: history.messages.map((m) => createMessage(m.role, m.content)),
        historyLoaded: true,
      });
    } catch {
      // 이력 조회 실패는 채팅을 막지 않는다 — 다음 open()에서 재시도된다.
    }
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
