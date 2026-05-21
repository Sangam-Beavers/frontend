import type { ComponentType } from 'react';
import { ROUTES } from '@/constants/routes';
import AccountManagePage from '@/pages/AccountManagePage';
import AccountRegisteredPage from '@/pages/AccountRegisteredPage';
import AddAccountPage from '@/pages/AddAccountPage';
import AllMenuPage from '@/pages/AllMenuPage';
import AutoDebitAuthPage from '@/pages/AutoDebitAuthPage';
import BadgeCertCompletePage from '@/pages/BadgeCertCompletePage';
import BadgeCertPage from '@/pages/BadgeCertPage';
import ChargePage from '@/pages/ChargePage';
import CommunityFreePage from '@/pages/CommunityFreePage';
import CommunityJobPage from '@/pages/CommunityJobPage';
import CommunityLifePage from '@/pages/CommunityLifePage';
import CommunityPage from '@/pages/CommunityPage';
import CommunityPostDetailPage from '@/pages/CommunityPostDetailPage';
import CommunityResidencePage from '@/pages/CommunityResidencePage';
import CommunityWritePage from '@/pages/CommunityWritePage';
import DocAnalysisHistoryPage from '@/pages/DocAnalysisHistoryPage';
import DocAnalysisLoadingPage from '@/pages/DocAnalysisLoadingPage';
import DocAnalysisPaymentPage from '@/pages/DocAnalysisPaymentPage';
import DocAnalysisPreviewPage from '@/pages/DocAnalysisPreviewPage';
import DocAnalysisResultPage from '@/pages/DocAnalysisResultPage';
import DocAnalysisSelectPage from '@/pages/DocAnalysisSelectPage';
import ExchangeCompletePage from '@/pages/ExchangeCompletePage';
import ExchangeFormPage from '@/pages/ExchangeFormPage';
import ExchangeHistoryPage from '@/pages/ExchangeHistoryPage';
import ExchangeReversePage from '@/pages/ExchangeReversePage';
import ExchangeSelectPage from '@/pages/ExchangeSelectPage';
import GoogleSignupInfo from '@/pages/GoogleSignupInfo';
import HomePage from '@/pages/HomePage';
import LanguageSettingsPage from '@/pages/LanguageSettingsPage';
import Login from '@/pages/Login';
import MyPage from '@/pages/MyPage';
import NotificationSettingsPage from '@/pages/NotificationSettingsPage';
import PasswordRecovery from '@/pages/PasswordRecovery';
import ProfileEditPage from '@/pages/ProfileEditPage';
import RecurringTransferCompletePage from '@/pages/RecurringTransferCompletePage';
import RecurringTransferListPage from '@/pages/RecurringTransferListPage';
import RecurringTransferSetupPage from '@/pages/RecurringTransferSetupPage';
import Signup from '@/pages/Signup';
import SubscriptionPage from '@/pages/SubscriptionPage';
import TransferAppPage from '@/pages/TransferAppPage';
import TransferAuthPage from '@/pages/TransferAuthPage';
import TransferBankPage from '@/pages/TransferBankPage';
import TransferCompletePage from '@/pages/TransferCompletePage';
import TransferConfirmPage from '@/pages/TransferConfirmPage';
import TransferSelectPage from '@/pages/TransferSelectPage';
import WalletHistoryPage from '@/pages/WalletHistoryPage';

export interface PageRoute {
  path: string;
  Component: ComponentType;
}

// 인증 불필요 — 로그인/회원가입 플로우
export const authRoutes: PageRoute[] = [
  { path: ROUTES.LOGIN, Component: Login },
  { path: ROUTES.PASSWORD_RECOVERY, Component: PasswordRecovery },
  { path: ROUTES.SIGNUP, Component: Signup },
  { path: ROUTES.GOOGLE_SIGNUP_INFO, Component: GoogleSignupInfo },
];

// 하단탭 진입 가능 영역: 홈/전체메뉴/커뮤니티/마이페이지
export const mainRoutes: PageRoute[] = [
  { path: ROUTES.HOME, Component: HomePage },
  { path: ROUTES.ALL_MENU, Component: AllMenuPage },

  { path: ROUTES.COMMUNITY, Component: CommunityPage },
  { path: ROUTES.COMMUNITY_RESIDENCE, Component: CommunityResidencePage },
  { path: ROUTES.COMMUNITY_LIFE, Component: CommunityLifePage },
  { path: ROUTES.COMMUNITY_JOB, Component: CommunityJobPage },
  { path: ROUTES.COMMUNITY_FREE, Component: CommunityFreePage },
  { path: ROUTES.COMMUNITY_WRITE, Component: CommunityWritePage },
  { path: ROUTES.COMMUNITY_POST_DETAIL, Component: CommunityPostDetailPage },

  { path: ROUTES.MYPAGE, Component: MyPage },
  { path: ROUTES.MYPAGE_PROFILE, Component: ProfileEditPage },
  { path: ROUTES.MYPAGE_BADGE, Component: BadgeCertPage },
  { path: ROUTES.MYPAGE_BADGE_COMPLETE, Component: BadgeCertCompletePage },
  { path: ROUTES.MYPAGE_ACCOUNTS, Component: AccountManagePage },
  { path: ROUTES.MYPAGE_NOTIFICATIONS, Component: NotificationSettingsPage },
  { path: ROUTES.MYPAGE_LANGUAGE, Component: LanguageSettingsPage },
  { path: ROUTES.MYPAGE_SUBSCRIPTION, Component: SubscriptionPage },
  { path: ROUTES.MYPAGE_WALLET_HISTORY, Component: WalletHistoryPage },
  { path: ROUTES.MYPAGE_EXCHANGE_HISTORY, Component: ExchangeHistoryPage },
  { path: ROUTES.MYPAGE_DOC_ANALYSIS_HISTORY, Component: DocAnalysisHistoryPage },
];

// 기능 플로우: 충전/환전/정기송금/송금/문서분석
export const serviceRoutes: PageRoute[] = [
  { path: ROUTES.CHARGE, Component: ChargePage },
  { path: ROUTES.CHARGE_ADD_ACCOUNT, Component: AddAccountPage },
  { path: ROUTES.CHARGE_AUTO_DEBIT, Component: AutoDebitAuthPage },
  { path: ROUTES.CHARGE_ACCOUNT_REGISTERED, Component: AccountRegisteredPage },

  { path: ROUTES.EXCHANGE, Component: ExchangeSelectPage },
  { path: ROUTES.EXCHANGE_FORM, Component: ExchangeFormPage },
  { path: ROUTES.EXCHANGE_REVERSE, Component: ExchangeReversePage },
  { path: ROUTES.EXCHANGE_COMPLETE, Component: ExchangeCompletePage },

  { path: ROUTES.RECURRING, Component: RecurringTransferListPage },
  { path: ROUTES.RECURRING_SETUP, Component: RecurringTransferSetupPage },
  { path: ROUTES.RECURRING_COMPLETE, Component: RecurringTransferCompletePage },

  { path: ROUTES.TRANSFER, Component: TransferSelectPage },
  { path: ROUTES.TRANSFER_APP, Component: TransferAppPage },
  { path: ROUTES.TRANSFER_BANK, Component: TransferBankPage },
  { path: ROUTES.TRANSFER_CONFIRM, Component: TransferConfirmPage },
  { path: ROUTES.TRANSFER_AUTH, Component: TransferAuthPage },
  { path: ROUTES.TRANSFER_COMPLETE, Component: TransferCompletePage },

  { path: ROUTES.DOC_ANALYSIS, Component: DocAnalysisSelectPage },
  { path: ROUTES.DOC_ANALYSIS_PREVIEW, Component: DocAnalysisPreviewPage },
  { path: ROUTES.DOC_ANALYSIS_LOADING, Component: DocAnalysisLoadingPage },
  { path: ROUTES.DOC_ANALYSIS_RESULT, Component: DocAnalysisResultPage },
  { path: ROUTES.DOC_ANALYSIS_PAYMENT, Component: DocAnalysisPaymentPage },
];
