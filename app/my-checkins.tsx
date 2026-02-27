import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Clock } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { placeService, type MyCheckIn } from '@services/place.service';
import ScreenTransition from '@components/ScreenTransition';

// ── 무드 value → emoji + label + color ───────────────────────────────────────
const MOOD_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  happy:      { emoji: '😊', label: '행복해요',  color: '#FACC15' },
  peaceful:   { emoji: '😌', label: '평온해요',  color: '#60A5FA' },
  excited:    { emoji: '🥳', label: '신나요',    color: '#F472B6' },
  sad:        { emoji: '😔', label: '우울해요',  color: '#C084FC' },
  thinking:   { emoji: '💭', label: '생각중',    color: '#9CA3AF' },
  passionate: { emoji: '🔥', label: '열정적',    color: '#F87171' },
};

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

// ── 카드 ──────────────────────────────────────────────────────────────────────
function CheckInCard({ item, onPress }: { item: MyCheckIn; onPress: () => void }) {
  const [imgError, setImgError] = useState(false);
  const mood = MOOD_MAP[item.mood] ?? { emoji: '✨', label: item.mood, color: Colors.primary[400] };

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
        {/* 장소명 + 무드 뱃지 */}
        <View style={styles.cardTop}>
          <Text style={styles.placeName} numberOfLines={1}>{item.placeName}</Text>
          <View style={[styles.moodBadge, { backgroundColor: mood.color + '28' }]}>
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
          </View>
        </View>

        {/* 카테고리 */}
        <Text style={styles.categoryText}>{CATEGORY_LABEL[item.category] ?? '기타'}</Text>

        {/* 주소 */}
        {item.address ? (
          <View style={styles.metaRow}>
            <MapPin size={11} color={Colors.gray[400]} />
            <Text style={styles.metaText} numberOfLines={1}>{item.address}</Text>
          </View>
        ) : null}

        {/* 메모 */}
        {item.note ? (
          <View style={styles.noteWrap}>
            <Text style={styles.noteText} numberOfLines={2}>"{item.note}"</Text>
          </View>
        ) : null}

        {/* 날짜 */}
        <View style={styles.metaRow}>
          <Clock size={11} color={Colors.gray[400]} />
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────────────────────────
export default function MyCheckInsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ['my-checkins'],
    queryFn: () => placeService.getMyCheckins(),
    staleTime: 1000 * 60,
  });

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>

        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>내 체크인</Text>
            {data && data.length > 0 && (
              <Text style={styles.headerCount}>총 {data.length}곳 방문</Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : !data?.length ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>아직 체크인한 장소가 없어요</Text>
            <Text style={styles.emptySub}>
              마음에 드는 장소에서{'\n'}첫 체크인을 해보세요!
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CheckInCard
                item={item}
                onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.placeId, source: 'home' } })}
              />
            )}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + Spacing['2xl'] },
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  /* 헤더 */
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
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  headerCount: {
    fontSize: FontSize.xs,
    color: Colors.primary[600],
    fontWeight: FontWeight.semibold,
  },

  /* 상태 */
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gray[800] },
  emptySub: { fontSize: FontSize.sm, color: Colors.gray[400], textAlign: 'center', lineHeight: 20 },

  /* 리스트 */
  list: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, gap: Spacing.sm },

  /* 카드 */
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

  /* 카드 본문 */
  cardBody: { flex: 1, gap: 4 },
  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 6,
  },
  placeName: {
    flex: 1,
    fontSize: FontSize.md, fontWeight: FontWeight.bold,
    color: Colors.gray[900], lineHeight: 20,
  },

  /* 무드 뱃지 */
  moodBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  moodEmoji: { fontSize: 12 },
  moodLabel: { fontSize: 11, fontWeight: FontWeight.semibold },

  /* 카테고리 */
  categoryText: { fontSize: FontSize.xs, color: Colors.gray[500], fontWeight: FontWeight.medium },

  /* 메타 */
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.gray[400], flex: 1 },

  /* 메모 */
  noteWrap: {
    backgroundColor: Colors.gray[50],
    borderLeftWidth: 2, borderLeftColor: Colors.primary[200],
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4,
  },
  noteText: {
    fontSize: FontSize.xs, color: Colors.gray[600],
    fontStyle: 'italic', lineHeight: 17,
  },
});
