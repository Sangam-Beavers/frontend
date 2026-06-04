// ─────────────────────────────────────────────────────────────
// pages/auth/PasswordRecovery/PasswordRecovery.tsx — 비밀번호 찾기 화면
// 가입 이메일을 입력하면 백엔드가 재설정 링크를 메일로 보낸다.
//
// POST /api/v1/auth/password/reset-request { email }
// 응답은 "항상 200" — 미가입 이메일이어도 같다(가입 여부 노출 방지).
// 그래서 호출이 성공하면 무조건 "메일을 확인해주세요"만 보여준다.
// 메일의 링크(/reset-password?token=...)가 ResetPassword 화면으로 이어진다.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/pages/auth/auth.css';
import { ApiException, memberApi } from '@/api';
import { ROUTES } from '@/constants/routes';

function PasswordRecovery() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 앞뒤 공백 제거한 값을 검증·전송에 모두 사용한다(공백 포함 원본을 보내면 서버 @Email 검증에 걸림).
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setSending(true);
    try {
      // 가입 여부와 무관하게 200 — interceptor가 envelope을 풀어 void 반환(보안: 가입여부 비노출).
      // 형식 오류(COMMON4001)는 ApiException으로 throw됨.
      await memberApi.requestPasswordReset({ email: trimmedEmail });
      setSent(true);
    } catch (e) {
      if (e instanceof ApiException) {
        // COMMON4001 = 이메일 형식 오류 등
        setError(e.message);
      } else {
        setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-screen">
        <div className="auth-content">
          <div className="auth-top">
            <button
              type="button"
              className="auth-icon"
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
            >
              ‹
            </button>
            <div className="auth-title">비밀번호 찾기</div>
            <div className="auth-icon empty" aria-hidden />
          </div>

          <div className="auth-card info">
            <div className="auth-card-title">이메일로 재설정</div>
            <div className="auth-card-text">
              가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="recovery-email">이메일</label>
              <input
                id="recovery-email"
                type="email"
                className="auth-input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-primary" disabled={sending}>
              {sending ? '전송 중...' : '재설정 링크 보내기'}
            </button>
          </form>

          {sent && (
            <div className="auth-card ok">
              <div className="auth-card-title">이메일을 확인해주세요</div>
              <div className="auth-card-text">
                비밀번호 재설정 링크가 발송되었습니다. 링크는 30분간 유효합니다.
              </div>
            </div>
          )}

          {error && (
            <div className="auth-card info">
              <div className="auth-card-text">{error}</div>
            </div>
          )}

          <button type="button" className="auth-ghost" onClick={() => navigate(ROUTES.LOGIN)}>
            로그인 화면으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PasswordRecovery;
