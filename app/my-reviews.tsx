import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { placeService, type MyReview } from '@services/place.service';
import ScreenTransition from '@components/ScreenTransition';

const CATEGORY_LABEL: Record<string, string> = {
  CAFE: '카페', RESTAURANT: '레스토랑', BAR: '바',
  PARK: '공원', CULTURAL: '문화공간', BOOKSTORE: '서점',
  BOWLING: '볼링장', KARAOKE: '노래방', SPA: '찜질방/스파',
  ESCAPE: '방탈출', ARCADE: '오락실', ETC: '기타',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          color={i <= rating ? '#F59E0B' : Colors.gray[300]}
          fill={i <= rating ? '#F59E0B' : 'transparent'}
        />
      ))}
    </View>
  );
}

function ReviewCard({ item, onPress }: { item: MyReview; onPress: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* 이미지 */}
      <View style={styles.imgWrap}>
        {item.imageUrl && !imgError ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.img}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <LinearGradient colors={['#f3e8ff', '#fce7f3']} style={styles.img} />
        )}
      </View>

      {/* 본문 */}
      <View style={styles.cardBody}>
        {/* 장소명 + 카테고리 뱃지 */}
        <View style={styles.cardTop}>
          <Text style={styles.placeName} numberOfLines={1}>{item.placeName}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {CATEGORY_LABEL[item.category?.toUpperCase?.()] ?? item.category}
            </Text>
          </View>
        </View>

        {/* 별점 */}
        <StarRating rating={item.rating} />

        {/* 리뷰 내용 */}
        {item.body ? (
          <Text style={styles.reviewBody} numberOfLines={2}>{item.body}</Text>
        ) : null}

        {/* 주소 + 날짜 */}
        <View style={styles.cardFooter}>
          <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MyReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: placeService.getMyReviews,
    staleTime: 1000 * 60 * 2,
  });

  return (
    <ScreenTransition>
      <View style={styles.flex}>
        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>내 리뷰</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>✍️</Text>
            <Text style={styles.emptyTitle}>아직 작성한 리뷰가 없어요</Text>
            <Text style={styles.emptyDesc}>방문한 장소에 리뷰를 남겨보세요!</Text>
          </View>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              <ReviewCard
                item={item}
                onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.placeId } })}
              />
            }
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
    backgroundColor: Colors.white,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.gray[700] },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.gray[500] },
  list: { padding: Spacing.md, gap: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  imgWrap: { width: 90, height: 90 },
  img: { width: 90, height: 90 },
  cardBody: {
    flex: 1,
    padding: 12,
    gap: 4,
    justifyContent: 'center',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  placeName: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  categoryBadge: {
    backgroundColor: Colors.primary[50],
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: { fontSize: 10, color: Colors.primary[600], fontWeight: FontWeight.medium },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  reviewBody: {
    fontSize: FontSize.xs,
    color: Colors.gray[600],
    lineHeight: 18,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  address: { flex: 1, fontSize: 10, color: Colors.gray[400], marginRight: 8 },
  date: { fontSize: 10, color: Colors.gray[400] },
});
