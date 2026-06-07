import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/pages/auth/auth.css';

import { NATIONALITIES } from '@/constants/nationalities';
import { SIGNUP_LANGUAGES as LANGUAGES } from '@/constants/languages';

function GoogleSignupInfo() {
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
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
            >
              ‹
            </button>
            <div className="auth-title">추가 정보 입력</div>
            <div style={{ width: 40 }} />
          </div>

          <div className="auth-card ok">
            <div className="auth-card-title">Google 계정 연결 완료</div>
            <div className="auth-card-text">서비스 이용을 위해 아래 정보를 추가 입력해주세요.</div>
          </div>

          <form id="google-signup-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="gs-name">이름</label>
              <input
                id="gs-name"
                type="text"
                className="auth-input"
                placeholder="Google Name"
                value={form.name}
                onChange={set('name')}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="gs-nickname">닉네임</label>
              <div className="auth-input-row">
                <input
                  id="gs-nickname"
                  type="text"
                  placeholder="nickname"
                  value={form.nickname}
                  onChange={set('nickname')}
                />
                <button type="button" className="auth-duplicate-btn" onClick={checkNickname}>
                  중복확인
                </button>
              </div>
              {nicknameStatus === 'ok' && (
                <p className="auth-field-ok">✓ 사용 가능한 닉네임입니다</p>
              )}
              {nicknameStatus === 'fail' && (
                <p className="auth-field-fail">✗ 이미 사용 중인 닉네임입니다</p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="gs-nationality">국적</label>
              <select
                id="gs-nationality"
                className="auth-select"
                value={form.nationality}
                onChange={set('nationality')}
              >
                <option value="">한국 / 미국 / 베트남 / 필리핀 ▾</option>
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="gs-language">주 사용 언어</label>
              <select
                id="gs-language"
                className="auth-select"
                value={form.language}
                onChange={set('language')}
              >
                <option value="">언어 선택 ▾</option>
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
              <span>약관 및 개인정보 처리방침 동의</span>
              <div className={`auth-checkbox ${form.agreeAll ? 'checked' : ''}`}>
                {form.agreeAll && '✓'}
              </div>
            </div>
          </form>
        </div>

        <div className="auth-fixed">
          <button type="submit" form="google-signup-form" className="auth-primary">
            가입 완료하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoogleSignupInfo;
