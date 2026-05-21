import { Outlet } from 'react-router-dom';

// 인증 페이지(Login/Signup/PasswordRecovery/GoogleSignupInfo)는
// 자체 wrapper와 auth.css(공유 글로벌 CSS)를 사용하므로 layout은 Outlet만 제공
export default function AuthLayout() {
  return <Outlet />;
}
