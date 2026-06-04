// ─────────────────────────────────────────────────────────────
// pages/auth/ResetPassword/ResetPassword.tsx — 비밀번호 재설정 화면
// "비밀번호 찾기"로 받은 메일의 링크(/reset-password?token=...)를 눌렀을 때 뜬다.
//
// 흐름:
//   1) URL 쿼리에서 token을 읽는다 (없으면 잘못된 접근 안내).
//   2) 새 비밀번호 2회 입력(확인) 후 제출.
//   3) POST /api/v1/auth/password/reset { token, new_password } 호출.
//   4) 성공(200) → 완료 안내 + 로그인으로 / MEMBER4004 → 링크 만료·무효 안내.
//
// 비밀번호는 IdP(Authentik)가 보관하므로 변경도 백엔드가 IdP를 경유해 처리한다(방식 B).
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '@/pages/auth/auth.css';
import { ApiException, memberApi } from '@/api';
import { ROUTES } from '@/constants/routes';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }
    if (password !== confirm) {
      setError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    setSubmitting(true);
    try {
      // body는 snake_case(new_password) — 백엔드 전역 규칙(memberApi.ResetPasswordBody 타입 참고).
      // 성공 시 interceptor가 envelope을 풀어 void 반환. 실패는 ApiException으로 throw.
      await memberApi.resetPassword({ token, new_password: password });
      setDone(true); // 변경 완료 — 아래에서 완료 카드 + 로그인 버튼 표시
    } catch (e) {
      if (e instanceof ApiException) {
        if (e.code === 'MEMBER4004') {
          // 토큰 만료(30분)·위조·재사용 — 다시 요청하도록 안내
          setError('링크가 만료되었거나 올바르지 않습니다. 비밀번호 찾기에서 다시 요청해주세요.');
        } else {
          setError(e.message);
        }
      } else {
        setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setSubmitting(false);
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
              onClick={() => navigate(ROUTES.LOGIN)}
              aria-label="로그인으로"
            >
              ‹
            </button>
            <div className="auth-title">비밀번호 재설정</div>
            <div className="auth-icon empty" aria-hidden />
          </div>

          {/* 토큰 없이(메일 링크 없이) 직접 들어온 경우 — 폼 대신 안내만 */}
          {!token ? (
            <>
              <div className="auth-card info">
                <div className="auth-card-title">잘못된 접근입니다</div>
                <div className="auth-card-text">
                  비밀번호 재설정은 메일로 받은 링크를 통해서만 가능합니다.
                </div>
              </div>
              <button
                type="button"
                className="auth-primary"
                onClick={() => navigate(ROUTES.PASSWORD_RECOVERY)}
              >
                재설정 링크 다시 받기
              </button>
            </>
          ) : done ? (
            /* 변경 완료 */
            <>
              <div className="auth-card ok">
                <div className="auth-card-title">비밀번호가 변경되었습니다</div>
                <div className="auth-card-text">새 비밀번호로 다시 로그인해주세요.</div>
              </div>
              <button type="button" className="auth-primary" onClick={() => navigate(ROUTES.LOGIN)}>
                로그인하러 가기
              </button>
            </>
          ) : (
            /* 새 비밀번호 입력 폼 */
            <>
              <div className="auth-card info">
                <div className="auth-card-title">새 비밀번호 설정</div>
                <div className="auth-card-text">사용할 새 비밀번호를 입력해주세요.</div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label htmlFor="reset-password">새 비밀번호</label>
                  <input
                    id="reset-password"
                    type="password"
                    className="auth-input"
                    placeholder="새 비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="reset-password-confirm">새 비밀번호 확인</label>
                  <input
                    id="reset-password-confirm"
                    type="password"
                    className="auth-input"
                    placeholder="한 번 더 입력"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>

                <button type="submit" className="auth-primary" disabled={submitting}>
                  {submitting ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>

              {error && (
                <div className="auth-card info">
                  <div className="auth-card-text">{error}</div>
                </div>
              )}

              <button
                type="button"
                className="auth-ghost"
                onClick={() => navigate(ROUTES.PASSWORD_RECOVERY)}
              >
                재설정 링크 다시 받기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
