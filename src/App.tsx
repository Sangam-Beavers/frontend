import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import PasswordRecovery from './pages/PasswordRecovery';
import Signup from './pages/Signup';
import GoogleSignupInfo from './pages/GoogleSignupInfo';
import ExchangeSelectPage from './pages/ExchangeSelectPage';
import ExchangeFormPage from './pages/ExchangeFormPage';
import ExchangeReversePage from './pages/ExchangeReversePage';
import ExchangeCompletePage from './pages/ExchangeCompletePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/password-recovery" element={<PasswordRecovery />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/google-signup-info" element={<GoogleSignupInfo />} />
      <Route path="/exchange" element={<ExchangeSelectPage />} />
      <Route path="/exchange/form" element={<ExchangeFormPage />} />
      <Route path="/exchange/reverse" element={<ExchangeReversePage />} />
      <Route path="/exchange/complete" element={<ExchangeCompletePage />} />
    </Routes>
  );
}

export default App;
