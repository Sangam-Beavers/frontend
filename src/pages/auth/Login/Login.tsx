import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '@/pages/auth/auth.css';
import { startLogin } from '@/auth/login';

const LANG_OPTIONS = [
  { value: 'ko', label: '🌐 KO' },
  { value: 'en', label: '🌐 EN' },
  { value: 'vi', label: '🌐 VI' },
  { value: 'fil', label: '🌐 FIL' },
];

function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-screen">
        <div className="auth-content">
          <div className="auth-top">
            <div className="auth-brand">
              <img className="auth-logo" src="/logo.png" alt="" />
              <span>Global Bridge</span>
            </div>
            <select
              className="auth-lang-pill"
              value={i18n.language.split('-')[0]}
              onChange={(e) => void i18n.changeLanguage(e.target.value)}
              aria-label={t('auth.login.langSelect')}
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
              <img src="/logo.png" alt="Global Bridge" />
            </div>
            <h2>
              {t('auth.login.heroTitleLine1')}
              <br />
              {t('auth.login.heroTitleLine2')}
            </h2>
            <p>{t('auth.login.heroDescription')}</p>
          </div>

          <button type="button" className="auth-primary" onClick={() => startLogin()}>
            {t('auth.login.emailLoginButton')}
          </button>

          <div className="auth-divider">
            <span />
            <em>{t('auth.login.or')}</em>
            <span />
          </div>

          <button
            type="button"
            className="auth-google"
            onClick={() => navigate('/google-signup-info')}
          >
            <span className="auth-google-mark">G</span>
            {t('auth.login.googleLoginButton')}
          </button>

          <div className="auth-signup">
            {t('auth.login.noAccount')}{' '}
            <Link to="/signup">
              <button type="button">{t('auth.login.signupButton')}</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
