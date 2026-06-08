// ─────────────────────────────────────────────────────────────
// api/chat.ts  —  분석 결과 후속 질문 챗봇 SSE 클라이언트
//
// 백엔드 계약: POST /api/v1/documents/{publicId}/chat (SSE)
//   요청: { message, session_id?, user_lang }
//   응답: text/event-stream
//     - event: token  data: <부분 텍스트>
//     - event: done   data: { "session_id": "uuid" }
//
// axios interceptor는 ApiResponse envelope을 자동으로 풀기 때문에 스트리밍 응답엔
// 맞지 않다. 그래서 여기는 raw fetch + ReadableStream을 직접 사용한다.
// 인증 토큰은 tokenStore에서 읽어 Authorization 헤더에 수동으로 붙인다.
// ─────────────────────────────────────────────────────────────

import { getAccessToken } from '@/auth/tokenStore';
import { apiClient, ApiException, type ApiError } from './client';

export interface ChatRequest {
  message: string;
  session_id?: string;
  user_lang: string;
}

// ─── 대화 이력 조회 (재방문 복원) ───
// 백엔드 계약: GET /api/v1/documents/{publicId}/chat/history?limit=&cursor=
// 일반 JSON 응답이라 axios(apiClient) 사용 — envelope은 interceptor가 풀어준다.
// 이력 데이터는 계정 B DynamoDB에 있고 백엔드는 권한검증 + Lambda 릴레이만 한다(ai-chatbot-mcp.md §6-2).

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[];
  next_cursor: string | null;
}

/**
 * 챗봇 대화 이력 조회 — 채팅 시트 마운트 시 1회 호출해 이전 대화를 복원(시드)한다.
 * 이력이 없으면 messages 빈 배열(에러 아님). 분석요약 합성 턴은 내려오지 않는다.
 */
export async function fetchChatHistory(
  documentPublicId: string,
  params?: { limit?: number; cursor?: string }
): Promise<ChatHistoryResponse> {
  return apiClient.get<unknown, ChatHistoryResponse>(
    `/documents/${documentPublicId}/chat/history`,
    { params }
  );
}

export interface ChatStreamCallbacks {
  /** 한 토큰(또는 작은 텍스트 청크) 도착 시. UI는 누적해서 렌더. */
  onToken: (text: string) => void;
  /** 스트림 정상 종료. sessionId는 다음 턴 이어가기에 사용. */
  onDone: (sessionId: string) => void;
  /** 권한/인증 실패(SSE 시작 전 4xx 응답) 또는 스트림 중단 시. */
  onError: (err: ApiException) => void;
}

/**
 * 후속 질문 챗봇 SSE 호출.
 *
 * @param documentPublicId 분석 문서 식별자 (UUID).
 * @param body 사용자 질문 + (이어가는 대화면) 직전 session_id.
 * @param callbacks 토큰/완료/에러 콜백.
 * @returns 호출자가 보유할 AbortController — 시트가 닫히거나 사용자가 취소하면 abort().
 */
export function openChatStream(
  documentPublicId: string,
  body: ChatRequest,
  callbacks: ChatStreamCallbacks
): AbortController {
  const controller = new AbortController();

  // IIFE — async 작업을 시작만 하고 controller는 즉시 반환.
  void (async () => {
    try {
      const token = getAccessToken();
      const response = await fetch(`/api/v1/documents/${documentPublicId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      // SSE 시작 전 권한/인증 실패는 JSON envelope으로 옴. 본문 파싱해서 ApiException으로.
      if (!response.ok) {
        let code = 'NETWORK_ERROR';
        let message = `요청에 실패했습니다. (HTTP ${response.status})`;
        try {
          const errBody = (await response.json()) as ApiError;
          if (errBody && errBody.success === false) {
            code = errBody.code;
            message = errBody.message;
          }
        } catch {
          // 본문 파싱 실패는 무시 — 위 기본값 사용.
        }
        callbacks.onError(new ApiException(code, response.status, message));
        return;
      }

      if (!response.body) {
        callbacks.onError(new ApiException('NETWORK_ERROR', 0, '응답 본문이 비어 있습니다.'));
        return;
      }

      // ─── SSE 파싱 ───
      // 프레임은 \n\n 으로 구분. 한 프레임 안에 event:/data: 라인이 섞여 있다.
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      // done/error 종결 프레임 수신 여부 — 없이 EOF면 중계가 끊긴 것(백엔드 completeWithError 등).
      // 콜백을 안 부르면 isStreaming이 영원히 true로 남아 입력창이 잠긴다(침묵 실패).
      let terminated = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // 프레임 단위로 잘라서 처리.
        let sepIdx: number;
        while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);
          terminated = handleFrame(frame, callbacks) || terminated;
        }
      }
      // 남은 버퍼에 done이 들어있을 가능성도 처리.
      if (buffer.trim().length > 0) {
        terminated = handleFrame(buffer, callbacks) || terminated;
      }
      if (!terminated) {
        callbacks.onError(
          new ApiException('STREAM_INTERRUPTED', 0, '응답이 중단됐어요. 잠시 후 다시 시도해주세요.')
        );
      }
    } catch (e) {
      // AbortError는 사용자가 의도적으로 취소한 경우라 에러로 알리지 않음.
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const msg = e instanceof Error ? e.message : '스트림 처리 중 오류가 발생했습니다.';
      callbacks.onError(new ApiException('NETWORK_ERROR', 0, msg));
    }
  })();

  return controller;
}

/**
 * 한 SSE 프레임을 파싱해 콜백 호출.
 *
 * <p>프레임 예:
 * <pre>
 * event: token
 * data: 안녕하세요
 * </pre>
 *
 * @returns 종결 프레임(done/error)이었으면 true — 호출측이 EOF 시 중단 여부 판정에 사용.
 */
function handleFrame(frame: string, cb: ChatStreamCallbacks): boolean {
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      // SSE 표준은 "data:" 뒤 첫 공백 1개를 스페이서로 보고 strip 하지만,
      // 우리 챗봇 Lambda는 한 글자씩(yield char) 보내므로 공백 토큰이
      // `data: ` 한 줄로 나간다. 표준대로 strip 하면 공백 한 글자가 통째로
      // 사라져 "분석된계약서결과를..." 처럼 단어 사이 공백이 다 없어진다.
      // 챗봇 전용 클라이언트라 표준 strip을 끄고 raw로 보존.
      dataLines.push(line.slice('data:'.length));
    }
    // 주석(콜론으로 시작) 등은 무시.
  }

  const data = dataLines.join('\n');

  if (eventName === 'token') {
    // 백엔드/Lambda 중계 단계에서 줄바꿈/탭이 literal escape("\n", "\t")로 들어오는 케이스 복원.
    // 표준 SSE 다중 data: 라인은 위 join('\n')으로 이미 처리됐고, 여기는 한 라인 안에 literal로
    // 박혀 들어온 escape를 푼다.
    cb.onToken(unescapeLiteralEscapes(data));
  } else if (eventName === 'done') {
    let sessionId = '';
    try {
      const parsed = JSON.parse(data) as { session_id?: string };
      sessionId = parsed.session_id ?? '';
    } catch {
      // done 데이터가 JSON이 아니면 빈 문자열로.
    }
    cb.onDone(sessionId);
    return true;
  } else if (eventName === 'error') {
    // 백엔드 SseRelayListener가 Lambda/중계 오류를 event:error로 흘려준다.
    // data: {"message": "..."} — 사용자에게 보여줄 안내 문구.
    let message = '답변 생성 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
    try {
      const parsed = JSON.parse(data) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      // error 데이터가 JSON이 아니면 기본 문구 사용.
    }
    cb.onError(new ApiException('CHAT_STREAM_ERROR', 0, message));
    return true;
  }
  // 그 외 이벤트 이름은 무시(미래 확장 대비).
  return false;
}

/**
 * SSE 토큰에 literal로 박혀 있는 escape 시퀀스를 실제 제어문자로 복원.
 *
 * <p>케이스: 백엔드/Lambda 중계가 어떤 이유로(JSON 직렬화 흔적 등) newline을 `\n` 두 글자로
 * 흘려보낼 때, 마크다운 파서는 `\n## 헤더`를 한 줄로 보고 헤더로 인식하지 못한다.
 * 이 함수가 그 escape를 풀어주면 마크다운이 정상 렌더된다.
 *
 * <p>현재 도메인(법령/환율/노동 Q&A)의 챗봇 답변에 진짜 backslash(`\`)가 들어올 일이 사실상
 * 없으므로 backslash 자체 escape는 처리하지 않는다(단순화). 만약 그럴 케이스가 생기면
 * NUL(U+0000)을 임시 마커로 두는 방식으로 확장한다.
 */
function unescapeLiteralEscapes(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"');
}
