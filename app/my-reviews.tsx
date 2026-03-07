import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Star, Clock } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
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
          size={12}
          color={i <= rating ? '#F59E0B' : Colors.gray[300]}
          fill={i <= rating ? '#F59E0B' : 'transparent'}
        />
      ))}
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
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

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.placeName} numberOfLines={1}>{item.placeName}</Text>
        </View>

        <StarRating rating={item.rating} />

        <Text style={styles.categoryText}>
          {CATEGORY_LABEL[item.category?.toUpperCase?.()] ?? '기타'}
        </Text>

        {item.address ? (
          <View style={styles.metaRow}>
            <MapPin size={11} color={Colors.gray[400]} />
            <Text style={styles.metaText} numberOfLines={1}>{item.address}</Text>
          </View>
        ) : null}

        {item.body ? (
          <View style={styles.noteWrap}>
            <Text style={styles.noteText} numberOfLines={2}>"{item.body}"</Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Clock size={11} color={Colors.gray[400]} />
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MyReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => placeService.getMyReviews(),
    staleTime: 1000 * 60 * 2,
  });
  const reviews = data ?? [];

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>내 리뷰</Text>
            {reviews.length > 0 && (
              <Text style={styles.headerCount}>총 {reviews.length}개 작성</Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>✍️</Text>
            <Text style={styles.emptyTitle}>아직 작성한 리뷰가 없어요</Text>
            <Text style={styles.emptySub}>{'방문한 장소에\n첫 리뷰를 남겨보세요!'}</Text>
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
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  headerCount: { fontSize: FontSize.xs, color: Colors.primary[600], fontWeight: FontWeight.semibold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gray[800] },
  emptySub: { fontSize: FontSize.sm, color: Colors.gray[400], textAlign: 'center', lineHeight: 20 },
  list: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.md,
    alignItems: 'flex-start',
    gap: Spacing.md,
    ...Shadow.md,
  },
  imgWrap: { flexShrink: 0 },
  img: { width: 80, height: 80, borderRadius: BorderRadius.xl },
  cardBody: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  placeName: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gray[900], lineHeight: 20 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  ratingText: { fontSize: 11, color: Colors.gray[500], fontWeight: FontWeight.semibold, marginLeft: 4 },
  categoryText: { fontSize: FontSize.xs, color: Colors.gray[500], fontWeight: FontWeight.medium },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.gray[400], flex: 1 },
  noteWrap: {
    backgroundColor: Colors.gray[50],
    borderLeftWidth: 2, borderLeftColor: Colors.primary[200],
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4,
  },
  noteText: { fontSize: FontSize.xs, color: Colors.gray[600], fontStyle: 'italic', lineHeight: 17 },
});
