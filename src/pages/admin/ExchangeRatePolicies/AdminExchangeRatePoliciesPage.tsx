import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeRatePolicyApi, type ExchangeRatePolicyResponse } from '@/api/admin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './AdminExchangeRatePoliciesPage.module.css';

const EMPTY_CREATE = { currencyCode: '', spread: '', active: true };

export default function AdminExchangeRatePoliciesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editTarget, setEditTarget] = useState<ExchangeRatePolicyResponse | null>(null);
  const [editForm, setEditForm] = useState({ spread: '', active: true });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['admin', 'exchange-rate-policies'],
    queryFn: () => exchangeRatePolicyApi.listAll() as Promise<ExchangeRatePolicyResponse[]>,
  });

  const createMut = useMutation({
    mutationFn: () => exchangeRatePolicyApi.create(createForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'exchange-rate-policies'] });
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
    },
  });

  const updateMut = useMutation({
    mutationFn: (p: ExchangeRatePolicyResponse) =>
      exchangeRatePolicyApi.update(p.publicId, {
        spread: editForm.spread || undefined,
        active: editForm.active,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'exchange-rate-policies'] });
      setEditTarget(null);
    },
  });

  const startEdit = (p: ExchangeRatePolicyResponse) => {
    setEditTarget(p);
    setEditForm({ spread: p.spread, active: p.active });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)}>
          ‹
        </button>
        <span className={styles.title}>환율 정책</span>
        <button type="button" className={styles.addBtn} onClick={() => setShowCreate((v) => !v)}>
          +
        </button>
      </div>

      {showCreate && (
        <div className={styles.createBox}>
          <div className={styles.row}>
            <span className={styles.label}>통화 코드</span>
            <input
              className={styles.input}
              placeholder="예: PHP"
              value={createForm.currencyCode}
              onChange={(e) => setCreateForm((f) => ({ ...f, currencyCode: e.target.value }))}
            />
          </div>
          <div className={styles.row}>
            <span className={styles.label}>스프레드(%)</span>
            <input
              className={styles.input}
              placeholder="예: 1.50"
              value={createForm.spread}
              onChange={(e) => setCreateForm((f) => ({ ...f, spread: e.target.value }))}
            />
          </div>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={createForm.active}
              onChange={(e) => setCreateForm((f) => ({ ...f, active: e.target.checked }))}
            />{' '}
            활성
          </label>
          <div className={styles.btnRow}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowCreate(false)}>
              취소
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending}
            >
              등록
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className={styles.empty}>불러오는 중...</div>
      ) : policies.length === 0 ? (
        <div className={styles.empty}>등록된 환율 정책이 없습니다.</div>
      ) : (
        <div className={styles.list}>
          {policies.map((p) => (
            <div key={p.publicId} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.currBadge}>{p.currencyCode}</span>
                <span className={p.active ? styles.pillOn : styles.pillOff}>
                  {p.active ? '활성' : '비활성'}
                </span>
              </div>
              {editTarget?.publicId === p.publicId ? (
                <div className={styles.editArea}>
                  <div className={styles.row}>
                    <span className={styles.label}>스프레드(%)</span>
                    <input
                      className={styles.input}
                      value={editForm.spread}
                      onChange={(e) => setEditForm((f) => ({ ...f, spread: e.target.value }))}
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
                    <span className={styles.label}>스프레드</span>
                    <span>{p.spread}%</span>
                  </div>
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
