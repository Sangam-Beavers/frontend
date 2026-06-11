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
import { useTranslation } from 'react-i18next';
import '@/pages/auth/auth.css';
import { ApiException, memberApi } from '@/api';
import { ROUTES } from '@/constants/routes';

function PasswordRecovery() {
  const { t } = useTranslation();
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
      setError(t('auth.passwordRecovery.errorEmailRequired'));
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
        setError(t('auth.passwordRecovery.errorNetwork'));
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
              onClick={() => navigate(ROUTES.LOGIN)}
              aria-label={t('auth.passwordRecovery.backButton')}
            >
              ‹
            </button>
            <div className="auth-title">{t('auth.passwordRecovery.title')}</div>
            <div className="auth-icon empty" aria-hidden />
          </div>

          <div className="auth-card info">
            <div className="auth-card-title">{t('auth.passwordRecovery.infoTitle')}</div>
            <div className="auth-card-text">{t('auth.passwordRecovery.infoDescription')}</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="recovery-email">{t('auth.passwordRecovery.emailLabel')}</label>
              <input
                id="recovery-email"
                type="email"
                className="auth-input"
                placeholder={t('auth.passwordRecovery.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-primary" disabled={sending}>
              {sending
                ? t('auth.passwordRecovery.sending')
                : t('auth.passwordRecovery.submitButton')}
            </button>
          </form>

          {sent && (
            <div className="auth-card ok">
              <div className="auth-card-title">{t('auth.passwordRecovery.sentTitle')}</div>
              <div className="auth-card-text">{t('auth.passwordRecovery.sentDescription')}</div>
            </div>
          )}

          {error && (
            <div className="auth-card info">
              <div className="auth-card-text">{error}</div>
            </div>
          )}

          <button type="button" className="auth-ghost" onClick={() => navigate(ROUTES.LOGIN)}>
            {t('auth.passwordRecovery.backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PasswordRecovery;
