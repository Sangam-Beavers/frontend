import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { useSupportedBanks } from '@/hooks/useSupportedBanks';
import { useAccountHolder } from '@/hooks/useAccountHolder';
import { accountErrorMessage } from '@/utils/accountErrorMessage';
import type { AccountRegisterDraft } from '@/types/charge';
import styles from './AddAccountPage.module.css';

export default function AddAccountPage() {
  const navigate = useNavigate();
  const { data: bankData, isLoading: banksLoading, error: banksError } = useSupportedBanks();
  const banks = bankData?.banks ?? [];

  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  // 기본 선택: 사용자가 고르기 전엔 첫 은행(백엔드가 가나다순 정렬).
  const selectedBankCode = bankCode || banks[0]?.bank_code || '';
  // 200 + 빈 배열 — 에러가 아니라 "지원 은행이 아직 없음"(DB 미등록 등) 정상 케이스.
  const banksEmpty = !banksLoading && !banksError && banks.length === 0;

  const holder = useAccountHolder();
  // 조회 응답이 "현재 입력값"과 일치할 때만 확인된 것으로 본다.
  // (조회 도중 은행/계좌를 바꿔 응답이 엉뚱한 계좌에 붙는 레이스 방지 — variables 비교)
  const v = holder.variables;
  const verifiedName =
    holder.data && v && v.bankCode === selectedBankCode && v.accountNumber === accountNumber
      ? holder.data.account_holder_name
      : '';
  const canLookup = selectedBankCode !== '' && accountNumber !== '' && !holder.isPending;
  const canSubmit = verifiedName !== '';
  const selectedBank = banks.find((b) => b.bank_code === selectedBankCode);

  // 확인한 입력값을 다음 화면들로 전달(AutoDebitAuth → AccountRegistered).
  // canSubmit일 때만 호출되므로 selectedBank/verifiedName은 채워져 있다.
  const handleNext = () => {
    const draft: AccountRegisterDraft = {
      bankCode: selectedBankCode,
      bankName: selectedBank?.bank_name ?? '',
      accountNumber,
      holderName: verifiedName,
    };
    navigate('/charge/auto-debit', { state: draft });
  };

  // 입력이 바뀌면 직전 조회 결과는 무효 → 초기화(다음 버튼도 다시 비활성).
  const resetHolder = () => {
    if (holder.data || holder.error) holder.reset();
  };

  const handleLookup = () => {
    if (!canLookup) return;
    holder.mutate({ bankCode: selectedBankCode, accountNumber });
  };

  return (
    <>
      <TopBar title="계좌 추가" />

      <div className={styles.field}>
        <label htmlFor="bank-name">은행명</label>
        <select
          id="bank-name"
          className={styles.select}
          value={selectedBankCode}
          disabled={banksLoading || !!banksError || banksEmpty}
          onChange={(e) => {
            setBankCode(e.target.value);
            resetHolder();
          }}
        >
          {banksLoading && <option value="">은행 목록을 불러오는 중…</option>}
          {banksError && <option value="">은행 목록을 불러오지 못했어요</option>}
          {banksEmpty && <option value="">지원하는 은행이 없어요</option>}
          {banks.map((bank) => (
            <option key={bank.bank_code} value={bank.bank_code}>
              {bank.bank_name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="account-number">계좌번호</label>
        <input
          id="account-number"
          type="text"
          inputMode="numeric"
          className={styles.input}
          placeholder="- 없이 숫자만 입력"
          value={accountNumber}
          onChange={(event) => {
            setAccountNumber(event.target.value.replace(/[^0-9]/g, ''));
            resetHolder();
          }}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="account-holder-lookup">예금주</label>
        <div className={styles.holderRow}>
          <div className={styles.holderName}>
            {verifiedName || <span className={styles.holderPlaceholder}>조회 전</span>}
          </div>
          <button
            id="account-holder-lookup"
            type="button"
            className={styles.verifyBtn}
            disabled={!canLookup}
            onClick={handleLookup}
          >
            {holder.isPending ? '조회 중…' : '예금주 조회'}
          </button>
        </div>
        {holder.error && (
          <div className={styles.holderError}>{accountErrorMessage(holder.error)}</div>
        )}
        {verifiedName && <div className={styles.holderOk}>✓ 예금주가 확인됐어요.</div>}
      </div>

      <div className={`${styles.card} ${styles.cardWarn}`}>
        <div className={styles.cardTitle}>자동이체 인증 필요</div>
        <div className={styles.cardText}>계좌 연결을 위해 자동이체 인증 화면으로 이동합니다.</div>
      </div>

      <div className={styles.primaryFixed}>
        <button type="button" className={styles.primary} disabled={!canSubmit} onClick={handleNext}>
          다음
        </button>
      </div>
    </>
  );
}
