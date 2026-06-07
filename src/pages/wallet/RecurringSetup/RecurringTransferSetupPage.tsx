// ─────────────────────────────────────────────────────────────
// pages/wallet/RecurringSetup/RecurringTransferSetupPage.tsx
// 정기 송금 설정 (INTERNAL_TRANSFER 한정 — 앱 사용자 간)
//
// 데이터:
//   - 수신자: useRecentInternalRecipients (최근 송금) + useValidateMember (이메일 검색)
//     ↑ TransferAppPage와 동일 패턴 (C 방식: 둘 다 노출)
//   - 통화: useTransferSupportedCurrencies
//   - 제출: useValidateScheduled → is_valid 확인 → useCreateScheduled → /recurring/complete
//
// 백엔드 미지원 정리:
//   - 빈도 '매일'(DAILY) → 백엔드 WEEKLY/MONTHLY만 지원 → 옵션 제거
//   - 시작일 → 백엔드가 next_run_date 자동 계산 → 입력 제거
//   - 종료조건(무기한/횟수/날짜) → 백엔드 미지원(현재 무기한만) → 입력 제거
//
// 1·2단계 same-currency 강제: currency_code === receive_currency_code로 보낸다 (다통화는 다음 단계).
// 자기 자신에게 송금 차단은 백엔드가 validate에서 처리(is_valid=false + reason).
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import type { CreateScheduledTransferRequest, ScheduledTransferFrequency } from '@/api/wallet';
import TopBar from '@/components/navigation/TopBar';
import { useCreateScheduled } from '@/hooks/useCreateScheduled';
import { useRecentInternalRecipients } from '@/hooks/useRecentInternalRecipients';
import { useTransferSupportedCurrencies } from '@/hooks/useTransferSupportedCurrencies';
import { useValidateMember } from '@/hooks/useValidateMember';
import { useValidateScheduled } from '@/hooks/useValidateScheduled';
import styles from './RecurringTransferSetupPage.module.css';

// 아바타 색상 톤 — TransferAppPage와 동일 (API 응답에는 톤이 없어 인덱스 순환).
type AvatarTone = 'best' | 'good' | 'mid' | 'warn' | 'bad';
const TONES: AvatarTone[] = ['best', 'good', 'mid', 'warn', 'bad'];
const AVATAR_CLASS: Record<AvatarTone, string> = {
  best: styles.avatarBest,
  good: styles.avatarGood,
  mid: styles.avatarMid,
  warn: styles.avatarWarn,
  bad: styles.avatarBad,
};

/**
 * 화면용 수신자 모델. identifier는 검증 후 백엔드 receiver_public_id가 채워진다.
 * - 최근 송금 칩 클릭 → identifier = recipient.member_public_id (즉시 검증된 상태로 간주)
 * - 이메일 입력 + 확인 → useValidateMember 응답의 receiver_public_id로 채움
 */
interface RecipientDisplay {
  identifier: string;
  name: string;
  initial: string;
  tone: AvatarTone;
}

/** 화면 라벨 → 백엔드 enum 매핑. '매일' 미지원이라 매주/매월 2종만. */
type ScheduleType = '' | '매주' | '매월';
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']; // ISO 1=월~7=일
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1); // 1~28 (말일 안전)

export default function RecurringTransferSetupPage() {
  const navigate = useNavigate();

  // ===== 통화 드롭다운 =====
  const {
    data: currenciesData,
    isLoading: currenciesLoading,
    error: currenciesError,
    refetch: refetchCurrencies,
  } = useTransferSupportedCurrencies();
  const currencies = currenciesData?.currencies ?? [];
  const hasCurrenciesError = currenciesError != null;

  // ===== 최근 송금한 앱 사용자 =====
  const {
    data: recipientsData,
    isLoading: recipientsLoading,
    error: recipientsError,
    refetch: refetchRecipients,
  } = useRecentInternalRecipients();
  const hasRecipientsError = recipientsError != null;

  const recentRecipients: RecipientDisplay[] = useMemo(() => {
    const list = recipientsData?.receivers ?? [];
    return list.map((r, idx) => ({
      identifier: r.member_public_id,
      name: r.nickname,
      initial: r.nickname.charAt(0).toUpperCase() || '?',
      tone: TONES[idx % TONES.length],
    }));
  }, [recipientsData]);

  // ===== 이메일 검색 + 검증 mutation =====
  const [emailInput, setEmailInput] = useState('');
  const [verified, setVerified] = useState<RecipientDisplay | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const validateMutation = useValidateMember();

  function handleVerify() {
    setVerifyError(null);
    const trimmed = emailInput.trim();
    if (!trimmed) {
      setVerifyError('이메일을 입력해주세요.');
      return;
    }
    validateMutation.mutate(trimmed, {
      onSuccess: (res) => {
        setVerified({
          identifier: res.receiver_public_id,
          name: res.nickname,
          initial: res.nickname.charAt(0).toUpperCase() || '?',
          tone: 'good',
        });
      },
      onError: (err) => {
        setVerified(null);
        if (err instanceof ApiException) {
          if (err.code === 'COMMON4001') setVerifyError('이메일 형식을 확인해주세요.');
          else if (err.code === 'MEMBER4001')
            setVerifyError('해당 이메일의 회원을 찾을 수 없습니다.');
          else setVerifyError(err.message || '확인에 실패했습니다.');
        } else {
          setVerifyError('확인에 실패했습니다.');
        }
      },
    });
  }

  function handleRecentSelect(user: RecipientDisplay) {
    setEmailInput(''); // 입력 초기화 — 최근 송금 칩 선택이 곧 검증 완료 의미
    setVerified(user);
    setVerifyError(null);
  }

  // ===== 폼 상태 =====
  const [currency, setCurrency] = useState('VND');
  const [amount, setAmount] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('');
  const [scheduleDay, setScheduleDay] = useState(''); // 매주: 요일 라벨, 매월: 일자 string
  const [memo, setMemo] = useState('');

  // ===== 제출 mutation =====
  const validateScheduled = useValidateScheduled();
  const createScheduled = useCreateScheduled();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSubmitting = validateScheduled.isPending || createScheduled.isPending;

  const canSubmit =
    verified !== null &&
    currency !== '' &&
    Number(amount) > 0 &&
    scheduleType !== '' &&
    scheduleDay !== '';

  /** 화면 입력을 백엔드 요청 body로 변환. */
  function buildRequest(): CreateScheduledTransferRequest | null {
    if (!verified) return null;
    const frequency: ScheduledTransferFrequency = scheduleType === '매주' ? 'WEEKLY' : 'MONTHLY';
    const day =
      scheduleType === '매주'
        ? WEEKDAYS.indexOf(scheduleDay) + 1 // ISO 1=월~7=일
        : Number(scheduleDay);
    if (!day || day < 1) return null;
    return {
      transfer_type: 'INTERNAL_TRANSFER',
      receiver_public_id: verified.identifier,
      amount: String(amount),
      currency_code: currency,
      receive_currency_code: currency, // 1·2단계 same-currency 강제
      frequency,
      schedule_day: day,
      memo: memo.trim() ? memo.trim() : null,
    };
  }

  function handleSubmit() {
    setSubmitError(null);
    const body = buildRequest();
    if (!body) {
      setSubmitError('입력값을 확인해주세요.');
      return;
    }

    // 1단계 — 사전 검증 (HTTP 200 + is_valid=false도 비즈니스 실패)
    validateScheduled.mutate(body, {
      onSuccess: (res) => {
        if (!res.is_valid) {
          setSubmitError(res.reason ?? '정기 송금 대상 검증에 실패했습니다.');
          return;
        }
        // 2단계 — 실제 등록
        createScheduled.mutate(body, {
          onSuccess: (created) => {
            // RecurringComplete에서 사용자 친화 표시를 위해 응답 + 수신자 이름까지 함께 넘김
            navigate('/recurring/complete', {
              state: { scheduled: created, recipientName: verified?.name ?? null },
            });
          },
          onError: (err) => {
            if (err instanceof ApiException) {
              setSubmitError(err.message || '정기 송금 설정에 실패했습니다.');
            } else {
              setSubmitError('정기 송금 설정에 실패했습니다.');
            }
          },
        });
      },
      onError: (err) => {
        // 형식 오류 등 (백엔드 400 COMMON4001)
        if (err instanceof ApiException) {
          setSubmitError(err.message || '입력값을 확인해주세요.');
        } else {
          setSubmitError('검증에 실패했습니다.');
        }
      },
    });
  }

  return (
    <div className={styles.contentPad}>
      <TopBar title="정기 송금 설정" />

      {/* 최근 송금 앱 사용자 */}
      <div className={styles.section}>최근 송금한 대상</div>
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
        <div className={styles.emptyText}>
          아직 송금 기록이 없습니다. 아래에 이메일로 검색하세요.
        </div>
      ) : (
        <div className={styles.scrollRow}>
          {recentRecipients.map((user) => (
            <button
              key={user.identifier}
              type="button"
              className={styles.recentCard}
              onClick={() => handleRecentSelect(user)}
            >
              <div className={`${styles.avatarBig} ${AVATAR_CLASS[user.tone]}`}>{user.initial}</div>
              <div className={styles.recentName}>{user.name}</div>
            </button>
          ))}
        </div>
      )}

      {/* 이메일로 검색 */}
      <div className={styles.field}>
        <label className={styles.label}>받는 사람 이메일</label>
        <div className={styles.inputRow}>
          <input
            type="email"
            placeholder="이메일 입력 (예: user@example.com)"
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value);
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
            {validateMutation.isPending ? '확인 중...' : '확인'}
          </button>
        </div>
        {verifyError && (
          <div className={styles.errorText} role="alert">
            {verifyError}
          </div>
        )}
      </div>

      {/* 검증된 수신자 카드 */}
      {verified && (
        <div className={styles.verifiedCard}>
          <div className={`${styles.avatarBig} ${AVATAR_CLASS[verified.tone]}`}>
            {verified.initial}
          </div>
          <div className={styles.verifiedInfo}>
            <div className={styles.verifiedName}>
              {verified.name}
              <span className={styles.pill}>확인됨</span>
            </div>
            <div className={styles.verifiedMeta}>앱 사용자 정기 송금</div>
          </div>
        </div>
      )}

      {/* 송금 통화 / 금액 */}
      <div className={styles.field}>
        <label>송금 통화 / 금액</label>
        <div className={styles.amountRow}>
          <select
            className={styles.selectNative}
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
          <input
            type="text"
            inputMode="numeric"
            className={styles.input}
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
      </div>

      {/* 송금 일정 — '매일' 옵션은 백엔드 미지원으로 제거 */}
      <div className={styles.field}>
        <label>송금 일정</label>
        <select
          className={styles.selectNative}
          value={scheduleType}
          onChange={(e) => {
            setScheduleType(e.target.value as ScheduleType);
            setScheduleDay('');
          }}
        >
          <option value="">일정 선택</option>
          <option value="매주">매주</option>
          <option value="매월">매월</option>
        </select>
        {scheduleType === '매주' && (
          <div className={styles.subField}>
            <select
              className={styles.selectNative}
              value={scheduleDay}
              onChange={(e) => setScheduleDay(e.target.value)}
            >
              <option value="">요일 선택</option>
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {d}요일
                </option>
              ))}
            </select>
          </div>
        )}
        {scheduleType === '매월' && (
          <div className={styles.subField}>
            <select
              className={styles.selectNative}
              value={scheduleDay}
              onChange={(e) => setScheduleDay(e.target.value)}
            >
              <option value="">날짜 선택</option>
              {MONTH_DAYS.map((d) => (
                <option key={d} value={String(d)}>
                  {d}일
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 메모 (선택) */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="recurring-memo">
          메모
        </label>
        <input
          id="recurring-memo"
          type="text"
          className={styles.input}
          placeholder="메모 (선택, 최대 255자)"
          maxLength={255}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <div className={`${styles.card} ${styles.cardWarn}`}>
        <div className={styles.cardTitle}>정기 송금 안내</div>
        <div className={styles.cardText}>
          다음 실행 예정일은 등록 시 자동 계산됩니다. 송금일 전 알림이 발송되며, 잔액 부족 시 송금이
          실패할 수 있습니다.
        </div>
      </div>

      {submitError && (
        <div className={styles.errorText} role="alert">
          {submitError}
        </div>
      )}

      <div className={styles.primaryFixed}>
        <button
          type="button"
          className={styles.primary}
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? '설정 중...' : '정기 송금 설정하기'}
        </button>
      </div>
    </div>
  );
}
