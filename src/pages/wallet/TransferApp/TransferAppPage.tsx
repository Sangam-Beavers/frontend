import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { useRecentInternalRecipients } from '@/hooks/useRecentInternalRecipients';
import { useTransferSupportedCurrencies } from '@/hooks/useTransferSupportedCurrencies';
import styles from './TransferAppPage.module.css';

// 아바타 색상 톤 — mock에서 들고 있던 5색 그대로. 백엔드는 톤을 안 주므로 인덱스로 순환 매핑.
type AvatarTone = 'best' | 'good' | 'mid' | 'warn' | 'bad';
const TONES: AvatarTone[] = ['best', 'good', 'mid', 'warn', 'bad'];

const AVATAR_CLASS: Record<AvatarTone, string> = {
  best: styles.avatarBest,
  good: styles.avatarGood,
  mid: styles.avatarMid,
  warn: styles.avatarWarn,
  bad: styles.avatarBad,
};

/** 화면에서 다루는 수신자 표시 모델 — API 응답에서 파생. */
interface RecipientDisplay {
  identifier: string; // nickname (검증/송금 API용 식별자는 다음 PR에서 member_public_id로 교체 검토)
  name: string;
  initial: string;
  currency: string;
  tone: AvatarTone;
}

export default function TransferAppPage() {
  const navigate = useNavigate();

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

  // API 응답 → 화면용 모델 변환. tone은 인덱스 순환.
  const recentRecipients: RecipientDisplay[] = useMemo(() => {
    const list = recipientsData?.receivers ?? [];
    return list.map((r, idx) => ({
      identifier: r.nickname,
      name: r.nickname,
      initial: r.nickname.charAt(0).toUpperCase() || '?',
      currency: r.last_currency_code,
      tone: TONES[idx % TONES.length],
    }));
  }, [recipientsData]);

  const [recipient, setRecipient] = useState('');
  const [verified, setVerified] = useState<RecipientDisplay | null>(null);
  const [currency, setCurrency] = useState('VND');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  function handleVerify() {
    // 임시: 최근 수신자 리스트에서 닉네임 매칭. 진짜 검증은 다음 PR(POST /transfers/receivers/search).
    const found = recentRecipients.find(
      (u) => u.identifier.toLowerCase() === recipient.toLowerCase()
    );
    setVerified(found ?? null);
  }

  function handleRecentSelect(user: RecipientDisplay) {
    setRecipient(user.identifier);
    setVerified(user);
    setCurrency(user.currency);
  }

  const canSubmit = verified !== null && Number(amount) > 0;

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="앱 사용자 송금" onBack={() => navigate('/transfer')} />

        <div className={styles.section}>최근 송금한 대상</div>

        {/* 최근 수신자 칩 — 로딩/에러/빈 상태 처리 (#120 패턴) */}
        {recipientsLoading ? (
          <div className={styles.emptyText}>불러오는 중...</div>
        ) : hasRecipientsError ? (
          <div className={styles.emptyText}>
            최근 송금 기록을 불러오지 못했어요.
            <button type="button" className={styles.retryBtn} onClick={() => refetchRecipients()}>
              다시 시도
            </button>
          </div>
        ) : recentRecipients.length === 0 ? (
          <div className={styles.emptyText}>아직 송금 기록이 없습니다.</div>
        ) : (
          <div className={styles.scrollRow}>
            {recentRecipients.map((user) => (
              <div
                key={user.identifier}
                className={styles.recentCard}
                onClick={() => handleRecentSelect(user)}
              >
                <div className={`${styles.avatar} ${AVATAR_CLASS[user.tone]}`}>{user.initial}</div>
                <div className={styles.recentName}>{user.name}</div>
                <div className={styles.recentCurrency}>{user.currency}</div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>받는 사람 닉네임</label>
          <div className={styles.inputRow}>
            <input
              type="text"
              placeholder="닉네임 입력"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setVerified(null);
              }}
            />
            <button type="button" className={styles.inputAction} onClick={handleVerify}>
              확인
            </button>
          </div>
        </div>

        {verified && (
          <div className={styles.verifiedCard}>
            <div className={`${styles.avatar} ${AVATAR_CLASS[verified.tone]}`}>
              {verified.initial}
            </div>
            <div className={styles.verifiedInfo}>
              <div className={styles.verifiedName}>
                {verified.name}
                <span className={styles.pill}>인증</span>
              </div>
              <div className={styles.verifiedMeta}>최근 송금했던 사용자</div>
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-currency">
            보낼 통화
          </label>
          <select
            id="transfer-currency"
            className={styles.select}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={currenciesLoading || hasCurrenciesError || currencies.length === 0}
          >
            {currenciesLoading && <option value="">불러오는 중...</option>}
            {hasCurrenciesError && <option value="">통화 불러오기 실패</option>}
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
              다시 시도
            </button>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-amount">
            보낼 금액
          </label>
          <input
            id="transfer-amount"
            type="number"
            className={styles.input}
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-memo">
            메모
          </label>
          <input
            id="transfer-memo"
            type="text"
            className={styles.input}
            placeholder="메모 (선택)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.fixedBtn}>
        <button
          className={styles.primaryBtn}
          disabled={!canSubmit}
          onClick={() => navigate('/transfer/confirm')}
        >
          다음
        </button>
      </div>
    </>
  );
}
