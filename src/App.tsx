import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import Login from '@/pages/Login';
import PasswordRecovery from '@/pages/PasswordRecovery';
import Signup from '@/pages/Signup';
import GoogleSignupInfo from '@/pages/GoogleSignupInfo';
import ChargePage from '@/pages/ChargePage';
import AddAccountPage from '@/pages/AddAccountPage';
import AutoDebitAuthPage from '@/pages/AutoDebitAuthPage';
import AccountRegisteredPage from '@/pages/AccountRegisteredPage';
import ExchangeSelectPage from '@/pages/ExchangeSelectPage';
import ExchangeFormPage from '@/pages/ExchangeFormPage';
import ExchangeReversePage from '@/pages/ExchangeReversePage';
import ExchangeCompletePage from '@/pages/ExchangeCompletePage';
import RecurringTransferSetupPage from '@/pages/RecurringTransferSetupPage';
import RecurringTransferListPage from '@/pages/RecurringTransferListPage';
import RecurringTransferCompletePage from '@/pages/RecurringTransferCompletePage';
import TransferSelectPage from '@/pages/TransferSelectPage';
import TransferAppPage from '@/pages/TransferAppPage';
import TransferBankPage from '@/pages/TransferBankPage';
import TransferConfirmPage from '@/pages/TransferConfirmPage';
import TransferAuthPage from '@/pages/TransferAuthPage';
import TransferCompletePage from '@/pages/TransferCompletePage';

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
      <Route path="/exchange" element={<ExchangeSelectPage />} />
      <Route path="/exchange/form" element={<ExchangeFormPage />} />
      <Route path="/exchange/reverse" element={<ExchangeReversePage />} />
      <Route path="/exchange/complete" element={<ExchangeCompletePage />} />
      <Route path="/recurring" element={<RecurringTransferListPage />} />
      <Route path="/recurring/setup" element={<RecurringTransferSetupPage />} />
      <Route path="/recurring/complete" element={<RecurringTransferCompletePage />} />
      <Route path="/transfer" element={<TransferSelectPage />} />
      <Route path="/transfer/app" element={<TransferAppPage />} />
      <Route path="/transfer/bank" element={<TransferBankPage />} />
      <Route path="/transfer/confirm" element={<TransferConfirmPage />} />
      <Route path="/transfer/auth" element={<TransferAuthPage />} />
      <Route path="/transfer/complete" element={<TransferCompletePage />} />
    </Routes>
  );
}

export default App;
