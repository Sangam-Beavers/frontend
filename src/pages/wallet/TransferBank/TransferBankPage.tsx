import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { useMyAccounts } from '@/hooks/useMyAccounts';
import { useRecentRemittanceAccounts } from '@/hooks/useRecentRemittanceAccounts';
import type { AccountItem, RecentRemittanceAccountItem } from '@/api/wallet';
import styles from './TransferBankPage.module.css';

// 사용자가 선택한 계좌 — 출처에 따라 라벨/정보가 다르다.
// 'my'   : 본인이 등록한 계좌 (등록된 내 계좌 섹션). 송금 시 recipientName='내 계좌'.
// 'recent': 과거 송금했던 타인 계좌 (최근 송금한 계좌 섹션). 송금 시 recipientName=수취인명.
type Picked =
  | { kind: 'my'; account: AccountItem }
  | { kind: 'recent'; account: RecentRemittanceAccountItem };

// 최근 송금 계좌 한 줄에 고유 key — bank_code + 마스킹 계좌번호 조합. 응답에 id가 없어 합성.
function recentKey(acc: RecentRemittanceAccountItem): string {
  return `${acc.bank_code}::${acc.account_number}`;
}

/**
 * '최근 송금한 계좌'를 본인 등록 계좌(`useMyAccounts`)와 매칭해 UUID를 얻는다.
 *
 * <p>백엔드 `RecentRemittanceAccountItem`은 송금 이력에서 합성한 표시용 정보라 `account_public_id`가
 * 없다. 그러나 REMITTANCE 실행에는 `bank_account_public_id`가 필수이므로, 본인 등록 계좌 중 동일
 * 계좌를 찾아 그 UUID를 사용한다.
 *
 * <p>매칭 키: (`bank_code`, `account_number_masked`) — 양쪽 모두 "앞 3 + 별표 + 끝 2" 동일 형식이라
 * 문자열 전체 비교로 충분. 다음 사이클에서 백엔드가 응답에 `account_public_id`를 직접 포함하면
 * 이 로직은 제거 가능.
 *
 * @returns 매칭된 본인 계좌 또는 null(삭제됐거나 다른 사용자 계좌)
 */
function findMyAccountForRecent(
  recent: RecentRemittanceAccountItem,
  myAccounts: AccountItem[]
): AccountItem | null {
  return (
    myAccounts.find(
      (my) =>
        my.bank_code === recent.bank_code && my.account_number_masked === recent.account_number
    ) ?? null
  );
}

export default function TransferBankPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useMyAccounts();
  const accounts = data?.accounts ?? [];

  const {
    data: recentData,
    isLoading: recentLoading,
    error: recentError,
    refetch: refetchRecent,
  } = useRecentRemittanceAccounts();
  // 지갑 없음(WALLET4001)이면 섹션 자체를 숨긴다 — 신규/미생성 사용자가 자연스럽게.
  // 그 외 에러는 카드 안에 메시지 + 재시도 노출(#120 패턴).
  const recentHidden = recentError instanceof ApiException && recentError.code === 'WALLET4001';
  const recentAccounts = recentData?.accounts ?? [];

  // 사용자가 직접 고르기 전엔 주 계좌를 기본 선택(없으면 첫 계좌). 백엔드가 주 계좌 우선 정렬.
  const [picked, setPicked] = useState<Picked | null>(null);
  const defaultMy = accounts.find((a) => a.is_primary) ?? accounts[0] ?? null;
  const selected: Picked | null = picked ?? (defaultMy ? { kind: 'my', account: defaultMy } : null);

  const [amount, setAmount] = useState('');
  const num = Number(amount) || 0;
  // 송금 가능 조건: 'my' 계좌 선택 + 금액 > 0. 'recent' 매칭 실패 상태는 송금 막음.
  const canSubmit = selected !== null && selected.kind === 'my' && num > 0;

  /** 'recent' 클릭 — 본인 등록 계좌와 매칭해 'my' 선택으로 정규화. 매칭 실패 시 안내. */
  const [recentMatchError, setRecentMatchError] = useState<string | null>(null);
  function handleRecentClick(acc: RecentRemittanceAccountItem) {
    setRecentMatchError(null);
    const matched = findMyAccountForRecent(acc, accounts);
    if (matched) {
      // 매칭 성공 → 'my' 선택으로 통일 (UUID 확보, 송금 실행 가능)
      setPicked({ kind: 'my', account: matched });
    } else {
      // 매칭 실패 — 등록된 적 없거나 삭제된 계좌. 'recent'에 picked 그대로 두되 송금은 막힘.
      setPicked({ kind: 'recent', account: acc });
      setRecentMatchError(
        '이 계좌는 현재 등록된 내 계좌 목록에 없습니다. 등록 후 다시 시도해주세요.'
      );
    }
  }

  function buildConfirmState() {
    if (!selected) return null;
    if (selected.kind === 'my') {
      const a = selected.account;
      const amountDecimal = num.toFixed(4);
      return {
        // 표시용
        recipientName: '내 계좌',
        recipientInitial: a.bank_name?.[0] ?? '',
        recipientMeta: `${a.bank_name} ${a.account_number_masked}`,
        recipientKind: 'account' as const,
        currency: 'KRW',
        amount: num.toLocaleString(),
        // 송금 실행 body 조립용 (REMITTANCE)
        transferType: 'REMITTANCE' as const,
        bankAccountPublicId: a.account_public_id,
        amountDecimal,
        memo: null,
      };
    }
    // 'recent' kind는 사실상 도달하지 않음(handleRecentClick이 매칭 성공 시 'my'로 정규화).
    // 매칭 실패로 그대로 남아있다면 송금 실행 불가 — buildConfirmState 호출 자체가 막혀야 한다.
    return null;
  }

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="타행 송금" onBack={() => navigate('/transfer')} />

        {/* ─── 최근 송금한 계좌 (신규 #140) ─── */}
        {!recentHidden && (
          <>
            <div className={styles.section}>최근 송금한 계좌</div>
            <div className={styles.list}>
              {recentLoading && (
                <div className={styles.item}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemMeta}>불러오는 중…</div>
                  </div>
                </div>
              )}
              {!recentLoading && recentError && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyText}>최근 송금 계좌를 불러오지 못했어요.</div>
                  <button
                    type="button"
                    className={styles.registerBtn}
                    onClick={() => refetchRecent()}
                  >
                    다시 시도
                  </button>
                </div>
              )}
              {!recentLoading && !recentError && recentAccounts.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyText}>최근 송금한 계좌가 없어요.</div>
                </div>
              )}
              {!recentLoading &&
                !recentError &&
                recentAccounts.map((acc) => {
                  const isSelected =
                    selected?.kind === 'recent' && recentKey(selected.account) === recentKey(acc);
                  return (
                    <div
                      key={recentKey(acc)}
                      className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                      onClick={() => handleRecentClick(acc)}
                    >
                      <div className={styles.itemMain}>
                        <div className={styles.itemTitle}>
                          {acc.account_holder} · {acc.bank_name}
                        </div>
                        <div className={styles.itemMeta}>
                          {acc.account_number} · {acc.currency_code}
                        </div>
                      </div>
                      {isSelected && <span className={styles.checkMark}>✓</span>}
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {/* ─── 등록된 내 계좌 (기존 흐름) ─── */}
        <div className={styles.section}>등록된 내 계좌</div>

        <div className={styles.list}>
          {isLoading && (
            <div className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemMeta}>계좌를 불러오는 중…</div>
              </div>
            </div>
          )}
          {error && (
            <div className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemMeta}>계좌를 불러오지 못했어요.</div>
              </div>
            </div>
          )}
          {!isLoading && !error && accounts.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyText}>등록된 계좌가 없어요.</div>
              <button
                type="button"
                className={styles.registerBtn}
                onClick={() => navigate('/charge/add-account')}
              >
                계좌 등록하기
              </button>
            </div>
          )}
          {accounts.map((acc) => {
            const isSelected =
              selected?.kind === 'my' &&
              selected.account.account_public_id === acc.account_public_id;
            return (
              <div
                key={acc.account_public_id}
                className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                onClick={() => setPicked({ kind: 'my', account: acc })}
              >
                <div className={styles.itemMain}>
                  <div className={styles.itemTitle}>{acc.bank_name}</div>
                  <div className={styles.itemMeta}>
                    {acc.account_number_masked}
                    {acc.is_primary ? ' · 주 계좌' : ''}
                  </div>
                </div>
                {isSelected && <span className={styles.checkMark}>✓</span>}
              </div>
            );
          })}
          {accounts.length > 0 && (
            <button
              type="button"
              className={styles.addItem}
              onClick={() => navigate('/charge/add-account')}
            >
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>계좌 추가</div>
                <div className={styles.itemMeta}>내 계좌를 새로 등록합니다</div>
              </div>
              <span className={styles.addIcon}>＋</span>
            </button>
          )}
        </div>

        {recentMatchError && (
          <div className={styles.emptyState} role="alert">
            <div className={styles.emptyText}>{recentMatchError}</div>
            <button
              type="button"
              className={styles.registerBtn}
              onClick={() => navigate('/charge/add-account')}
            >
              계좌 등록하기
            </button>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-amount">
            송금할 금액
          </label>
          <input
            id="transfer-amount"
            type="text"
            inputMode="numeric"
            className={styles.input}
            placeholder="0"
            disabled={selected === null || selected.kind === 'recent'}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
      </div>

      <div className={styles.fixedBtn}>
        <button
          className={styles.primaryBtn}
          disabled={!canSubmit}
          onClick={() => {
            const state = buildConfirmState();
            if (!state) return;
            navigate('/transfer/confirm', { state });
          }}
        >
          다음
        </button>
      </div>
    </>
  );
}
