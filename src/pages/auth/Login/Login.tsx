import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '@/pages/auth/auth.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="auth-page">
      <div className="auth-screen">
        <div className="auth-content">
          <div className="auth-top">
            <div className="auth-brand">
              <div className="auth-logo">GB</div>
              <span>Global Bridge</span>
            </div>
            <button type="button" className="auth-lang-pill">
              🌐 KO ▾
            </button>
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

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">이메일</label>
              <input
                id="login-email"
                type="email"
                className="auth-input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">비밀번호</label>
              <input
                id="login-password"
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => navigate('/password-recovery')}
            >
              비밀번호 찾기
            </button>

            <button type="submit" className="auth-primary" onClick={() => navigate('/')}>
              이메일로 로그인
            </button>
          </form>

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
