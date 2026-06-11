import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminMemberApi, type AppMemberResponse } from '@/api/admin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildAdminMemberDetailPath } from '@/constants/routes';
import styles from './AdminMembersPage.module.css';

export default function AdminMembersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'members', search],
    queryFn: () => adminMemberApi.search({ q: search || undefined, size: 50 }),
    retry: false,
  });

  const communityBanMut = useMutation({
    mutationFn: ({ user_public_id, banned }: { user_public_id: string; banned: boolean }) =>
      adminMemberApi.setCommunityBan(user_public_id, banned),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'members'] }),
  });

  const members: AppMemberResponse[] = data?.members ?? [];

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)}>
          ‹
        </button>
        <span className={styles.title}>회원 관리</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={styles.searchRow}>
        <input
          className={styles.searchInput}
          placeholder="이름 / 이메일 / 닉네임 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setSearch(q);
          }}
        />
        <button type="button" className={styles.searchBtn} onClick={() => setSearch(q)}>
          검색
        </button>
      </div>

      {isLoading ? (
        <div className={styles.empty}>불러오는 중...</div>
      ) : isError ? (
        <div className={styles.empty} style={{ color: '#e53e3e' }}>
          member-service에 연결할 수 없습니다.
          <br />
          서비스가 실행 중인지 확인해 주세요. (포트 8081)
        </div>
      ) : members.length === 0 ? (
        <div className={styles.empty}>회원이 없습니다.</div>
      ) : (
        <div className={styles.list}>
          {members.map((m) => (
            <div key={m.user_public_id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.nameRow}>
                  <span className={styles.name}>{m.name}</span>
                  <span className={styles.nickname}>@{m.nickname}</span>
                </div>
                <div className={styles.pillRow}>
                  {m.community_banned && <span className={styles.pillBanned}>커뮤니티제한</span>}
                </div>
              </div>

              <div className={styles.uid}>{m.user_public_id}</div>
              <div className={styles.info}>{m.email}</div>

              <div className={styles.infoRow}>
                <span className={styles.label}>국적</span>
                <span>{m.nationality}</span>
                <span className={styles.label} style={{ marginLeft: 12 }}>
                  KYC
                </span>
                <span className={styles.kycBadge} data-status={m.kyc_status}>
                  {m.kyc_status}
                </span>
              </div>

              <div className={styles.cardActions}>
                {m.community_banned ? (
                  <button
                    type="button"
                    className={styles.communityUnbanBtn}
                    disabled={communityBanMut.isPending}
                    onClick={() =>
                      communityBanMut.mutate({ user_public_id: m.user_public_id, banned: false })
                    }
                  >
                    커뮤니티 해제
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.communityBanBtn}
                    disabled={communityBanMut.isPending}
                    onClick={() =>
                      communityBanMut.mutate({ user_public_id: m.user_public_id, banned: true })
                    }
                  >
                    커뮤니티 제한
                  </button>
                )}

                <button
                  type="button"
                  className={styles.detailBtn}
                  onClick={() => navigate(buildAdminMemberDetailPath(m.user_public_id))}
                >
                  글/댓글 ›
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
