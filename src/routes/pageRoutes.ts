import type { ComponentType } from 'react';
import { ROUTES } from '@/constants/routes';
import Callback from '@/pages/auth/Callback/Callback';
import GoogleSignupInfo from '@/pages/auth/GoogleSignupInfo/GoogleSignupInfo';
import Login from '@/pages/auth/Login/Login';
import PasswordRecovery from '@/pages/auth/PasswordRecovery/PasswordRecovery';
import ResetPassword from '@/pages/auth/ResetPassword/ResetPassword';
import Signup from '@/pages/auth/Signup/Signup';
import CommunityCountryPage from '@/pages/community/Country/CommunityCountryPage';
import CommunityFreePage from '@/pages/community/Free/CommunityFreePage';
import CommunityJobPage from '@/pages/community/Job/CommunityJobPage';
import CommunityLifePage from '@/pages/community/Life/CommunityLifePage';
import CommunityVisaPage from '@/pages/community/Visa/CommunityVisaPage';
import CommunityPage from '@/pages/community/Main/CommunityPage';
import CommunityPostDetailPage from '@/pages/community/PostDetail/CommunityPostDetailPage';
import CommunityResidencePage from '@/pages/community/Residence/CommunityResidencePage';
import CommunityWritePage from '@/pages/community/Write/CommunityWritePage';
import DocAnalysisLoadingPage from '@/pages/docAnalysis/Loading/DocAnalysisLoadingPage';
import DocAnalysisPaymentPage from '@/pages/docAnalysis/Payment/DocAnalysisPaymentPage';
import DocAnalysisPreviewPage from '@/pages/docAnalysis/Preview/DocAnalysisPreviewPage';
import DocAnalysisResultPage from '@/pages/docAnalysis/Result/DocAnalysisResultPage';
import DocAnalysisSelectPage from '@/pages/docAnalysis/Select/DocAnalysisSelectPage';
import CurrencySettingsPage from '@/pages/home/CurrencySettings/CurrencySettingsPage';
import HomePage from '@/pages/home/HomePage';
import NotificationsPage from '@/pages/home/Notifications/NotificationsPage';
import AccountManagePage from '@/pages/MyPage/AccountManage/AccountManagePage';
import AllMenuPage from '@/pages/MyPage/AllMenu/AllMenuPage';
import AdditionalCertPage from '@/pages/MyPage/AdditionalCert/AdditionalCertPage';
import AdditionalCertCompletePage from '@/pages/MyPage/AdditionalCertComplete/AdditionalCertCompletePage';
import DocAnalysisHistoryPage from '@/pages/MyPage/DocAnalysisHistory/DocAnalysisHistoryPage';
import ExchangeHistoryPage from '@/pages/MyPage/ExchangeHistory/ExchangeHistoryPage';
import LanguageSettingsPage from '@/pages/MyPage/Language/LanguageSettingsPage';
import MyPage from '@/pages/MyPage/MyPage';
import NotificationSettingsPage from '@/pages/MyPage/Notifications/NotificationSettingsPage';
import ProfileEditPage from '@/pages/MyPage/Profile/ProfileEditPage';
import SubscriptionPage from '@/pages/MyPage/Subscription/SubscriptionPage';
import WalletHistoryPage from '@/pages/MyPage/WalletHistory/WalletHistoryPage';
import AccountRegisteredPage from '@/pages/wallet/AccountRegistered/AccountRegisteredPage';
import AddAccountPage from '@/pages/wallet/AddAccount/AddAccountPage';
import AutoDebitAuthPage from '@/pages/wallet/AutoDebitAuth/AutoDebitAuthPage';
import ChargePage from '@/pages/wallet/Charge/ChargePage';
import ExchangeCompletePage from '@/pages/wallet/ExchangeComplete/ExchangeCompletePage';
import ExchangeFormPage from '@/pages/wallet/ExchangeForm/ExchangeFormPage';
import ExchangeReversePage from '@/pages/wallet/ExchangeReverse/ExchangeReversePage';
import ExchangeSelectPage from '@/pages/wallet/ExchangeSelect/ExchangeSelectPage';
import RecurringTransferCompletePage from '@/pages/wallet/RecurringComplete/RecurringTransferCompletePage';
import RecurringTransferListPage from '@/pages/wallet/RecurringList/RecurringTransferListPage';
import RecurringTransferSetupPage from '@/pages/wallet/RecurringSetup/RecurringTransferSetupPage';
import TransferAppPage from '@/pages/wallet/TransferApp/TransferAppPage';
import TransferAuthPage from '@/pages/wallet/TransferAuth/TransferAuthPage';
import TransferBankPage from '@/pages/wallet/TransferBank/TransferBankPage';
import TransferCompletePage from '@/pages/wallet/TransferComplete/TransferCompletePage';
import TransferReceiptPage from '@/pages/wallet/TransferReceipt/TransferReceiptPage';
import ExchangeRateFullPage from '@/pages/wallet/ExchangeRateFull/ExchangeRateFullPage';
import TransferConfirmPage from '@/pages/wallet/TransferConfirm/TransferConfirmPage';
import TransferPinSetupPage from '@/pages/wallet/TransferPinSetup/TransferPinSetupPage';
import TransferSelectPage from '@/pages/wallet/TransferSelect/TransferSelectPage';

export interface PageRoute {
  path: string;
  Component: ComponentType;
}

// 인증 불필요 — 로그인/회원가입 플로우
export const authRoutes: PageRoute[] = [
  { path: ROUTES.LOGIN, Component: Login },
  { path: ROUTES.PASSWORD_RECOVERY, Component: PasswordRecovery },
  { path: ROUTES.RESET_PASSWORD, Component: ResetPassword }, // 메일 링크 → 새 비밀번호 입력
  { path: ROUTES.SIGNUP, Component: Signup },
  { path: ROUTES.GOOGLE_SIGNUP_INFO, Component: GoogleSignupInfo },
  { path: ROUTES.AUTH_CALLBACK, Component: Callback }, // ② 토큰 받는 화면
];

// 하단탭 진입 가능 영역: 홈/전체메뉴/커뮤니티/마이페이지
export const mainRoutes: PageRoute[] = [
  { path: ROUTES.HOME, Component: HomePage },
  { path: ROUTES.HOME_CURRENCY_SETTINGS, Component: CurrencySettingsPage },
  { path: ROUTES.ALL_MENU, Component: AllMenuPage },
  { path: ROUTES.NOTIFICATIONS, Component: NotificationsPage },

  { path: ROUTES.COMMUNITY, Component: CommunityPage },
  { path: ROUTES.COMMUNITY_RESIDENCE, Component: CommunityResidencePage },
  { path: ROUTES.COMMUNITY_LIFE, Component: CommunityLifePage },
  { path: ROUTES.COMMUNITY_JOB, Component: CommunityJobPage },
  { path: ROUTES.COMMUNITY_VISA, Component: CommunityVisaPage },
  { path: ROUTES.COMMUNITY_COUNTRY, Component: CommunityCountryPage },
  { path: ROUTES.COMMUNITY_FREE, Component: CommunityFreePage },
  { path: ROUTES.COMMUNITY_WRITE, Component: CommunityWritePage },
  { path: ROUTES.COMMUNITY_POST_EDIT, Component: CommunityWritePage },
  { path: ROUTES.COMMUNITY_POST_DETAIL, Component: CommunityPostDetailPage },

  { path: ROUTES.MYPAGE, Component: MyPage },
  { path: ROUTES.MYPAGE_PROFILE, Component: ProfileEditPage },
  { path: ROUTES.MYPAGE_BADGE, Component: AdditionalCertPage },
  { path: ROUTES.MYPAGE_BADGE_COMPLETE, Component: AdditionalCertCompletePage },
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
  { path: ROUTES.EXCHANGE_RATES_FULL, Component: ExchangeRateFullPage },

  { path: ROUTES.RECURRING, Component: RecurringTransferListPage },
  { path: ROUTES.RECURRING_SETUP, Component: RecurringTransferSetupPage },
  { path: ROUTES.RECURRING_COMPLETE, Component: RecurringTransferCompletePage },

  { path: ROUTES.TRANSFER, Component: TransferSelectPage },
  { path: ROUTES.TRANSFER_APP, Component: TransferAppPage },
  { path: ROUTES.TRANSFER_BANK, Component: TransferBankPage },
  { path: ROUTES.TRANSFER_CONFIRM, Component: TransferConfirmPage },
  { path: ROUTES.TRANSFER_AUTH, Component: TransferAuthPage },
  { path: ROUTES.TRANSFER_PIN_SETUP, Component: TransferPinSetupPage },
  { path: ROUTES.TRANSFER_COMPLETE, Component: TransferCompletePage },
  { path: ROUTES.TRANSFER_RECEIPT, Component: TransferReceiptPage },

  { path: ROUTES.DOC_ANALYSIS, Component: DocAnalysisSelectPage },
  { path: ROUTES.DOC_ANALYSIS_PREVIEW, Component: DocAnalysisPreviewPage },
  { path: ROUTES.DOC_ANALYSIS_LOADING, Component: DocAnalysisLoadingPage },
  { path: ROUTES.DOC_ANALYSIS_RESULT, Component: DocAnalysisResultPage },
  { path: ROUTES.DOC_ANALYSIS_PAYMENT, Component: DocAnalysisPaymentPage },
];
