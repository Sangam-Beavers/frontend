import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { useRecentInternalRecipients } from '@/hooks/useRecentInternalRecipients';
import { useValidateMember } from '@/hooks/useValidateMember';
import { useTransferSupportedCurrencies } from '@/hooks/useTransferSupportedCurrencies';
import { useSetting } from '@/hooks/useServiceSettings';
import type { AvatarTone } from '@/types/community';
import { trustGradeToTone } from '@/utils/trustGrade';
import styles from './TransferAppPage.module.css';

// 신뢰등급 톤 → CSS 클래스 (Phase 3 실데이터 연결 — mock 순환 배색 제거)
const AVATAR_CLASS: Partial<Record<AvatarTone, string>> = {
  default: styles.avatarDefault,
  good: styles.avatarGood,
  best: styles.avatarBest,
  purple: styles.avatarPurple,
  gold: styles.avatarGold,
};

/** 화면에서 다루는 수신자 표시 모델 — API 응답에서 파생. */
interface RecipientDisplay {
  identifier: string; // nickname (검증/송금 API용 식별자는 다음 PR에서 member_public_id로 교체 검토)
  name: string;
  initial: string;
  currency: string;
  tone: AvatarTone;
  /** 최근 송금 칩에서 고른 수신자만 true. 이메일로 새로 검증한 수신자는 false (메타 라벨 구분용). */
  isRecent: boolean;
}

export default function TransferAppPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // 통화 드롭다운 (#120 패턴)
  const {
    data: currenciesData,
    isLoading: currenciesLoading,
    error: currenciesError,
    refetch: refetchCurrencies,
  } = useTransferSupportedCurrencies();
  const currencies = currenciesData?.currencies ?? [];
  const hasCurrenciesError = currenciesError != null;

  // 최근 송금 앱 사용자 (#122 신규)
  const {
    data: recipientsData,
    isLoading: recipientsLoading,
    error: recipientsError,
    refetch: refetchRecipients,
  } = useRecentInternalRecipients();
  const hasRecipientsError = recipientsError != null;

  // API 응답 → 화면용 모델 변환. tone은 trust_grade에서 매핑 (Phase 3 실데이터 연결).
  const recentRecipients: RecipientDisplay[] = useMemo(() => {
    const list = recipientsData?.receivers ?? [];
    return list.map((r) => ({
      identifier: r.nickname,
      name: r.nickname,
      initial: r.nickname.charAt(0).toUpperCase() || '?',
      currency: r.last_currency_code,
      tone: trustGradeToTone(r.trust_grade),
      isRecent: true,
    }));
  }, [recipientsData]);

  const [recipient, setRecipient] = useState('');
  const [verified, setVerified] = useState<RecipientDisplay | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  // 검증 mutation (#131) — 사용자가 "확인" 누를 때 1회 호출.
  const validateMutation = useValidateMember();
  // 기본 통화는 KRW — 한국 거주 사용자 기준 가장 흔하고, 원화 송금 한도(최소/최대/일일)가
  // 첫 화면부터 보이도록. 다른 통화는 드롭다운에서 선택.
  const [currency, setCurrency] = useState('KRW');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  // 서비스 설정 — 송금 한도
  // 폴백 기본값은 백엔드 정책(app-admin-service)과 동일하게 둔다. 백엔드가 설정을 내려주면 그 값으로
  // 덮어쓰고(배포), 설정 API가 값을 안 주는 환경(로컬 등)에선 이 기본값이 떠서 한도가 동일하게 표시·적용된다.
  const maxAmountSetting = useSetting('MAX_TRANSFER_AMOUNT', '5000000');
  const minAmountSetting = useSetting('MIN_TRANSFER_AMOUNT', '1100');
  const dailyMaxSetting = useSetting('MAX_DAILY_TRANSFER', '100100');
  const maxAmount = Number(maxAmountSetting);
  const minAmount = Number(minAmountSetting);
  const dailyMax = Number(dailyMaxSetting);

  function getAmountError(): string | null {
    const num = Number(amount);
    if (!amount || !Number.isFinite(num) || num <= 0) return null;
    // 송금 한도(MIN/MAX/일일)는 원화(KRW) 기준 설정값이고, 현재 송금은 same-currency만 지원한다
    // (외화는 환전 없이 같은 통화로 이동). 따라서 KRW 송금일 때만 한도를 적용한다 — USD 등 외화 금액에
    // ₩ 한도를 그대로 비교하면(예: 10 USD < 1100) 정상 송금이 막힌다.
    if (currency === 'KRW') {
      if (minAmount > 0 && num < minAmount) {
        return `최소 송금 금액은 ₩${minAmount.toLocaleString()}입니다.`;
      }
      if (maxAmount > 0 && num > maxAmount) {
        return `1회 최대 송금 금액은 ₩${maxAmount.toLocaleString()}입니다.`;
      }
      if (dailyMax > 0 && num > dailyMax) {
        return `일일 한도 ₩${dailyMax.toLocaleString()}을 초과합니다.`;
      }
    }
    return null;
  }
  const amountError = getAmountError();

  function handleVerify() {
    setVerifyError(null);
    const trimmed = recipient.trim();
    if (!trimmed) {
      setVerifyError(t('transfer.app.errorEmailRequired'));
      return;
    }
    validateMutation.mutate(trimmed, {
      onSuccess: (res) => {
        // 응답엔 닉네임/is_verified/receiver_public_id가 들어옴. 화면 모델로 변환.
        // receiver_public_id는 verified state의 identifier 필드에 저장 — 송금 실행 시 식별자로 사용 예정.
        setVerified({
          identifier: res.receiver_public_id,
          name: res.nickname,
          initial: res.nickname.charAt(0).toUpperCase() || '?',
          // 통화는 백엔드 응답에 없음 → 현재 selectedCurrency 유지 (사용자가 따로 선택).
          currency,
          tone: trustGradeToTone(res.trust_grade),
          // 이메일로 새로 검증한 수신자 — '최근 송금했던 사용자'가 아님.
          isRecent: false,
        });
      },
      onError: (err) => {
        setVerified(null);
        if (err instanceof ApiException) {
          if (err.code === 'COMMON4001') setVerifyError(t('transfer.app.errorInvalidEmail'));
          else if (err.code === 'MEMBER4001') setVerifyError(t('transfer.app.errorMemberNotFound'));
          else if (err.code === 'NETWORK_ERROR') setVerifyError(t('transfer.app.errorNetwork'));
          else setVerifyError(err.message || t('transfer.app.errorVerifyFailed'));
        } else {
          setVerifyError(t('transfer.app.errorVerifyFailed'));
        }
      },
    });
  }

  function handleRecentSelect(user: RecipientDisplay) {
    setRecipient(user.identifier);
    setVerified(user);
    setCurrency(user.currency);
  }

  const canSubmit = verified !== null && Number(amount) > 0 && amountError === null;

  /**
   * "다음" 버튼 — TransferConfirm으로 송금 정보를 state로 전달.
   *
   * <p>기존 TransferConfirm/Auth가 받던 표시용 필드(currency/amount/recipientName 등)는 그대로 유지하면서
   * 송금 실행 body 조립에 필요한 신규 옵셔널 필드(transferType/receiverPublicId/amountDecimal/memo)를
   * 같이 보낸다. 사용자가 정수만 입력했지만 백엔드는 소수 4자리 string이라 amountDecimal로 정규화.
   * REMITTANCE 흐름(TransferBank)은 신규 필드 없이 기존 흐름대로 동작 — 다음 사이클에 같이 정리.
   */
  function handleNext() {
    if (!verified) return;
    // 방어적 NaN 가드 — canSubmit이 Number(amount) > 0을 체크하지만,
    // 비정상 입력(빈 문자열·문자 등)이 들어왔을 때 NaN.toFixed(4) → "NaN"이 백엔드로 가는 것을 막는다.
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;
    const amountDecimal = numericAmount.toFixed(4);
    navigate('/transfer/confirm', {
      state: {
        // 표시용 (기존 컨벤션 유지)
        recipientName: verified.name,
        recipientInitial: verified.initial,
        recipientKind: 'user' as const,
        currency,
        amount, // 사용자 입력 그대로 ("10000") — TransferConfirm이 통화 기호 붙여 표시
        // 송금 실행 body 조립용 (신규 필드)
        transferType: 'INTERNAL_TRANSFER' as const,
        receiverPublicId: verified.identifier,
        amountDecimal,
        memo: memo.trim() ? memo.trim() : null,
      },
    });
  }

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar
          title={t('transfer.app.title')}
          onBack={() => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.TRANSFER))}
        />

        <div className={styles.section}>{t('transfer.app.recentSection')}</div>

        {/* 최근 수신자 칩 — 로딩/에러/빈 상태 처리 (#120 패턴) */}
        {recipientsLoading ? (
          <div className={styles.emptyText}>{t('transfer.app.loading')}</div>
        ) : hasRecipientsError ? (
          <div className={styles.emptyText}>
            {t('transfer.app.recentLoadError')}
            <button type="button" className={styles.retryBtn} onClick={() => refetchRecipients()}>
              {t('transfer.app.retry')}
            </button>
          </div>
        ) : recentRecipients.length === 0 ? (
          <div className={styles.emptyText}>{t('transfer.app.recentEmpty')}</div>
        ) : (
          <div className={styles.scrollRow}>
            {recentRecipients.map((user) => (
              <div
                key={user.identifier}
                className={styles.recentCard}
                onClick={() => handleRecentSelect(user)}
              >
                <div
                  className={`${styles.avatar} ${AVATAR_CLASS[user.tone] ?? styles.avatarDefault}`}
                >
                  {user.initial}
                </div>
                <div className={styles.recentName}>{user.name}</div>
                <div className={styles.recentCurrency}>{user.currency}</div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>{t('transfer.app.recipientEmailLabel')}</label>
          <div className={styles.inputRow}>
            <input
              type="email"
              placeholder={t('transfer.app.recipientEmailPlaceholder')}
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setVerified(null);
                setVerifyError(null);
              }}
            />
            <button
              type="button"
              className={styles.inputAction}
              onClick={handleVerify}
              disabled={validateMutation.isPending}
            >
              {validateMutation.isPending ? t('transfer.app.verifying') : t('transfer.app.verify')}
            </button>
          </div>
          {verifyError && (
            <div className={styles.errorText} role="alert">
              {verifyError}
            </div>
          )}
        </div>

        {verified && (
          <div className={styles.verifiedCard}>
            <div
              className={`${styles.avatar} ${AVATAR_CLASS[verified.tone] ?? styles.avatarDefault}`}
            >
              {verified.initial}
            </div>
            <div className={styles.verifiedInfo}>
              <div className={styles.verifiedName}>
                {verified.name}
                <span className={styles.pill}>{t('transfer.app.verifiedBadge')}</span>
              </div>
              <div className={styles.verifiedMeta}>
                {verified.isRecent
                  ? t('transfer.app.verifiedMeta')
                  : t('transfer.app.verifiedMetaVerified')}
              </div>
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-currency">
            {t('transfer.app.currencyLabel')}
          </label>
          <select
            id="transfer-currency"
            className={styles.select}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={currenciesLoading || hasCurrenciesError || currencies.length === 0}
          >
            {currenciesLoading && <option value="">{t('transfer.app.loading')}</option>}
            {hasCurrenciesError && <option value="">{t('transfer.app.currencyLoadError')}</option>}
            {!currenciesLoading &&
              !hasCurrenciesError &&
              currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.name}
                </option>
              ))}
          </select>
          {hasCurrenciesError && (
            <button type="button" className={styles.retryBtn} onClick={() => refetchCurrencies()}>
              {t('transfer.app.retry')}
            </button>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-amount">
            {t('transfer.app.amountLabel')}
          </label>
          <input
            id="transfer-amount"
            type="number"
            className={`${styles.input} ${amountError ? styles.inputError : ''}`}
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {amountError && <p className={styles.errorText}>{amountError}</p>}
          {!amountError &&
            currency === 'KRW' &&
            (minAmount > 0 || maxAmount > 0 || dailyMax > 0) && (
              <p className={styles.hintText}>
                {minAmount > 0 && `최소 ₩${minAmount.toLocaleString()}`}
                {minAmount > 0 && maxAmount > 0 && ' · '}
                {maxAmount > 0 && `최대 ₩${maxAmount.toLocaleString()}`}
                {dailyMax > 0 && ` · 일 한도 ₩${dailyMax.toLocaleString()}`}
              </p>
            )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-memo">
            {t('transfer.app.memoLabel')}
          </label>
          <input
            id="transfer-memo"
            type="text"
            className={styles.input}
            placeholder={t('transfer.app.memoPlaceholder')}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.fixedBtn}>
        <button className={styles.primaryBtn} disabled={!canSubmit} onClick={handleNext}>
          {t('transfer.app.next')}
        </button>
      </div>
    </>
  );
}
