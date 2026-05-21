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
import DocAnalysisSelectPage from '@/pages/DocAnalysisSelectPage';
import DocAnalysisPreviewPage from '@/pages/DocAnalysisPreviewPage';
import DocAnalysisLoadingPage from '@/pages/DocAnalysisLoadingPage';
import DocAnalysisResultPage from '@/pages/DocAnalysisResultPage';
import DocAnalysisPaymentPage from '@/pages/DocAnalysisPaymentPage';
import CommunityPage from '@/pages/CommunityPage';
import CommunityResidencePage from '@/pages/CommunityResidencePage';
import CommunityLifePage from '@/pages/CommunityLifePage';
import CommunityJobPage from '@/pages/CommunityJobPage';
import CommunityFreePage from '@/pages/CommunityFreePage';
import CommunityPostDetailPage from '@/pages/CommunityPostDetailPage';
import CommunityWritePage from '@/pages/CommunityWritePage';
import AllMenuPage from '@/pages/AllMenuPage';
import MyPage from '@/pages/MyPage';
import ProfileEditPage from '@/pages/ProfileEditPage';
import BadgeCertPage from '@/pages/BadgeCertPage';
import BadgeCertCompletePage from '@/pages/BadgeCertCompletePage';
import AccountManagePage from '@/pages/AccountManagePage';
import NotificationSettingsPage from '@/pages/NotificationSettingsPage';
import LanguageSettingsPage from '@/pages/LanguageSettingsPage';
import SubscriptionPage from '@/pages/SubscriptionPage';

function App() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '430px',
        minHeight: '100dvh',
        position: 'relative',
        background: '#fff',
      }}
    >
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
        <Route path="/doc-analysis" element={<DocAnalysisSelectPage />} />
        <Route path="/doc-analysis/preview" element={<DocAnalysisPreviewPage />} />
        <Route path="/doc-analysis/loading" element={<DocAnalysisLoadingPage />} />
        <Route path="/doc-analysis/result" element={<DocAnalysisResultPage />} />
        <Route path="/doc-analysis/payment" element={<DocAnalysisPaymentPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/residence" element={<CommunityResidencePage />} />
        <Route path="/community/life" element={<CommunityLifePage />} />
        <Route path="/community/job" element={<CommunityJobPage />} />
        <Route path="/community/free" element={<CommunityFreePage />} />
        <Route path="/community/write" element={<CommunityWritePage />} />
        <Route path="/community/posts/:postId" element={<CommunityPostDetailPage />} />
        <Route path="/menu" element={<AllMenuPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/mypage/profile" element={<ProfileEditPage />} />
        <Route path="/mypage/badge" element={<BadgeCertPage />} />
        <Route path="/mypage/badge/complete" element={<BadgeCertCompletePage />} />
        <Route path="/mypage/accounts" element={<AccountManagePage />} />
        <Route path="/mypage/notifications" element={<NotificationSettingsPage />} />
        <Route path="/mypage/language" element={<LanguageSettingsPage />} />
        <Route path="/mypage/subscription" element={<SubscriptionPage />} />
      </Routes>
    </div>
  );
}

export default App;
