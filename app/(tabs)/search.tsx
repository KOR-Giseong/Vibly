import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator,
  Modal, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Check } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { useMoodStore } from '@stores/mood.store';
import { useMoodSearch } from '@hooks/useMoodSearch';
import { useLocation } from '@hooks/useLocation';
import { SearchResultCard } from '@components/features/place/SearchResultCard';
import ScreenTransition from '@components/ScreenTransition';
import SearchSettingIcon from '@assets/searchsetting.svg';
import type { Place } from '@/types';

type ViewMode = 'list' | 'grid';
type SortType = 'recommended' | 'distance' | 'rating';

const SORT_OPTIONS: { key: SortType; label: string; desc: string }[] = [
  { key: 'recommended', label: '추천순', desc: 'AI 추천 점수 기준' },
  { key: 'distance',    label: '거리순', desc: '가까운 장소부터' },
  { key: 'rating',      label: '평점순', desc: '별점 높은 순서' },
];

function toMeters(d?: string): number {
  if (!d) return 99999;
  const num = parseFloat(d);
  if (isNaN(num)) return 99999;
  return d.includes('km') ? num * 1000 : num;
}

function sortPlaces(places: Place[], sort: SortType): Place[] {
  const arr = [...places];
  if (sort === 'distance') {
    return arr.sort((a, b) => toMeters(a.distance) - toMeters(b.distance));
  }
  if (sort === 'rating') {
    return arr.sort((a, b) => {
      const ra = a.rating ?? 0;
      const rb = b.rating ?? 0;
      // 평점 0 (Google 미매칭) 은 맨 뒤로
      if (ra === 0 && rb === 0) return 0;
      if (ra === 0) return 1;
      if (rb === 0) return -1;
      return rb - ra;
    });
  }
  return arr; // recommended: 서버 순서 유지
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { selectedMood, searchResult, isSearching } = useMoodStore();
  const { search } = useMoodSearch();
  const { coords } = useLocation();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortType>('recommended');
  const [showSort, setShowSort] = useState(false);
  const [query, setQuery] = useState('');

  const rawPlaces = searchResult?.places ?? [];
  const places = useMemo(() => sortPlaces(rawPlaces as Place[], sortBy), [rawPlaces, sortBy]);

  const moodLabel = selectedMood?.emoji
    ? `${selectedMood.emoji} ${selectedMood.label}`
    : '기분';

  const handleSearch = () => {
    if (!query.trim()) return;
    search(query.trim(), coords ?? undefined);
  };

  const handlePressPlace = (place: Place) => {
    router.push(`/place/${place.id}`);
  };

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={styles.flex}>

        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>검색 결과</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSort(true)}>
            <SearchSettingIcon width={22} height={22} />
          </TouchableOpacity>
        </View>

        {/* 검색 바 */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Search size={16} color={Colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="기분이나 장소를 입력해보세요"
              placeholderTextColor={Colors.gray[400]}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* 기분 카드 */}
        <View style={styles.moodCard}>
          <Text style={styles.moodHint}>당신의 기분</Text>
          <Text style={styles.moodLabel}>{moodLabel}</Text>
          <Text style={styles.countText}>
            총 <Text style={styles.countHighlight}>{places.length}개</Text>의 장소를 찾았어요
          </Text>
        </View>

        {/* 뷰모드 토글 */}
        <View style={styles.toggleRow}>
          {/* 리스트 */}
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>리스트</Text>
          </TouchableOpacity>
          {/* 그리드 */}
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
            onPress={() => setViewMode('grid')}
          >
            <Text style={[styles.toggleText, viewMode === 'grid' && styles.toggleTextActive]}>그리드</Text>
          </TouchableOpacity>
        </View>

        {/* 로딩 */}
        {isSearching && (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.primary[500]} size="large" />
            <Text style={styles.loadingText}>AI가 장소를 찾고 있어요...</Text>
          </View>
        )}

        {/* 빈 상태 */}
        {!isSearching && places.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
            <Text style={styles.emptyDesc}>기분이나 장소 이름으로{'\n'}검색해볼까요?</Text>
          </View>
        )}

        {/* 결과 리스트 */}
        {!isSearching && places.length > 0 && (
          <FlatList
            data={places}
            keyExtractor={(item) => item.id}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + 80 },
            ]}
            columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={viewMode === 'grid' ? styles.gridItemWrap : styles.listItemWrap}>
                <SearchResultCard
                  place={item}
                  onPress={handlePressPlace}
                  mode={viewMode}
                />
              </View>
            )}
          />
        )}
      </LinearGradient>

      {/* 정렬 바텀시트 */}
      <Modal visible={showSort} transparent animationType="slide" onRequestClose={() => setShowSort(false)}>
        <Pressable style={styles.sortOverlay} onPress={() => setShowSort(false)}>
          <Pressable style={styles.sortSheet}>
            <View style={styles.sortHandle} />
            <Text style={styles.sortTitle}>정렬 기준</Text>

            {SORT_OPTIONS.map(({ key, label, desc }) => (
              <TouchableOpacity
                key={key}
                style={[styles.sortOption, sortBy === key && styles.sortOptionActive]}
                onPress={() => { setSortBy(key); setShowSort(false); }}
              >
                <View style={styles.sortOptionLeft}>
                  <Text style={[styles.sortLabel, sortBy === key && styles.sortLabelActive]}>{label}</Text>
                  <Text style={styles.sortDesc}>{desc}</Text>
                </View>
                {sortBy === key && (
                  <Check size={18} color={Colors.primary[600]} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },

  // 검색
  searchWrap: {
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.gray[900],
  },

  // 기분 카드
  moodCard: {
    marginHorizontal: Spacing['2xl'],
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 24,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    gap: 4,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  moodHint: {
    fontSize: FontSize.sm,
    color: '#4A5565',
  },
  moodLabel: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#101828',
  },
  countText: {
    fontSize: FontSize.sm,
    color: '#4A5565',
  },
  countHighlight: {
    color: '#9810FA',
    fontWeight: FontWeight.bold,
  },

  // 뷰모드 토글 (피그마: 리스트/그리드 버튼)
  toggleRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    gap: 8,
    marginBottom: Spacing.md,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: Colors.white,
  },
  toggleBtnActive: {
    backgroundColor: '#9810FA',
  },
  toggleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: '#4A5565',
  },
  toggleTextActive: {
    color: Colors.white,
  },

  // 상태
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  loadingText: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  emptyDesc: {
    fontSize: FontSize.base,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },

  // 리스트
  list: {
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  listItemWrap: {
    alignSelf: 'stretch',
  },
  gridRow: {
    gap: Spacing.sm,
  },
  gridItemWrap: {
    flex: 1,
  },

  // 정렬 바텀시트
  sortOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing['2xl'],
    paddingBottom: 40,
    gap: Spacing.sm,
  },
  sortHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[200],
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  sortTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#101828',
    marginBottom: Spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: 16,
    backgroundColor: Colors.gray[50],
  },
  sortOptionActive: {
    backgroundColor: Colors.primary[50],
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
  },
  sortOptionLeft: {
    gap: 2,
  },
  sortLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: '#101828',
  },
  sortLabelActive: {
    color: Colors.primary[700],
  },
  sortDesc: {
    fontSize: FontSize.xs,
    color: Colors.gray[500],
  },
});
