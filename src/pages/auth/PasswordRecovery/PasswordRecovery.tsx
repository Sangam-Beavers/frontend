import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/pages/auth/auth.css';

function PasswordRecovery() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
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
            <div className="auth-title">비밀번호 찾기</div>
            <div className="auth-icon empty" aria-hidden />
          </div>

          <div className="auth-card info">
            <div className="auth-card-title">이메일로 재설정</div>
            <div className="auth-card-text">
              가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="recovery-email">이메일</label>
              <input
                id="recovery-email"
                type="email"
                className="auth-input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-primary">
              재설정 링크 보내기
            </button>
          </form>

          {sent && (
            <div className="auth-card ok">
              <div className="auth-card-title">이메일을 확인해주세요</div>
              <div className="auth-card-text">비밀번호 재설정 링크가 발송되었습니다.</div>
            </div>
          )}

          <button type="button" className="auth-ghost" onClick={() => navigate('/login')}>
            로그인 화면으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PasswordRecovery;
