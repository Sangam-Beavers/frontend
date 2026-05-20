import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import PasswordRecovery from './pages/PasswordRecovery';
import Signup from './pages/Signup';
import GoogleSignupInfo from './pages/GoogleSignupInfo';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/password-recovery" element={<PasswordRecovery />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/google-signup-info" element={<GoogleSignupInfo />} />
    </Routes>
  );
}

export default App;
