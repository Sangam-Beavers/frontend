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
import { useTranslation } from 'react-i18next';
import '@/pages/auth/auth.css';
import { ApiException, memberApi } from '@/api';
import { ROUTES } from '@/constants/routes';

function ResetPassword() {
  const { t } = useTranslation();
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
      setError(t('auth.resetPassword.errorPasswordRequired'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.resetPassword.errorPasswordMismatch'));
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
          setError(t('auth.resetPassword.errorTokenInvalid'));
        } else {
          setError(e.message);
        }
      } else {
        setError(t('auth.resetPassword.errorNetwork'));
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
              aria-label={t('auth.resetPassword.backToLoginLabel')}
            >
              ‹
            </button>
            <div className="auth-title">{t('auth.resetPassword.title')}</div>
            <div className="auth-icon empty" aria-hidden />
          </div>

          {/* 토큰 없이(메일 링크 없이) 직접 들어온 경우 — 폼 대신 안내만 */}
          {!token ? (
            <>
              <div className="auth-card info">
                <div className="auth-card-title">{t('auth.resetPassword.invalidAccessTitle')}</div>
                <div className="auth-card-text">
                  {t('auth.resetPassword.invalidAccessDescription')}
                </div>
              </div>
              <button
                type="button"
                className="auth-primary"
                onClick={() => navigate(ROUTES.PASSWORD_RECOVERY)}
              >
                {t('auth.resetPassword.requestLinkAgain')}
              </button>
            </>
          ) : done ? (
            /* 변경 완료 */
            <>
              <div className="auth-card ok">
                <div className="auth-card-title">{t('auth.resetPassword.doneTitle')}</div>
                <div className="auth-card-text">{t('auth.resetPassword.doneDescription')}</div>
              </div>
              <button type="button" className="auth-primary" onClick={() => navigate(ROUTES.LOGIN)}>
                {t('auth.resetPassword.goToLogin')}
              </button>
            </>
          ) : (
            /* 새 비밀번호 입력 폼 */
            <>
              <div className="auth-card info">
                <div className="auth-card-title">{t('auth.resetPassword.formTitle')}</div>
                <div className="auth-card-text">{t('auth.resetPassword.formDescription')}</div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label htmlFor="reset-password">{t('auth.resetPassword.newPasswordLabel')}</label>
                  <input
                    id="reset-password"
                    type="password"
                    className="auth-input"
                    placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="reset-password-confirm">
                    {t('auth.resetPassword.confirmPasswordLabel')}
                  </label>
                  <input
                    id="reset-password-confirm"
                    type="password"
                    className="auth-input"
                    placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>

                <button type="submit" className="auth-primary" disabled={submitting}>
                  {submitting
                    ? t('auth.resetPassword.submitting')
                    : t('auth.resetPassword.submitButton')}
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
                {t('auth.resetPassword.requestLinkAgain')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
