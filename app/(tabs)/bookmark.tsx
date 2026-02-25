import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, Bookmark, Heart } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';
import { placeService } from '@services/place.service';
import type { Place } from '@/types';

// ─── 공통 상수 ────────────────────────────────────────────────────────────────
type ViewMode = 'grid' | 'list';

const CATEGORIES = [
  '전체', '카페', '레스토랑', '바', '공원',
  '문화공간', '서점', '볼링장', '노래방', '찜질방/스파',
  '방탈출', '오락실', '기타',
];

const CATEGORY_FILTER_MAP: Record<string, string> = {
  CAFE: '카페',
  RESTAURANT: '레스토랑',
  BAR: '바',
  PARK: '공원',
  CULTURAL: '문화공간',
  BOOKSTORE: '서점',
  BOWLING: '볼링장',
  KARAOKE: '노래방',
  SPA: '찜질방/스파',
  ESCAPE: '방탈출',
  ARCADE: '오락실',
  ETC: '기타',
};

function getCategoryLabel(place: Place): string {
  if (place.categoryLabel) return place.categoryLabel;
  return CATEGORY_FILTER_MAP[place.category] ?? '기타';
}

// ─── 그리드 카드 컴포넌트 ─────────────────────────────────────────────────────
function GridCard({
  place,
  onPress,
  onRemove,
}: {
  place: Place;
  onPress: () => void;
  onRemove: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  console.log('[GridCard]', place.name, '| imageUrl:', place.imageUrl);
  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.85}>
      {/* 이미지 */}
      <View style={styles.gridImgWrap}>
        {place.imageUrl && !imgError ? (
          <Image
            source={{ uri: place.imageUrl }}
            style={styles.gridImg}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <LinearGradient colors={['#f3e8ff', '#fce7f3']} style={styles.gridImg} />
        )}
        {/* 하트 버튼: 피그마 - 이미지 우상단에 반투명 원형 배경 */}
        <TouchableOpacity style={styles.heartBtn} onPress={onRemove} activeOpacity={0.8}>
          <Heart size={14} color="#e60076" fill="#e60076" />
        </TouchableOpacity>
      </View>

      {/* 정보 */}
      <View style={styles.gridInfo}>
        <Text style={styles.gridName} numberOfLines={1}>{place.name}</Text>
        <Text style={styles.gridCategory}>{getCategoryLabel(place)}</Text>
        {place.tags[0] && (
          <View style={styles.vibeTag}>
            <Text style={styles.vibeText}>{place.tags[0]}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── 리스트 카드 컴포넌트 ─────────────────────────────────────────────────────
function ListCard({
  place,
  onPress,
  onRemove,
}: {
  place: Place;
  onPress: () => void;
  onRemove: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.85}>
      {/* 이미지 */}
      <View style={styles.listImgWrap}>
        {place.imageUrl && !imgError ? (
          <Image
            source={{ uri: place.imageUrl }}
            style={styles.listImg}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <LinearGradient colors={['#f3e8ff', '#fce7f3']} style={styles.listImg} />
        )}
      </View>

      {/* 정보 */}
      <View style={styles.listInfo}>
        <Text style={styles.listName} numberOfLines={1}>{place.name}</Text>
        <Text style={styles.listCategory}>{getCategoryLabel(place)}</Text>
        {place.tags[0] && (
          <View style={styles.vibeTag}>
            <Text style={styles.vibeText}>{place.tags[0]}</Text>
          </View>
        )}
        {place.savedAt && (
          <Text style={styles.savedAt}>{new Date(place.savedAt).toLocaleDateString('ko-KR')}</Text>
        )}
      </View>

      {/* 하트 버튼 */}
      <TouchableOpacity style={styles.listHeartBtn} onPress={onRemove} activeOpacity={0.8}>
        <Heart size={16} color="#e60076" fill="#e60076" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────
export default function BookmarkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeCategory, setActiveCategory] = useState('전체');

  // ── 데이터 조회
  const { data: bookmarks = [], isLoading, isError } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: placeService.getBookmarks,
    staleTime: 0,
  });

  // ── 북마크 해제 뮤테이션 (낙관적 업데이트)
  const { mutate: removeBookmark } = useMutation({
    mutationFn: (placeId: string) => placeService.toggleBookmark(placeId),
    onMutate: async (placeId) => {
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] });
      const previous = queryClient.getQueryData<Place[]>(['bookmarks']);
      queryClient.setQueryData<Place[]>(['bookmarks'], (old = []) =>
        old.filter((p) => p.id !== placeId)
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['bookmarks'], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const handleRemove = useCallback((placeId: string) => {
    removeBookmark(placeId);
  }, [removeBookmark]);

  // ── 카테고리 필터
  const filtered = activeCategory === '전체'
    ? bookmarks
    : bookmarks.filter((b) => getCategoryLabel(b) === activeCategory);

  // ── 로딩
  if (isLoading) {
    return (
      <ScreenTransition>
        <LinearGradient colors={Gradients.background} style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </LinearGradient>
      </ScreenTransition>
    );
  }

  // ── 에러
  if (isError) {
    return (
      <ScreenTransition>
        <LinearGradient colors={Gradients.background} style={styles.center}>
          <Text style={styles.emptyTitle}>데이터를 불러올 수 없어요</Text>
        </LinearGradient>
      </ScreenTransition>
    );
  }

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>

        {/* ── 헤더: 제목+부제 LEFT / 토글 RIGHT (피그마 동일 행) */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>저장한 장소</Text>
            <Text style={styles.headerSub}>
              {'총 '}
              <Text style={styles.headerCount}>{filtered.length}개</Text>
              {'의 장소를 저장했어요'}
            </Text>
          </View>

          {/* 토글 버튼: 피그마 - 40×40, borderRadius 14, 각 버튼 독립 */}
          <View style={styles.toggleWrap}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
              onPress={() => setViewMode('grid')}
              activeOpacity={0.8}
            >
              <LayoutGrid size={18} color={viewMode === 'grid' ? Colors.white : Colors.gray[500]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.8}
            >
              <List size={18} color={viewMode === 'list' ? Colors.white : Colors.gray[500]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 카테고리 필터: 헤더 바로 아래 */}
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          style={styles.categoryListWrap}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, activeCategory === item && styles.categoryChipActive]}
              onPress={() => setActiveCategory(item)}
            >
              {activeCategory === item && (
                <LinearGradient
                  colors={Gradients.primary}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              )}
              <Text style={[styles.categoryText, activeCategory === item && styles.categoryTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* ── 장소 목록 */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Bookmark size={56} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>저장한 장소가 없어요</Text>
            <Text style={styles.emptyDesc}>마음에 드는 장소를 저장해보세요</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode}
            contentContainerStyle={[styles.placeList, { paddingBottom: insets.bottom + 80 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) =>
              viewMode === 'grid' ? (
                <GridCard
                  place={item}
                  onPress={() => router.push(`/place/${item.id}`)}
                  onRemove={() => handleRemove(item.id)}
                />
              ) : (
                <ListCard
                  place={item}
                  onPress={() => router.push(`/place/${item.id}`)}
                  onRemove={() => handleRemove(item.id)}
                />
              )
            }
          />
        )}
      </LinearGradient>
    </ScreenTransition>
  );
}

// ─── 스타일 ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',          // 피그마: 토글과 텍스트 수직 중앙 정렬
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerLeft: { gap: 4 },
  headerTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#101828',
  },
  headerSub: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4a5565',
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9810fa',
  },

  // ── 토글 버튼 (피그마: 40×40, borderRadius 14, 독립 버튼)
  toggleWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[100],
  },
  toggleBtnActive: {
    backgroundColor: '#9810fa',
  },

  // ── 카테고리 필터
  categoryListWrap: {
    flexGrow: 0,       // 수직 확장 방지
    flexShrink: 0,
  },
  categoryList: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  categoryChipActive: {},
  categoryText: { fontSize: 13, color: Colors.gray[600], fontWeight: '500' },
  categoryTextActive: { color: Colors.white },

  // ── 장소 목록 컨테이너
  placeList: { paddingHorizontal: 24, gap: 12 },

  // ── 그리드 카드 (피그마: borderRadius 24, 이미지 176px)
  gridCard: {
    flex: 1,
    margin: 4,
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  gridImgWrap: { position: 'relative' },
  gridImg: { width: '100%', height: 140 },

  // 피그마: 이미지 우상단, 흰 반투명 원형 bg (32×32)
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridInfo: { padding: 12 },
  gridName: { fontSize: 14, fontWeight: '700', color: '#101828', marginBottom: 2, lineHeight: 20 },
  gridCategory: { fontSize: 12, color: '#6a7282', marginBottom: 6 },

  // ── 리스트 카드
  listCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  listImgWrap: { marginRight: 14 },
  listImg: { width: 72, height: 72, borderRadius: 16 },
  listInfo: { flex: 1 },
  listName: { fontSize: 14, fontWeight: '700', color: '#101828', marginBottom: 2, lineHeight: 20 },
  listCategory: { fontSize: 12, color: '#6a7282', marginBottom: 5 },
  listHeartBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedAt: { fontSize: 11, color: Colors.gray[400], marginTop: 2 },

  // ── 공통: 바이브 태그
  vibeTag: {
    backgroundColor: '#f3e8ff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  vibeText: { fontSize: 12, color: '#8200db', fontWeight: '500' },

  // ── 빈 상태
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.gray[900] },
  emptyDesc: { fontSize: 15, color: Colors.gray[500], textAlign: 'center' },
});

