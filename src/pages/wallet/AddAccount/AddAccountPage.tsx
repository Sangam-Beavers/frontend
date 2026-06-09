import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { useSupportedBanks } from '@/hooks/useSupportedBanks';
import { useAccountHolder } from '@/hooks/useAccountHolder';
import { accountErrorMessage } from '@/utils/accountErrorMessage';
import type { SupportedBank } from '@/api/wallet';
import type { AccountRegisterDraft } from '@/types/charge';
import styles from './AddAccountPage.module.css';

const COUNTRY_LABEL: Record<string, string> = {
  KR: '🇰🇷 한국',
  US: '🇺🇸 미국',
  VN: '🇻🇳 베트남',
  PH: '🇵🇭 필리핀',
};

function countryLabel(code: string): string {
  return COUNTRY_LABEL[code] ?? code;
}

/** 은행 목록을 국가별로 그룹핑. 백엔드가 country ASC → name ASC 정렬해서 오므로 순서 유지. */
function groupByCountry(banks: SupportedBank[]): Map<string, SupportedBank[]> {
  const map = new Map<string, SupportedBank[]>();
  for (const bank of banks) {
    const group = map.get(bank.country) ?? [];
    group.push(bank);
    map.set(bank.country, group);
  }
  return map;
}

export default function AddAccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: bankData, isLoading: banksLoading, error: banksError } = useSupportedBanks();
  const banks = bankData?.banks ?? [];

  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  // 기본 선택: 사용자가 고르기 전엔 첫 은행(백엔드가 country→name 순 정렬).
  const selectedBankCode = bankCode || banks[0]?.bank_code || '';
  // 200 + 빈 배열 — 에러가 아니라 "지원 은행이 아직 없음"(DB 미등록 등) 정상 케이스.
  const banksEmpty = !banksLoading && !banksError && banks.length === 0;

  const bankGroups = useMemo(() => groupByCountry(banks), [banks]);

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
      <TopBar title={t('charge.addAccount.title')} />

      <div className={styles.field}>
        <label htmlFor="bank-name">{t('charge.addAccount.bankLabel')}</label>
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
          {banksLoading && <option value="">{t('charge.addAccount.banksLoading')}</option>}
          {banksError && <option value="">{t('charge.addAccount.banksError')}</option>}
          {banksEmpty && <option value="">{t('charge.addAccount.banksEmpty')}</option>}
          {[...bankGroups.entries()].map(([country, groupBanks]) => (
            <optgroup key={country} label={countryLabel(country)}>
              {groupBanks.map((bank) => (
                <option key={bank.bank_code} value={bank.bank_code}>
                  {bank.bank_name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="account-number">{t('charge.addAccount.accountNumberLabel')}</label>
        <input
          id="account-number"
          type="text"
          inputMode="numeric"
          className={styles.input}
          placeholder={t('charge.addAccount.accountNumberPlaceholder')}
          value={accountNumber}
          onChange={(event) => {
            setAccountNumber(event.target.value.replace(/[^0-9]/g, ''));
            resetHolder();
          }}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="account-holder-lookup">{t('charge.addAccount.holderLabel')}</label>
        <div className={styles.holderRow}>
          <div className={styles.holderName}>
            {verifiedName || (
              <span className={styles.holderPlaceholder}>
                {t('charge.addAccount.holderNotYet')}
              </span>
            )}
          </div>
          <button
            id="account-holder-lookup"
            type="button"
            className={styles.verifyBtn}
            disabled={!canLookup}
            onClick={handleLookup}
          >
            {holder.isPending
              ? t('charge.addAccount.lookupLoading')
              : t('charge.addAccount.lookupCta')}
          </button>
        </div>
        {holder.error && (
          <div className={styles.holderError}>{accountErrorMessage(holder.error)}</div>
        )}
        {verifiedName && (
          <div className={styles.holderOk}>{t('charge.addAccount.holderConfirmed')}</div>
        )}
      </div>

      <div className={`${styles.card} ${styles.cardWarn}`}>
        <div className={styles.cardTitle}>{t('charge.addAccount.autoDebitTitle')}</div>
        <div className={styles.cardText}>{t('charge.addAccount.autoDebitText')}</div>
      </div>

      <div className={styles.primaryFixed}>
        <button type="button" className={styles.primary} disabled={!canSubmit} onClick={handleNext}>
          {t('charge.addAccount.next')}
        </button>
      </div>
    </>
  );
}
