import { Routes, Route } from 'react-router-dom';
import Login from '@/pages/Login';
import PasswordRecovery from '@/pages/PasswordRecovery';
import Signup from '@/pages/Signup';
import GoogleSignupInfo from '@/pages/GoogleSignupInfo';
import HomePage from '@/pages/HomePage';
import ChargePage from '@/pages/ChargePage';
import AddAccountPage from '@/pages/AddAccountPage';
import AutoDebitAuthPage from '@/pages/AutoDebitAuthPage';
import AccountRegisteredPage from '@/pages/AccountRegisteredPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/password-recovery" element={<PasswordRecovery />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/google-signup-info" element={<GoogleSignupInfo />} />
      <Route path="/charge" element={<ChargePage />} />
      <Route path="/charge/add-account" element={<AddAccountPage />} />
      <Route path="/charge/auto-debit" element={<AutoDebitAuthPage />} />
      <Route path="/charge/account-registered" element={<AccountRegisteredPage />} />
    </Routes>
  );
}

export default App;
