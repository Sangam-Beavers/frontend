export const ROUTES = {
  // ===== Auth =====
  LOGIN: '/login',
  PASSWORD_RECOVERY: '/password-recovery',
  // 비밀번호 재설정 — 메일 링크가 가리키는 화면(?token=... 쿼리로 토큰 수신).
  // 백엔드 app.password-reset.base-url(기본 http://localhost:5173/reset-password)과 경로가 일치해야 한다.
  RESET_PASSWORD: '/reset-password',
  SIGNUP: '/signup',
  GOOGLE_SIGNUP_INFO: '/google-signup-info',
  AUTH_CALLBACK: '/auth/callback', // Authentik 로그인 후 돌아오는 주소(②)

  // ===== Main: bottom-tab destinations =====
  HOME: '/',
  ALL_MENU: '/menu',
  NOTIFICATIONS: '/notifications',
  HOME_CURRENCY_SETTINGS: '/home/currency-settings',

  // ===== Main: Community =====
  COMMUNITY: '/community',
  COMMUNITY_RESIDENCE: '/community/residence',
  COMMUNITY_LIFE: '/community/life',
  COMMUNITY_JOB: '/community/job',
  COMMUNITY_VISA: '/community/visa',
  COMMUNITY_COUNTRY: '/community/country',
  COMMUNITY_FREE: '/community/free',
  COMMUNITY_WRITE: '/community/write',
  COMMUNITY_POST_DETAIL: '/community/posts/:postId',

  // ===== Main: MyPage =====
  MYPAGE: '/mypage',
  MYPAGE_PROFILE: '/mypage/profile',
  MYPAGE_BADGE: '/mypage/badge',
  MYPAGE_BADGE_COMPLETE: '/mypage/badge/complete',
  MYPAGE_ACCOUNTS: '/mypage/accounts',
  MYPAGE_NOTIFICATIONS: '/mypage/notifications',
  MYPAGE_LANGUAGE: '/mypage/language',
  MYPAGE_SUBSCRIPTION: '/mypage/subscription',
  MYPAGE_WALLET_HISTORY: '/mypage/wallet-history',
  MYPAGE_EXCHANGE_HISTORY: '/mypage/exchange-history',
  MYPAGE_DOC_ANALYSIS_HISTORY: '/mypage/doc-analysis-history',

  // ===== Service: Charge =====
  CHARGE: '/charge',
  CHARGE_ADD_ACCOUNT: '/charge/add-account',
  CHARGE_AUTO_DEBIT: '/charge/auto-debit',
  CHARGE_ACCOUNT_REGISTERED: '/charge/account-registered',

  // ===== Service: Exchange =====
  EXCHANGE: '/exchange',
  EXCHANGE_FORM: '/exchange/form',
  EXCHANGE_REVERSE: '/exchange/reverse',
  EXCHANGE_COMPLETE: '/exchange/complete',
  EXCHANGE_RATES_FULL: '/exchange/rates',

  // ===== Service: Recurring transfer =====
  RECURRING: '/recurring',
  RECURRING_SETUP: '/recurring/setup',
  RECURRING_COMPLETE: '/recurring/complete',

  // ===== Service: Transfer =====
  TRANSFER: '/transfer',
  TRANSFER_APP: '/transfer/app',
  TRANSFER_BANK: '/transfer/bank',
  TRANSFER_CONFIRM: '/transfer/confirm',
  TRANSFER_AUTH: '/transfer/auth',
  TRANSFER_PIN_SETUP: '/transfer/pin-setup', // 송금 PIN 최초 등록 (PIN은 새 설계라 와이어프레임에 없음)
  TRANSFER_COMPLETE: '/transfer/complete',
  TRANSFER_RECEIPT: '/transfer/receipt',

  // ===== Service: Document analysis =====
  DOC_ANALYSIS: '/doc-analysis',
  DOC_ANALYSIS_PREVIEW: '/doc-analysis/preview',
  DOC_ANALYSIS_LOADING: '/doc-analysis/loading',
  DOC_ANALYSIS_RESULT: '/doc-analysis/result',
  DOC_ANALYSIS_PAYMENT: '/doc-analysis/payment',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export const buildCommunityPostPath = (postId: string): string => `/community/posts/${postId}`;
