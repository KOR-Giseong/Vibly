import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronRight, MessageCircle, Heart, Eye, PenSquare, Megaphone } from 'lucide-react-native';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow,
} from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';
import { communityApi, noticesApi } from '@services/community.service';
import type { Post, PostCategory, Notice } from '@/types';
import { POST_CATEGORY_LABEL } from '@/types';
import { useAuthStore } from '@stores/auth.store';
import { formatRelativeTime } from '@utils/format';

// ─── 카테고리 탭 ─────────────────────────────────────────────────────────────

const CATEGORIES: { label: string; value: PostCategory | null }[] = [
  { label: '전체', value: null },
  { label: '자유게시판', value: 'FREE' },
  { label: '정보공유', value: 'INFO' },
  { label: '질문/도움', value: 'QUESTION' },
  { label: '장소후기', value: 'REVIEW' },
];

// ─── 공지사항 아이템 ──────────────────────────────────────────────────────────

function NoticeItem({ notice, onPress }: { notice: Notice; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.noticeItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.noticeBadge}>
        <Text style={styles.noticeBadgeText}>{notice.isPinned ? '📌 공지' : '공지'}</Text>
      </View>
      <Text style={styles.noticeTitle} numberOfLines={1}>{notice.title}</Text>
      <Text style={styles.noticeDate}>
        {new Date(notice.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
      </Text>
    </TouchableOpacity>
  );
}

// ─── 게시글 카드 ──────────────────────────────────────────────────────────────

function PostCard({ post, onPress }: { post: Post; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.85}>
      {post.isPinned && (
        <View style={styles.pinnedBadge}>
          <Text style={styles.pinnedText}>📌 고정</Text>
        </View>
      )}
      <View style={styles.postMeta}>
        <View style={[styles.categoryChip, { backgroundColor: getCategoryColor(post.category) + '20' }]}>
          <Text style={[styles.categoryText, { color: getCategoryColor(post.category) }]}>
            {POST_CATEGORY_LABEL[post.category]}
          </Text>
        </View>
        <Text style={styles.postDate}>{formatRelativeTime(post.createdAt)}</Text>
      </View>

      <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>

      <View style={styles.postFooter}>
        <Text style={styles.postAuthor} numberOfLines={1}>
          {post.user.nickname ?? post.user.name}
        </Text>
        <View style={styles.postStats}>
          <View style={styles.statRow}>
            <Eye size={12} color={Colors.gray[400]} />
            <Text style={styles.statText}>{post.viewCount}</Text>
          </View>
          <View style={styles.statRow}>
            <Heart size={12} color={Colors.gray[400]} />
            <Text style={styles.statText}>{post.likeCount}</Text>
          </View>
          <View style={styles.statRow}>
            <MessageCircle size={12} color={Colors.gray[400]} />
            <Text style={styles.statText}>{post.commentCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getCategoryColor(category: PostCategory): string {
  switch (category) {
    case 'FREE':      return Colors.primary[600];
    case 'INFO':      return '#059669';
    case 'QUESTION':  return '#D97706';
    case 'REVIEW':    return '#DB2777';
    default:          return Colors.primary[600];
  }
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

export default function CommunityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [selectedCategory, setSelectedCategory] = useState<PostCategory | null>(null);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // 공지사항 (최신 3개만)
  const { data: noticesData } = useQuery({
    queryKey: ['notices', 1, 3],
    queryFn: () => noticesApi.getNotices({ page: 1, limit: 3 }),
    staleTime: 1000 * 60 * 5,
  });

  // 게시글 목록
  const {
    data: postsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['posts', selectedCategory, page],
    queryFn: () => communityApi.getPosts({ category: selectedCategory ?? undefined, page, limit: 20 }),
    staleTime: 1000 * 30,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const pinnedNotices = noticesData?.items.filter((n) => n.isPinned) ?? [];
  const normalNotices = noticesData?.items.filter((n) => !n.isPinned) ?? [];
  const notices = [...pinnedNotices, ...normalNotices];

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={styles.flex}>
        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Text style={styles.headerTitle}>커뮤니티</Text>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.bellBtn}>
            <Bell size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={postsData?.items ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[600]} />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* 공지사항 섹션 - 항상 표시 */}
              <View style={styles.noticeSection}>
                <TouchableOpacity
                  style={styles.noticeSectionHeader}
                  onPress={() => router.push('/community/notices')}
                  activeOpacity={0.7}
                >
                  <View style={styles.noticeTitleRow}>
                    <Megaphone size={16} color={Colors.primary[600]} />
                    <Text style={styles.sectionTitle}>공지사항</Text>
                  </View>
                  <View style={styles.moreRow}>
                    <Text style={styles.moreText}>더보기</Text>
                    <ChevronRight size={14} color={Colors.gray[400]} />
                  </View>
                </TouchableOpacity>
                {notices.length > 0 ? (
                  notices.map((n) => (
                    <NoticeItem
                      key={n.id}
                      notice={n}
                      onPress={() => router.push({ pathname: '/community/notice/[id]', params: { id: n.id } })}
                    />
                  ))
                ) : (
                  <View style={styles.noticeEmpty}>
                    <Text style={styles.noticeEmptyText}>등록된 공지사항이 없습니다.</Text>
                  </View>
                )}
              </View>

              {/* 카테고리 필터 */}
              <View style={styles.categorySection}>
                <FlatList
                  data={CATEGORIES}
                  horizontal
                  keyExtractor={(item) => item.label}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryList}
                  renderItem={({ item }) => {
                    const selected = selectedCategory === item.value;
                    return (
                      <TouchableOpacity
                        style={[styles.categoryBtn, selected && styles.categoryBtnActive]}
                        onPress={() => { setSelectedCategory(item.value); setPage(1); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.categoryLabel, selected && styles.categoryLabelActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => router.push({ pathname: '/community/[id]', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator style={styles.loader} color={Colors.primary[600]} />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>아직 게시글이 없어요</Text>
                <Text style={styles.emptyDesc}>첫 번째 글을 남겨보세요!</Text>
              </View>
            )
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />

        {/* 글쓰기 FAB */}
        {user && (
          <TouchableOpacity
            style={[styles.fab, { bottom: insets.bottom + 80 }]}
            onPress={() => router.push('/community/write')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={Gradients.primary} style={styles.fabGradient}>
              <PenSquare size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </ScreenTransition>
  );
}

// ─── 스타일 ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },

  // 공지사항
  noticeSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  noticeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  noticeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[900],
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreText: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
  },
  noticeEmpty: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  noticeEmptyText: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[50],
    gap: Spacing.sm,
  },
  noticeBadge: {
    backgroundColor: Colors.primary[600] + '15',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  noticeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.primary[600],
  },
  noticeTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.gray[800],
  },
  noticeDate: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
  },

  // 카테고리
  categorySection: {
    marginBottom: Spacing.sm,
  },
  categoryList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  categoryLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray[600],
  },
  categoryLabelActive: {
    color: Colors.white,
  },

  // 게시글 카드
  postCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  pinnedBadge: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  pinnedText: {
    fontSize: FontSize.xs,
    color: Colors.primary[600],
    fontWeight: FontWeight.medium,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  categoryChip: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  postDate: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
  },
  postTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[900],
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postAuthor: {
    fontSize: FontSize.xs,
    color: Colors.gray[500],
    flex: 1,
  },
  postStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
  },

  // 로더 / 빈 상태
  loader: {
    marginTop: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[700],
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: Colors.gray[400],
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    borderRadius: BorderRadius.full,
    ...Shadow.lg,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
