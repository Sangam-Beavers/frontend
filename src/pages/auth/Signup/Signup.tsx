// ─────────────────────────────────────────────────────────────
// pages/auth/Signup/Signup.tsx — 회원가입 화면 (프론트 #82)
//
// 흐름:
//   1) 닉네임 중복확인(선택) → GET /members/check-nickname → available 안내
//   2) 제출 → POST /api/v1/auth/register (snake_case body)
//      성공(201) → 완료 카드 + "로그인하러 가기"
//      MEMBER4002(이메일 중복) / MEMBER4003(닉네임 중복) / COMMON4001(형식) → 에러 표시
//
// 비밀번호는 우리 DB에 저장되지 않는다 — 백엔드가 IdP(Authentik)에 사용자 생성+비번 설정(방식 B).
// 가입 직후 로그인은 Authentik 로그인 페이지에서 진행(자동 로그인 아님).
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/pages/auth/auth.css';

import { ApiException, memberApi } from '@/api';
import { ROUTES } from '@/constants/routes';
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

// 닉네임 중복확인 상태: 안 함 / 확인 중 / 사용 가능 / 이미 사용 중
type NicknameCheck = 'idle' | 'checking' | 'available' | 'taken';

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
  const [nicknameCheck, setNicknameCheck] = useState<NicknameCheck>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false); // 가입 완료
  const [error, setError] = useState<string | null>(null);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      // 닉네임을 바꾸면 이전 중복확인 결과는 무효
      if (key === 'nickname') setNicknameCheck('idle');
    };

  const toggle = (key: 'agreeTerms' | 'agreePrivacy') =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  // 닉네임 중복확인 버튼
  const handleCheckNickname = async () => {
    const nickname = form.nickname.trim();
    if (!nickname) {
      setError('닉네임을 먼저 입력해주세요.');
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
          : '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
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

    if (!email || !form.password || !name || !nickname || !form.nationality || !form.language) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }
    if (!form.agreeTerms || !form.agreePrivacy) {
      setError('이용약관과 개인정보 처리방침에 동의해주세요.');
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
      });
      setDone(true); // 201 — 가입 완료 (자동 로그인 아님 → 로그인 화면으로 안내)
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.code === 'MEMBER4002') {
          setError('이미 사용 중인 이메일입니다.');
        } else if (err.code === 'MEMBER4003') {
          setError('이미 사용 중인 닉네임입니다.');
          setNicknameCheck('taken');
        } else if (err.code === 'NETWORK_ERROR') {
          setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          // COMMON4001(형식 오류) 등 — 백엔드 메시지 표시
          setError(err.message || '가입을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      } else {
        setError('가입을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 가입 완료 화면
  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-screen">
          <div className="auth-content">
            <div className="auth-top">
              <div className="auth-icon empty" aria-hidden />
              <div className="auth-title">회원가입</div>
              <div className="auth-icon empty" aria-hidden />
            </div>

            <div className="auth-card ok">
              <div className="auth-card-title">가입이 완료되었습니다 🎉</div>
              <div className="auth-card-text">가입한 이메일과 비밀번호로 로그인해주세요.</div>
            </div>

            <button type="button" className="auth-primary" onClick={() => navigate(ROUTES.LOGIN)}>
              로그인하러 가기
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
                <button
                  type="button"
                  className="auth-duplicate-btn"
                  onClick={handleCheckNickname}
                  disabled={nicknameCheck === 'checking'}
                >
                  {nicknameCheck === 'checking' ? '확인 중...' : '중복확인'}
                </button>
              </div>
              {nicknameCheck === 'available' && (
                <div className="auth-hint ok">사용할 수 있는 닉네임입니다.</div>
              )}
              {nicknameCheck === 'taken' && (
                <div className="auth-hint error">이미 사용 중인 닉네임입니다.</div>
              )}
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

            {error && (
              <div className="auth-card info">
                <div className="auth-card-text">{error}</div>
              </div>
            )}

            <button type="submit" className="auth-primary" disabled={submitting}>
              {submitting ? '가입 중...' : '이메일로 가입하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
