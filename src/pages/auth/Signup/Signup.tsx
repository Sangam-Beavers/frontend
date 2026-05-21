import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../auth.css';

import { NATIONALITIES } from '@/constants/nationalities';
import { SIGNUP_LANGUAGES as LANGUAGES } from '@/constants/languages';

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

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    nickname: '',
    nationality: '',
    language: '',
    agreeTerms: false,
    agreePrivacy: false,
  });

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggle = (key: 'agreeTerms' | 'agreePrivacy') =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            <div className="auth-title">회원가입</div>
            <button type="button" className="auth-icon" aria-label="언어 선택">
              🌐
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="signup-email">이메일</label>
              <input
                id="signup-email"
                type="email"
                className="auth-input"
                placeholder="email@example.com"
                value={form.email}
                onChange={set('email')}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">비밀번호</label>
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
              <label htmlFor="signup-password-confirm">비밀번호 확인</label>
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
              <label htmlFor="signup-name">이름</label>
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
              <label htmlFor="signup-nickname">닉네임</label>
              <div className="auth-input-row">
                <input
                  id="signup-nickname"
                  type="text"
                  placeholder="bridge_neighbor"
                  value={form.nickname}
                  onChange={set('nickname')}
                />
                <button type="button" className="auth-duplicate-btn">
                  중복확인
                </button>
              </div>
            </div>

            <div className="auth-grid2">
              <div className="auth-field">
                <label htmlFor="signup-nationality">국적</label>
                <select
                  id="signup-nationality"
                  className="auth-select"
                  value={form.nationality}
                  onChange={set('nationality')}
                >
                  <option value="">선택 ▾</option>
                  {NATIONALITIES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-language">주 사용 언어</label>
                <select
                  id="signup-language"
                  className="auth-select"
                  value={form.language}
                  onChange={set('language')}
                >
                  <option value="">선택 ▾</option>
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <CheckboxRow
              label="서비스 이용약관 동의"
              checked={form.agreeTerms}
              onChange={() => toggle('agreeTerms')}
            />
            <CheckboxRow
              label="개인정보 처리방침 동의"
              checked={form.agreePrivacy}
              onChange={() => toggle('agreePrivacy')}
            />

            <button type="submit" className="auth-primary">
              이메일로 가입하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
