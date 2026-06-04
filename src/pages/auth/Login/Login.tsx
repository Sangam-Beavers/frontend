import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '@/pages/auth/auth.css';
import { startLogin } from '@/auth/login'; // ① 로그인 버튼이 부를 함수

const LANG_OPTIONS = [
  { value: 'KO', label: '🌐 KO' },
  { value: 'EN', label: '🌐 EN' },
  { value: 'VI', label: '🌐 VI' },
  { value: 'ZH', label: '🌐 ZH' },
  { value: 'TH', label: '🌐 TH' },
];

function Login() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('KO');
  // 이메일/비번 입력칸은 제거했다.
  // 실제 아이디·비번 입력은 로그인 버튼을 누르면 넘어가는 인증 페이지에서 처리하기 때문에,
  // 이 화면에 입력칸을 두면 "입력해도 무시되는" 가짜 칸이라 사용자가 헷갈린다.

  return (
    <div className="auth-page">
      <div className="auth-screen">
        <div className="auth-content">
          <div className="auth-top">
            <div className="auth-brand">
              <div className="auth-logo">GB</div>
              <span>Global Bridge</span>
            </div>
            <select
              className="auth-lang-pill"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="언어 선택"
            >
              {LANG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="auth-hero">
            <div className="auth-hero-logo">
              <div>GB</div>
            </div>
            <h2>
              외국인 노동자를 위한
              <br />
              안전한 금융 커뮤니티
            </h2>
            <p>송금·환전·문서 분석·생활 정보를 한 곳에서 관리하세요.</p>
          </div>

          {/* ① 로그인 버튼: 누르면 인증 페이지로 이동해 로그인 진행 */}
          <button type="button" className="auth-primary" onClick={() => startLogin()}>
            이메일로 로그인
          </button>

          <div className="auth-divider">
            <span />
            <em>또는</em>
            <span />
          </div>

          <button
            type="button"
            className="auth-google"
            onClick={() => navigate('/google-signup-info')}
          >
            <span className="auth-google-mark">G</span>
            Google로 계속하기
          </button>

          <div className="auth-signup">
            계정이 없나요?{' '}
            <Link to="/signup">
              <button type="button">회원가입</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
