import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '@/pages/auth/auth.css';

import { ROUTES } from '@/constants/routes';
import { NATIONALITIES } from '@/constants/nationalities';
import { SIGNUP_LANGUAGES as LANGUAGES } from '@/constants/languages';

function GoogleSignupInfo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    nationality: '',
    language: '',
    agreeAll: false,
  });
  const [nicknameStatus, setNicknameStatus] = useState<null | 'ok' | 'fail'>(null);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      if (key === 'nickname') setNicknameStatus(null);
    };

  const checkNickname = () => {
    if (!form.nickname.trim()) return;
    setNicknameStatus('ok');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-screen">
        <div className="auth-content auth-content-fixed">
          <div className="auth-top">
            <button
              type="button"
              className="auth-icon"
              onClick={() => navigate(ROUTES.LOGIN)}
              aria-label={t('auth.googleSignup.backButton')}
            >
              ‹
            </button>
            <div className="auth-title">{t('auth.googleSignup.title')}</div>
            <div style={{ width: 40 }} />
          </div>

          <div className="auth-card ok">
            <div className="auth-card-title">{t('auth.googleSignup.connectedTitle')}</div>
            <div className="auth-card-text">{t('auth.googleSignup.connectedDescription')}</div>
          </div>

          <form id="google-signup-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="gs-name">{t('auth.googleSignup.nameLabel')}</label>
              <input
                id="gs-name"
                type="text"
                className="auth-input"
                placeholder={t('auth.googleSignup.namePlaceholder')}
                value={form.name}
                onChange={set('name')}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="gs-nickname">{t('auth.googleSignup.nicknameLabel')}</label>
              <div className="auth-input-row">
                <input
                  id="gs-nickname"
                  type="text"
                  placeholder={t('auth.googleSignup.nicknamePlaceholder')}
                  value={form.nickname}
                  onChange={set('nickname')}
                />
                <button type="button" className="auth-duplicate-btn" onClick={checkNickname}>
                  {t('auth.googleSignup.checkDuplicate')}
                </button>
              </div>
              {nicknameStatus === 'ok' && (
                <p className="auth-field-ok">{t('auth.googleSignup.nicknameAvailable')}</p>
              )}
              {nicknameStatus === 'fail' && (
                <p className="auth-field-fail">{t('auth.googleSignup.nicknameTaken')}</p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="gs-nationality">{t('auth.googleSignup.nationalityLabel')}</label>
              <select
                id="gs-nationality"
                className="auth-select"
                value={form.nationality}
                onChange={set('nationality')}
              >
                <option value="">{t('auth.googleSignup.nationalityPlaceholder')}</option>
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="gs-language">{t('auth.googleSignup.languageLabel')}</label>
              <select
                id="gs-language"
                className="auth-select"
                value={form.language}
                onChange={set('language')}
              >
                <option value="">{t('auth.googleSignup.languagePlaceholder')}</option>
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="auth-row"
              onClick={() => setForm((prev) => ({ ...prev, agreeAll: !prev.agreeAll }))}
            >
              <span>{t('auth.googleSignup.agreeAll')}</span>
              <div className={`auth-checkbox ${form.agreeAll ? 'checked' : ''}`}>
                {form.agreeAll && '✓'}
              </div>
            </div>
          </form>
        </div>

        <div className="auth-fixed">
          <button type="submit" form="google-signup-form" className="auth-primary">
            {t('auth.googleSignup.submitButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoogleSignupInfo;
