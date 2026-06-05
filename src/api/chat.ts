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
import { ApiException, type ApiError } from './client';

export interface ChatRequest {
  message: string;
  session_id?: string;
  user_lang: string;
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

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // 프레임 단위로 잘라서 처리.
        let sepIdx: number;
        while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);
          handleFrame(frame, callbacks);
        }
      }
      // 남은 버퍼에 done이 들어있을 가능성도 처리.
      if (buffer.trim().length > 0) handleFrame(buffer, callbacks);
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
 */
function handleFrame(frame: string, cb: ChatStreamCallbacks): void {
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      // data: 뒤에 첫 공백 한 칸은 표준상 무시. 나머지는 보존.
      dataLines.push(line.slice('data:'.length).replace(/^ /, ''));
    }
    // 주석(콜론으로 시작) 등은 무시.
  }

  const data = dataLines.join('\n');

  if (eventName === 'token') {
    cb.onToken(data);
  } else if (eventName === 'done') {
    let sessionId = '';
    try {
      const parsed = JSON.parse(data) as { session_id?: string };
      sessionId = parsed.session_id ?? '';
    } catch {
      // done 데이터가 JSON이 아니면 빈 문자열로.
    }
    cb.onDone(sessionId);
  }
  // 그 외 이벤트 이름은 무시(미래 확장 대비).
}
