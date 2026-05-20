import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';

const NATIONALITIES = ['중국', '베트남', '태국', '미국', '필리핀', '인도네시아', '기타'];
const LANGUAGES = [
  '中文',
  'Tiếng Việt',
  'ภาษาไทย',
  'English',
  'Filipino',
  'Bahasa Indonesia',
  '기타',
];

function GoogleSignupInfo() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    nationality: '',
    language: '',
    agreeAll: false,
  });

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            <button type="button" className="auth-icon" aria-label="언어 선택">
              🌐
            </button>
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
                <button type="button" className="auth-duplicate-btn">
                  중복확인
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="gs-nationality">국적</label>
              <select
                id="gs-nationality"
                className="auth-select"
                value={form.nationality}
                onChange={set('nationality')}
              >
                <option value="">중국 / 베트남 / 태국 / 미국 ▾</option>
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
