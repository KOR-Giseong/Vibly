import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, Heart } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { placeService } from '@services/place.service';
import ScreenTransition from '@components/ScreenTransition';
import type { PlaceReview } from '@/types';

function anonymizeName(name: string): string {
  if (name.length <= 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

function ReviewItem({ review, placeId }: { review: PlaceReview; placeId: string }) {
  const [liked, setLiked] = useState(review.isLiked);
  const [likesCount, setLikesCount] = useState(review.likesCount);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));
    try {
      if (next) {
        const res = await placeService.likeReview(placeId, review.id);
        setLikesCount(res.likesCount);
      } else {
        const res = await placeService.unlikeReview(placeId, review.id);
        setLikesCount(res.likesCount);
      }
    } catch {
      // 실패 시 롤백
      setLiked(!next);
      setLikesCount((c) => c + (next ? -1 : 1));
    }
  };

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewItemHeader}>
        <Text style={styles.reviewAuthor}>{anonymizeName(review.user.name)}</Text>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={13}
              color="#FACC15"
              fill={n <= review.rating ? '#FACC15' : 'transparent'}
            />
          ))}
        </View>
      </View>
      <Text style={styles.reviewBody}>{review.body}</Text>
      <View style={styles.reviewFooter}>
        <Text style={styles.reviewDate}>
          {new Date(review.createdAt).toLocaleDateString('ko-KR')}
        </Text>
        <TouchableOpacity style={styles.likeBtn} onPress={handleLike} activeOpacity={0.7}>
          <Heart
            size={15}
            color={liked ? Colors.primary[500] : Colors.gray[400]}
            fill={liked ? Colors.primary[500] : 'transparent'}
          />
          {likesCount > 0 && (
            <Text style={[styles.likesCount, liked && { color: Colors.primary[500] }]}>
              {likesCount}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PlaceReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { placeId, placeName } = useLocalSearchParams<{ placeId: string; placeName: string }>();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['reviews', placeId],
    queryFn: ({ pageParam = 1 }) => placeService.getReviews(placeId!, pageParam as number),
    getNextPageParam: (last) => last.hasNext ? last.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!placeId,
  });

  const reviews = data?.pages.flatMap((p) => p.reviews) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={styles.flex}>
        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {placeName ?? '리뷰'}
            </Text>
            {total > 0 && (
              <Text style={styles.headerSub}>리뷰 {total}개</Text>
            )}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ReviewItem review={item} placeId={placeId!} />}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + Spacing['2xl'] },
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.empty}>아직 리뷰가 없어요.</Text>
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isFetchingNextPage
                ? <ActivityIndicator color={Colors.primary[500]} style={{ marginVertical: Spacing.lg }} />
                : null
            }
          />
        )}
      </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.6)',
    ...Shadow.sm,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: Colors.gray[500],
    marginTop: 2,
  },

  listContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },

  reviewItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewAuthor: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  reviewBody: {
    fontSize: FontSize.base,
    color: Colors.gray[600],
    lineHeight: 22,
  },
  reviewDate: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  likesCount: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
    fontWeight: FontWeight.medium,
  },

  empty: {
    textAlign: 'center',
    color: Colors.gray[400],
    fontSize: FontSize.base,
    marginTop: Spacing['3xl'],
  },
});
