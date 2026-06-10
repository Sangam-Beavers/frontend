import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { faqApi, type FaqResponse } from '@/api/admin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './AdminFaqsPage.module.css';

const CATEGORIES = ['GENERAL', 'TRANSFER', 'EXCHANGE', 'DOCUMENT', 'ACCOUNT'];

export default function AdminFaqsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: 'GENERAL',
    published: true,
    sortOrder: 0,
  });
  const [editing, setEditing] = useState<FaqResponse | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['admin', 'faqs'],
    queryFn: () => faqApi.listAll() as Promise<FaqResponse[]>,
  });

  const createMut = useMutation({
    mutationFn: () => faqApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'faqs'] });
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: (f: FaqResponse) => faqApi.update(f.publicId, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'faqs'] });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (publicId: string) => faqApi.delete(publicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'faqs'] }),
  });

  const resetForm = () => {
    setForm({ question: '', answer: '', category: 'GENERAL', published: true, sortOrder: 0 });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (f: FaqResponse) => {
    setEditing(f);
    setForm({
      question: f.question,
      answer: f.answer,
      category: f.category,
      published: f.published,
      sortOrder: f.sortOrder,
    });
    setShowForm(true);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)}>
          ‹
        </button>
        <span className={styles.title}>FAQ 관리</span>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => {
            setEditing(null);
            resetForm();
            setShowForm(true);
          }}
        >
          + 추가
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formTitle}>{editing ? 'FAQ 수정' : 'FAQ 등록'}</div>
          <select
            className={styles.select}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            placeholder="질문"
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
          />
          <textarea
            className={styles.textarea}
            placeholder="답변"
            rows={4}
            value={form.answer}
            onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
          />
          <div className={styles.checkRow}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              />{' '}
              게시
            </label>
            <label className={styles.checkLabel}>
              정렬{' '}
              <input
                type="number"
                className={styles.numInput}
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </label>
          </div>
          <div className={styles.btnRow}>
            <button type="button" className={styles.cancelBtn} onClick={resetForm}>
              취소
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={() => {
                if (!form.question.trim() || !form.answer.trim()) return;
                editing ? updateMut.mutate(editing) : createMut.mutate();
              }}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {editing ? '저장' : '등록'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className={styles.empty}>불러오는 중...</div>
      ) : faqs.length === 0 ? (
        <div className={styles.empty}>등록된 FAQ가 없습니다.</div>
      ) : (
        <div className={styles.list}>
          {faqs.map((f) => (
            <div key={f.publicId} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.catBadge}>{f.category}</span>
                <span className={f.published ? styles.pillOn : styles.pillOff}>
                  {f.published ? '게시중' : '초안'}
                </span>
              </div>
              <div className={styles.q}>{f.question}</div>
              <div className={styles.a}>{f.answer}</div>
              <div className={styles.cardActions}>
                <button type="button" className={styles.editBtn} onClick={() => startEdit(f)}>
                  수정
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => {
                    if (confirm('삭제하시겠습니까?')) deleteMut.mutate(f.publicId);
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
