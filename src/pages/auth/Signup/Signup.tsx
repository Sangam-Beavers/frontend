import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '@/pages/auth/auth.css';

import { ApiException, memberApi } from '@/api';
import { ROUTES } from '@/constants/routes';
import { NATIONALITIES } from '@/constants/nationalities';
import { SIGNUP_LANGUAGES as LANGUAGES } from '@/constants/languages';
import { GENDERS, AGE_RANGES } from '@/constants/demographics';

interface CheckboxRowProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function CheckboxRow({ label, checked, onChange }: CheckboxRowProps) {
  return (
    <div className="auth-row" onClick={onChange}>
      <span>{label}</span>
      <div className={`auth-checkbox ${checked ? 'checked' : ''}`}>{checked && '✓'}</div>
    </div>
  );
}

type DupCheck = 'idle' | 'checking' | 'available' | 'taken';

function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    nickname: '',
    nationality: '',
    language: '',
    gender: '',
    ageRange: '',
    agreeTerms: false,
    agreePrivacy: false,
  });
  const [emailCheck, setEmailCheck] = useState<DupCheck>('idle');
  const [nicknameCheck, setNicknameCheck] = useState<DupCheck>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState((location.state as { done?: boolean } | null)?.done ?? false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      // 값을 바꾸면 이전 중복확인 결과는 무효
      if (key === 'email') setEmailCheck('idle');
      if (key === 'nickname') setNicknameCheck('idle');
    };

  const toggle = (key: 'agreeTerms' | 'agreePrivacy') =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleCheckEmail = async () => {
    const email = form.email.trim();
    if (!email) {
      setError(t('auth.signup.errorEmailRequired'));
      return;
    }
    setError(null);
    setEmailCheck('checking');
    try {
      const result = await memberApi.checkEmail(email);
      setEmailCheck(result.available ? 'available' : 'taken');
    } catch (e) {
      setEmailCheck('idle');
      // COMMON4001 = 이메일 형식 오류 등 — 백엔드 메시지 표시
      setError(
        e instanceof ApiException && e.code !== 'NETWORK_ERROR'
          ? e.message
          : t('auth.signup.errorNetwork')
      );
    }
  };

  const handleCheckNickname = async () => {
    const nickname = form.nickname.trim();
    if (!nickname) {
      setError(t('auth.signup.errorNicknameRequired'));
      return;
    }
    setError(null);
    setNicknameCheck('checking');
    try {
      const result = await memberApi.checkNickname(nickname);
      setNicknameCheck(result.available ? 'available' : 'taken');
    } catch (e) {
      setNicknameCheck('idle');
      setError(
        e instanceof ApiException && e.code !== 'NETWORK_ERROR'
          ? e.message
          : t('auth.signup.errorNetwork')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 공백 제거 값으로 검증·전송 통일 (비밀번호는 공백도 글자라 trim하지 않음)
    const email = form.email.trim();
    const name = form.name.trim();
    const nickname = form.nickname.trim();

    if (
      !email ||
      !form.password ||
      !name ||
      !nickname ||
      !form.nationality ||
      !form.language ||
      !form.gender ||
      !form.ageRange
    ) {
      setError(t('auth.signup.errorAllFieldsRequired'));
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError(t('auth.signup.errorPasswordMismatch'));
      return;
    }
    if (!form.agreeTerms || !form.agreePrivacy) {
      setError(t('auth.signup.errorAgreementRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await memberApi.signup({
        email,
        password: form.password,
        name,
        nickname,
        nationality: form.nationality,
        language: form.language,
        gender: form.gender,
        age_range: form.ageRange,
      });
      setDone(true);
      navigate(location.pathname, { replace: true, state: { done: true } });
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.code === 'MEMBER4002') {
          setError(t('auth.signup.errorEmailTaken'));
          setEmailCheck('taken');
        } else if (err.code === 'MEMBER4003') {
          setError(t('auth.signup.errorNicknameTaken'));
          setNicknameCheck('taken');
        } else if (err.code === 'NETWORK_ERROR') {
          setError(t('auth.signup.errorNetwork'));
        } else {
          // COMMON4001(형식 오류) 등 — 백엔드 메시지 표시
          setError(err.message || t('auth.signup.errorSubmit'));
        }
      } else {
        setError(t('auth.signup.errorSubmit'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-screen">
          <div className="auth-content">
            <div className="auth-top">
              <div className="auth-icon empty" aria-hidden />
              <div className="auth-title">{t('auth.signup.title')}</div>
              <div className="auth-icon empty" aria-hidden />
            </div>

            <div className="auth-card ok">
              <div className="auth-card-title">{t('auth.signup.doneTitle')}</div>
              <div className="auth-card-text">{t('auth.signup.doneDescription')}</div>
            </div>

            <button type="button" className="auth-primary" onClick={() => navigate(ROUTES.LOGIN)}>
              {t('auth.signup.goToLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-screen">
        <div className="auth-content">
          <div className="auth-top">
            <button
              type="button"
              className="auth-icon"
              onClick={() => navigate(ROUTES.LOGIN)}
              aria-label={t('auth.signup.backButton')}
            >
              ‹
            </button>
            <div className="auth-title">{t('auth.signup.title')}</div>
            <button type="button" className="auth-icon" aria-label={t('auth.signup.langSelect')}>
              🌐
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="signup-email">{t('auth.signup.emailLabel')}</label>
              <div className="auth-input-row">
                <input
                  id="signup-email"
                  type="email"
                  placeholder={t('auth.signup.emailPlaceholder')}
                  value={form.email}
                  onChange={set('email')}
                />
                <button
                  type="button"
                  className="auth-duplicate-btn"
                  onClick={handleCheckEmail}
                  disabled={emailCheck === 'checking'}
                >
                  {emailCheck === 'checking'
                    ? t('auth.signup.checking')
                    : t('auth.signup.checkDuplicate')}
                </button>
              </div>
              {emailCheck === 'available' && (
                <div className="auth-hint ok">{t('auth.signup.emailAvailable')}</div>
              )}
              {emailCheck === 'taken' && (
                <div className="auth-hint error">{t('auth.signup.emailTaken')}</div>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">{t('auth.signup.passwordLabel')}</label>
              <input
                id="signup-password"
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password-confirm">
                {t('auth.signup.passwordConfirmLabel')}
              </label>
              <input
                id="signup-password-confirm"
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={form.passwordConfirm}
                onChange={set('passwordConfirm')}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-name">{t('auth.signup.nameLabel')}</label>
              <input
                id="signup-name"
                type="text"
                className="auth-input"
                placeholder="Nguyen Van A"
                value={form.name}
                onChange={set('name')}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-nickname">{t('auth.signup.nicknameLabel')}</label>
              <div className="auth-input-row">
                <input
                  id="signup-nickname"
                  type="text"
                  placeholder="bridge_neighbor"
                  value={form.nickname}
                  onChange={set('nickname')}
                />
                <button
                  type="button"
                  className="auth-duplicate-btn"
                  onClick={handleCheckNickname}
                  disabled={nicknameCheck === 'checking'}
                >
                  {nicknameCheck === 'checking'
                    ? t('auth.signup.checking')
                    : t('auth.signup.checkDuplicate')}
                </button>
              </div>
              {nicknameCheck === 'available' && (
                <div className="auth-hint ok">{t('auth.signup.nicknameAvailable')}</div>
              )}
              {nicknameCheck === 'taken' && (
                <div className="auth-hint error">{t('auth.signup.nicknameTaken')}</div>
              )}
            </div>

            <div className="auth-grid2">
              <div className="auth-field">
                <label htmlFor="signup-nationality">{t('auth.signup.nationalityLabel')}</label>
                <select
                  id="signup-nationality"
                  className="auth-select"
                  value={form.nationality}
                  onChange={set('nationality')}
                >
                  <option value="">{t('auth.signup.selectOption')}</option>
                  {NATIONALITIES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-language">{t('auth.signup.languageLabel')}</label>
                <select
                  id="signup-language"
                  className="auth-select"
                  value={form.language}
                  onChange={set('language')}
                >
                  <option value="">{t('auth.signup.selectOption')}</option>
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="auth-grid2">
              <div className="auth-field">
                <label htmlFor="signup-gender">{t('auth.signup.genderLabel')}</label>
                <select
                  id="signup-gender"
                  className="auth-select"
                  value={form.gender}
                  onChange={set('gender')}
                >
                  <option value="">{t('auth.signup.selectOption')}</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-age-range">{t('auth.signup.ageRangeLabel')}</label>
                <select
                  id="signup-age-range"
                  className="auth-select"
                  value={form.ageRange}
                  onChange={set('ageRange')}
                >
                  <option value="">{t('auth.signup.selectOption')}</option>
                  {AGE_RANGES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <CheckboxRow
              label={t('auth.signup.agreeTerms')}
              checked={form.agreeTerms}
              onChange={() => toggle('agreeTerms')}
            />
            <CheckboxRow
              label={t('auth.signup.agreePrivacy')}
              checked={form.agreePrivacy}
              onChange={() => toggle('agreePrivacy')}
            />

            {error && (
              <div className="auth-card info">
                <div className="auth-card-text">{error}</div>
              </div>
            )}

            <button type="submit" className="auth-primary" disabled={submitting}>
              {submitting ? t('auth.signup.submitting') : t('auth.signup.submitButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
