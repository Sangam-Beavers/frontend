import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { buildCommunityPostPath } from '@/constants/routes';
import { useCreatePost } from '@/hooks/useCreatePost';
import { usePostDetail } from '@/hooks/usePostDetail';
import { useUpdatePost } from '@/hooks/useUpdatePost';
import { communityErrorMessage } from '@/utils/communityErrorMessage';
import styles from './CommunityWritePage.module.css';

// 백엔드 PostCreateRequest.category enum(value) ↔ 표시 라벨. API는 category 하나만 받는다(세부 카테고리 없음).
// FREE(자유게시판)는 백엔드 create enum 추가 작업 중 — 추가되면 작성 동작.
const CATEGORIES = [
  { value: 'RESIDENCE', label: '거주' },
  { value: 'LIFE_INFO', label: '생활' },
  { value: 'JOB', label: '취업' },
  { value: 'VISA', label: '비자' },
  { value: 'COUNTRY', label: '국가별 정보' },
  { value: 'QUESTION', label: '질문' },
  { value: 'FREE', label: '자유게시판' },
] as const;

export default function CommunityWritePage() {
  const navigate = useNavigate();
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
      <TopBar title={isEdit ? '글 수정' : '글쓰기'} onBack={() => navigate(-1)} />

      <div className={styles.field}>
        <label htmlFor="write-category">카테고리</label>
        <select
          id="write-category"
          className={styles.select}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="" disabled>
            카테고리를 선택하세요
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="write-title">제목</label>
        <input
          id="write-title"
          type="text"
          className={styles.input}
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="write-body">본문</label>
        <textarea
          id="write-body"
          className={styles.textarea}
          placeholder="내용을 입력하세요"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>

      <div className={styles.toggleRow}>
        <span>자동 번역 허용</span>
        <button
          type="button"
          aria-pressed={allowAutoTranslate}
          aria-label="자동 번역 허용"
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
              ? '수정 중…'
              : '작성 중…'
            : isEdit
              ? '수정 완료'
              : '작성 완료'}
        </button>
      </div>
    </>
  );
}
