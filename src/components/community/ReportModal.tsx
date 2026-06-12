import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReportReason, ReportRequest } from '@/api/community';
import styles from './ReportModal.module.css';

const REPORT_REASONS: ReportReason[] = ['SPAM', 'ABUSE', 'FRAUD', 'SEXUAL', 'ETC'];

export interface ReportModalProps {
  /** 제출 시 호출 — body를 받아 mutation을 실행하는 책임은 부모에게 있다. */
  onSubmit: (body: ReportRequest) => void;
  onCancel: () => void;
  isPending: boolean;
  /** 이미 resolve된 에러 메시지 문자열. 없으면 null. */
  error?: string | null;
}

export default function ReportModal({ onSubmit, onCancel, isPending, error }: ReportModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');

  const handleSubmit = () => {
    if (!reason || isPending) return;
    onSubmit({ reason, detail: detail.trim() || undefined });
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{t('community.report.title')}</h3>

        <div className={styles.reasons}>
          {REPORT_REASONS.map((r) => (
            <label key={r} className={styles.reasonLabel}>
              <input
                type="radio"
                name="report-reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className={styles.radio}
              />
              <span>{t(`community.report.reason.${r}`)}</span>
            </label>
          ))}
        </div>

        <textarea
          className={styles.detail}
          placeholder={t('community.report.detailPlaceholder')}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={500}
          rows={3}
        />

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.btnRow}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={isPending}
          >
            {t('community.report.cancel')}
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={!reason || isPending}
          >
            {isPending ? t('community.report.submitting') : t('community.report.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
