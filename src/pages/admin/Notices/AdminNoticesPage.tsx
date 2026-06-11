import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { noticeApi, type NoticeResponse } from '@/api/admin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './AdminNoticesPage.module.css';

export default function AdminNoticesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: '', content: '', pinned: false, published: true });
  const [editing, setEditing] = useState<NoticeResponse | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['admin', 'notices'],
    queryFn: () => noticeApi.listAll() as Promise<NoticeResponse[]>,
  });

  const createMut = useMutation({
    mutationFn: () => noticeApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'notices'] });
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: (n: NoticeResponse) =>
      noticeApi.update(n.public_id, {
        title: form.title,
        content: form.content,
        pinned: form.pinned,
        published: form.published,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'notices'] });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (public_id: string) => noticeApi.delete(public_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'notices'] }),
  });

  const resetForm = () => {
    setForm({ title: '', content: '', pinned: false, published: true });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (n: NoticeResponse) => {
    setEditing(n);
    setForm({ title: n.title, content: n.content, pinned: n.pinned, published: n.published });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editing) updateMut.mutate(editing);
    else createMut.mutate();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)}>
          ‹
        </button>
        <span className={styles.title}>공지사항 관리</span>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => {
            setEditing(null);
            setForm({ title: '', content: '', pinned: false, published: true });
            setShowForm(true);
          }}
        >
          + 추가
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formTitle}>{editing ? '공지 수정' : '공지 등록'}</div>
          <input
            className={styles.input}
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className={styles.textarea}
            placeholder="본문"
            rows={4}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          />
          <div className={styles.checkRow}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
              />{' '}
              상단 고정
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              />{' '}
              즉시 게시
            </label>
          </div>
          <div className={styles.btnRow}>
            <button type="button" className={styles.cancelBtn} onClick={resetForm}>
              취소
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {editing ? '저장' : '등록'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className={styles.empty}>불러오는 중...</div>
      ) : notices.length === 0 ? (
        <div className={styles.empty}>등록된 공지사항이 없습니다.</div>
      ) : (
        <div className={styles.list}>
          {notices.map((n) => (
            <div key={n.public_id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>
                  {n.pinned ? '📌 ' : ''}
                  {n.title}
                </span>
                <span className={n.published ? styles.pillOn : styles.pillOff}>
                  {n.published ? '게시중' : '초안'}
                </span>
              </div>
              <div className={styles.cardContent}>{n.content}</div>
              <div className={styles.cardActions}>
                <button type="button" className={styles.editBtn} onClick={() => startEdit(n)}>
                  수정
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => {
                    if (confirm('삭제하시겠습니까?')) deleteMut.mutate(n.public_id);
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
