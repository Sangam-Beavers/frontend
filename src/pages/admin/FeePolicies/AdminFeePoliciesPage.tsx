import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { feePolicyApi, type FeePolicyResponse } from '@/api/admin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './AdminFeePoliciesPage.module.css';

const SERVICE_LABEL: Record<string, string> = {
  EXCHANGE: '환전 수수료',
  CASHOUT: '외부 은행 출금 수수료',
};

export default function AdminFeePoliciesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editTarget, setEditTarget] = useState<FeePolicyResponse | null>(null);
  const [editForm, setEditForm] = useState({
    feeType: '',
    feeValue: '',
    minFee: '',
    maxFee: '',
    active: true,
  });

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['admin', 'fee-policies'],
    queryFn: () => feePolicyApi.listAll() as Promise<FeePolicyResponse[]>,
  });

  const updateMut = useMutation({
    mutationFn: (p: FeePolicyResponse) =>
      feePolicyApi.update(p.public_id, {
        fee_type: editForm.feeType || undefined,
        fee_value: editForm.feeValue || undefined,
        min_fee: editForm.minFee || undefined,
        max_fee: editForm.maxFee || undefined,
        active: editForm.active,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'fee-policies'] });
      setEditTarget(null);
    },
  });

  const startEdit = (p: FeePolicyResponse) => {
    setEditTarget(p);
    setEditForm({
      feeType: p.fee_type,
      feeValue: p.fee_value,
      minFee: p.min_fee ?? '',
      maxFee: p.max_fee ?? '',
      active: p.active,
    });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)}>
          ‹
        </button>
        <span className={styles.title}>수수료 정책</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={styles.notice}>
        앱내 송금(TRANSFER)은 <strong>무료 고정</strong>입니다.
      </div>

      {isLoading ? (
        <div className={styles.empty}>불러오는 중...</div>
      ) : policies.length === 0 ? (
        <div className={styles.empty}>등록된 수수료 정책이 없습니다.</div>
      ) : (
        <div className={styles.list}>
          {policies.map((p) => (
            <div key={p.public_id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.svcBadge}>
                  {SERVICE_LABEL[p.service_type] ?? p.service_type}
                </span>
                <span className={p.active ? styles.pillOn : styles.pillOff}>
                  {p.active ? '활성' : '비활성'}
                </span>
              </div>
              {editTarget?.public_id === p.public_id ? (
                <div className={styles.editArea}>
                  <div className={styles.row}>
                    <span className={styles.label}>타입</span>
                    <select
                      className={styles.select}
                      value={editForm.feeType}
                      onChange={(e) => setEditForm((f) => ({ ...f, feeType: e.target.value }))}
                    >
                      <option value="FIXED">고정(FIXED)</option>
                      <option value="PERCENT">비율(PERCENT)</option>
                    </select>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.label}>값</span>
                    <input
                      className={styles.input}
                      value={editForm.feeValue}
                      onChange={(e) => setEditForm((f) => ({ ...f, feeValue: e.target.value }))}
                    />
                  </div>
                  <div className={styles.row}>
                    <span className={styles.label}>최소 수수료</span>
                    <input
                      className={styles.input}
                      placeholder="(선택)"
                      value={editForm.minFee}
                      onChange={(e) => setEditForm((f) => ({ ...f, minFee: e.target.value }))}
                    />
                  </div>
                  <div className={styles.row}>
                    <span className={styles.label}>최대 수수료</span>
                    <input
                      className={styles.input}
                      placeholder="(선택)"
                      value={editForm.maxFee}
                      onChange={(e) => setEditForm((f) => ({ ...f, maxFee: e.target.value }))}
                    />
                  </div>
                  <label className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={editForm.active}
                      onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))}
                    />{' '}
                    활성
                  </label>
                  <div className={styles.btnRow}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => setEditTarget(null)}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className={styles.saveBtn}
                      onClick={() => updateMut.mutate(p)}
                      disabled={updateMut.isPending}
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.infoArea}>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>유형</span>
                    <span>{p.fee_type === 'FIXED' ? '고정' : '비율(%)'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>값</span>
                    <span>
                      {p.fee_value}
                      {p.fee_type === 'PERCENT' ? '%' : ` ${p.currency}`}
                    </span>
                  </div>
                  {p.min_fee && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>최소</span>
                      <span>
                        {p.min_fee} {p.currency}
                      </span>
                    </div>
                  )}
                  {p.max_fee && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>최대</span>
                      <span>
                        {p.max_fee} {p.currency}
                      </span>
                    </div>
                  )}
                  <div className={styles.cardActions}>
                    <button type="button" className={styles.editBtn} onClick={() => startEdit(p)}>
                      수정
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
