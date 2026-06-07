import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/navigation/TopBar';
import { buildCommunityPostPath } from '@/constants/routes';
import { useCreatePost } from '@/hooks/useCreatePost';
import { usePostDetail } from '@/hooks/usePostDetail';
import { useUpdatePost } from '@/hooks/useUpdatePost';
import { communityErrorMessage } from '@/utils/communityErrorMessage';
import styles from './CommunityWritePage.module.css';

// 백엔드 PostCreateRequest.category enum(value)
// FREE(자유게시판)는 백엔드 create enum 추가 작업 중 — 추가되면 작성 동작.
const CATEGORY_VALUES = [
  'RESIDENCE',
  'LIFE_INFO',
  'JOB',
  'VISA',
  'COUNTRY',
  'QUESTION',
  'FREE',
] as const;

export default function CommunityWritePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // 편집 모드: /community/posts/:postId/edit 로 진입 시 postId가 있음.
  const { postId } = useParams<{ postId: string }>();
  const isEdit = Boolean(postId);

  // 기본 선택 없음('') — 사용자가 반드시 카테고리를 직접 골라야 한다.
  const [category, setCategory] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [allowAutoTranslate, setAllowAutoTranslate] = useState<boolean>(false);

  // 편집 모드에서 기존 글을 한 번만 폼에 채운다(이후 사용자가 수정해도 덮어쓰지 않음).
  const { data: existingPost } = usePostDetail(isEdit ? (postId as string) : '');
  const hydrated = useRef(false);
  useEffect(() => {
    if (existingPost && !hydrated.current) {
      hydrated.current = true;
      setCategory(existingPost.category);
      setTitle(existingPost.title);
      setBody(existingPost.content);
    }
  }, [existingPost]);

  const create = useCreatePost();
  const update = useUpdatePost();
  const mutation = isEdit ? update : create;
  const canSubmit =
    category !== '' && title.trim() !== '' && body.trim() !== '' && !mutation.isPending;
  const errorMessage = mutation.error ? communityErrorMessage(mutation.error) : '';

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = { category, title: title.trim(), content: body.trim() };
    if (isEdit) {
      update.mutate(
        { postId: postId as string, body: payload },
        { onSuccess: () => navigate(buildCommunityPostPath(postId as string)) }
      );
    } else {
      create.mutate(payload, {
        // 작성 성공 → 생성된 게시글 상세로 이동.
        onSuccess: (post) => navigate(buildCommunityPostPath(post.public_id)),
      });
    }
  };

  return (
    <>
      <TopBar
        title={isEdit ? t('community.writePage.editTitle') : t('community.writePage.title')}
        onBack={() => navigate(-1)}
      />

      <div className={styles.field}>
        <label htmlFor="write-category">{t('community.writePage.categoryLabel')}</label>
        <select
          id="write-category"
          className={styles.select}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="" disabled>
            {t('community.writePage.categoryPlaceholder')}
          </option>
          {CATEGORY_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`community.writePage.cats.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="write-title">{t('community.writePage.titleLabel')}</label>
        <input
          id="write-title"
          type="text"
          className={styles.input}
          placeholder={t('community.writePage.titlePlaceholder')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="write-body">{t('community.writePage.bodyLabel')}</label>
        <textarea
          id="write-body"
          className={styles.textarea}
          placeholder={t('community.writePage.bodyPlaceholder')}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>

      <div className={styles.toggleRow}>
        <span>{t('community.writePage.autoTranslate')}</span>
        <button
          type="button"
          aria-pressed={allowAutoTranslate}
          aria-label={t('community.writePage.autoTranslate')}
          className={`${styles.checkbox} ${allowAutoTranslate ? styles.checkboxChecked : ''}`}
          onClick={() => setAllowAutoTranslate((prev) => !prev)}
        >
          {allowAutoTranslate ? '✓' : ''}
        </button>
      </div>

      {errorMessage && <div className={styles.errorText}>{errorMessage}</div>}

      <div className={styles.primaryFixed}>
        <button
          type="button"
          className={styles.primary}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {mutation.isPending
            ? isEdit
              ? t('community.writePage.editing')
              : t('community.writePage.submitting')
            : isEdit
              ? t('community.writePage.editSubmit')
              : t('community.writePage.submit')}
        </button>
      </div>
    </>
  );
}
