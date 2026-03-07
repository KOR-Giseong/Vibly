import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator,
  Modal, Pressable, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, Check, Sparkles } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { SearchResultCard } from '@components/features/place/SearchResultCard';
import { CreditDisplay } from '@components/features/credit/CreditDisplay';
import ScreenTransition from '@components/ScreenTransition';
import SearchSettingIcon from '@assets/searchsetting.svg';
import { placeService } from '@services/place.service';
import { useLocation } from '@hooks/useLocation';
import { useMoodStore } from '@stores/mood.store';
import { usePlaceCacheStore } from '@stores/placeCache.store';
import {
  useMapFilterStore,
  LIMIT_OPTIONS, RADIUS_OPTIONS,
  radiusLabel,
  isPremiumLimit, isPremiumRadius,
  type LimitOption, type RadiusOption,
} from '@stores/mapFilter.store';
import { useCreditStore } from '@stores/credit.store';
import type { Place } from '@/types';

type ViewMode = 'list' | 'grid';
type SortType = 'recommended' | 'distance' | 'rating';

const SORT_OPTIONS: { key: SortType; label: string; desc: string }[] = [
  { key: 'recommended', label: '추천순', desc: '관련도 높은 순서' },
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
      if (ra === 0 && rb === 0) return 0;
      if (ra === 0) return 1;
      if (rb === 0) return -1;
      return rb - ra;
    });
  }
  return arr;
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coords, status: locationStatus } = useLocation();
  const { searchResult, isSearching, setSearchResult, selectedMood } = useMoodStore();
  const { setPlace } = usePlaceCacheStore();

  const queryClient = useQueryClient();
  const { limit, radius, setLimit, setRadius } = useMapFilterStore();
  const { isPremium } = useCreditStore();

  const [input, setInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortType>('recommended');
  const [showSort, setShowSort] = useState(false);

  // 주변 장소 (검색어 없을 때 기본으로 표시)
  const { data: nearbyData, isLoading: nearbyLoading, isError: nearbyError, refetch: refetchNearby } = useQuery({
    queryKey: ['nearby-search', coords.lat, coords.lng, radius, limit],
    queryFn: () =>
      placeService.getNearby({ lat: coords.lat, lng: coords.lng, radius, limit }),
    enabled: locationStatus === 'granted',
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  const { data: searchData, isFetching: searchFetching } = useQuery({
    queryKey: ['search', submittedQuery, coords.lat, coords.lng, limit],
    queryFn: () =>
      placeService.search({
        query: submittedQuery,
        lat: coords.lat,
        lng: coords.lng,
        limit,
      }),
    enabled: submittedQuery.trim().length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // 기분/AI 결과가 있고 직접 검색어가 없을 때 → mood 결과 표시
  const showMoodResults = !submittedQuery.trim() && !!searchResult;

  // mood 배너 애니메이션 (페이드인 + 위에서 슬라이드 + 펄스 루프)
  const moodBannerOpacity = useRef(new Animated.Value(0)).current;
  const moodBannerY = useRef(new Animated.Value(-16)).current;
  const moodBannerScale = useRef(new Animated.Value(1)).current;
  const moodPulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (showMoodResults && searchResult) {
      moodBannerOpacity.setValue(0);
      moodBannerY.setValue(-16);
      moodBannerScale.setValue(1);

      // 진입 후 펄스 루프 시작
      Animated.parallel([
        Animated.timing(moodBannerOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(moodBannerY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start(() => {
        moodPulseRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(moodBannerScale, { toValue: 1.04, duration: 600, useNativeDriver: true }),
            Animated.timing(moodBannerScale, { toValue: 1,    duration: 600, useNativeDriver: true }),
            Animated.delay(1200),
          ]),
        );
        moodPulseRef.current.start();
      });
    } else {
      moodPulseRef.current?.stop();
      moodBannerScale.setValue(1);
    }
    return () => { moodPulseRef.current?.stop(); };
  }, [searchResult]);

  const isLocationLoading = locationStatus === 'idle' || locationStatus === 'loading';
  const isFetching = searchFetching || nearbyLoading || isSearching || isLocationLoading;
  const rawPlaces: Place[] = submittedQuery.trim()
    ? (searchData?.data ?? [])
    : showMoodResults
      ? (searchResult!.places as Place[]).slice(0, limit)
      : (nearbyData?.data ?? []);
  const places = sortPlaces(rawPlaces, sortBy);

  const handleSubmit = useCallback(() => {
    const q = input.trim();
    if (!q) return;
    setSubmittedQuery(q);
    setSearchResult(null); // 텍스트 검색 시작하면 mood 결과 초기화
  }, [input, setSearchResult]);

  const handleClear = useCallback(() => {
    setInput('');
    setSubmittedQuery('');
  }, []);

  const handlePressPlace = (place: Place) => {
    setPlace(place);
    if (showMoodResults) {
      const moodLabel = selectedMood?.label ?? searchResult?.query;
      router.push({
        pathname: '/place/[id]',
        params: { id: place.id, source: 'search', ...(moodLabel ? { mood: moodLabel } : {}) },
      });
    } else if (!submittedQuery.trim()) {
      router.push({ pathname: '/place/[id]', params: { id: place.id, source: 'home' } });
    } else {
      router.push({ pathname: '/place/[id]', params: { id: place.id } });
    }
  };

  const hasSearched = submittedQuery.trim().length > 0;

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={styles.flex}>

        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <Text style={styles.headerTitle}>검색</Text>
          <View style={styles.headerRight}>
            <CreditDisplay size="sm" />
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSort(true)}>
              <SearchSettingIcon width={22} height={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 검색 바 */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Search size={16} color={Colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="장소 이름, 카테고리로 검색"
              placeholderTextColor={Colors.gray[400]}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSubmit}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {input.length > 0 && (
              <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={Colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* AI 기분 검색 배너 */}
        {!isFetching && showMoodResults && searchResult && (
          <Animated.View
            style={[
              styles.moodBannerWrap,
              { opacity: moodBannerOpacity, transform: [{ translateY: moodBannerY }, { scale: moodBannerScale }] },
            ]}
          >
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              style={styles.moodBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Sparkles size={13} color="rgba(255,255,255,0.9)" style={{ marginTop: 2 }} />
              <Text style={styles.moodBannerText} numberOfLines={5}>{searchResult.summary}</Text>
              <TouchableOpacity onPress={() => setSearchResult(null)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <X size={14} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* 결과 카운트 + 뷰 토글 */}
        {!isFetching && places.length > 0 && (
          <View style={styles.resultRow}>
            <Text style={styles.countText}>
              {hasSearched
                ? <><Text style={styles.countHighlight}>{places.length}개</Text>의 장소를 찾았어요</>
                : showMoodResults
                  ? <><Text style={styles.countHighlight}>{places.length}개</Text>의 추천 장소</>
                  : <><Text style={styles.countHighlight}>{places.length}개</Text>의 주변 장소</>
              }
            </Text>
            <View style={styles.toggleWrap}>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                onPress={() => setViewMode('list')}
              >
                <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>리스트</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
                onPress={() => setViewMode('grid')}
              >
                <Text style={[styles.toggleText, viewMode === 'grid' && styles.toggleTextActive]}>그리드</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 로딩 */}
        {isFetching && (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.primary[500]} size="large" />
            <Text style={styles.loadingText}>장소를 찾고 있어요...</Text>
          </View>
        )}



        {/* 결과 없음 */}
        {!isFetching && places.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{hasSearched ? '😅' : nearbyError ? '⚠️' : '📍'}</Text>
            <Text style={styles.emptyTitle}>
              {hasSearched ? '검색 결과가 없어요.' : nearbyError ? '주변 장소를 불러오지 못했어요.' : '주변 장소가 없어요.'}
            </Text>
            <Text style={styles.emptyDesc}>
              {hasSearched ? '다른 키워드로 검색해보세요.' : nearbyError ? '네트워크 상태를 확인해주세요.' : '더 넓은 범위를 탐색해보세요.'}
            </Text>
            {nearbyError && !hasSearched && (
              <TouchableOpacity style={styles.retryBtn} onPress={() => refetchNearby()}>
                <Text style={styles.retryBtnText}>다시 시도</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 결과 리스트 */}
        {!isFetching && places.length > 0 && (
          <FlatList
            data={places}
            keyExtractor={(item) => item.id}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
            columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={viewMode === 'grid' ? styles.gridItemWrap : styles.listItemWrap}>
                <SearchResultCard place={item} onPress={handlePressPlace} mode={viewMode} />
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
            <Text style={styles.sortTitle}>검색 설정</Text>

            {/* ── 정렬 기준 ── */}
            <Text style={styles.filterSectionTitle}>정렬 기준</Text>
            {SORT_OPTIONS.map(({ key, label, desc }) => (
              <TouchableOpacity
                key={key}
                style={[styles.sortOption, sortBy === key && styles.sortOptionActive]}
                onPress={() => setSortBy(key)}
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

            {/* ── 표시 장소 수 ── */}
            <View style={styles.filterDivider} />
            <View style={styles.filterRow}>
              <Text style={styles.filterSectionTitle}>표시 장소 수</Text>
              <Text style={styles.filterCurrentVal}>{limit}개</Text>
            </View>
            <View style={styles.chipRow}>
              {LIMIT_OPTIONS.map((opt) => {
                const needsPremium = isPremiumLimit(opt as LimitOption);
                const locked = needsPremium && !isPremium;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, limit === opt && styles.chipSelected, locked && styles.chipLocked]}
                    onPress={() => {
                      if (locked) { setShowSort(false); router.push('/subscription'); return; }
                      setLimit(opt as LimitOption);
                    }}
                    activeOpacity={0.75}
                  >
                    {limit === opt && !locked && <Check size={10} color={Colors.white} strokeWidth={3} />}
                    {locked && <Text style={styles.crownIcon}>👑</Text>}
                    <Text style={[styles.chipText, limit === opt && styles.chipTextSelected, locked && styles.chipTextLocked]}>{opt}개</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── 검색 반경 ── */}
            <View style={styles.filterDivider} />
            <View style={styles.filterRow}>
              <Text style={styles.filterSectionTitle}>검색 반경</Text>
              <Text style={styles.filterCurrentVal}>{radiusLabel(radius)}</Text>
            </View>
            <View style={styles.chipRow}>
              {RADIUS_OPTIONS.map((opt) => {
                const needsPremium = isPremiumRadius(opt as RadiusOption);
                const locked = needsPremium && !isPremium;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, radius === opt && styles.chipSelected, locked && styles.chipLocked]}
                    onPress={() => {
                      if (locked) { setShowSort(false); router.push('/subscription'); return; }
                      setRadius(opt as RadiusOption);
                    }}
                    activeOpacity={0.75}
                  >
                    {radius === opt && !locked && <Check size={10} color={Colors.white} strokeWidth={3} />}
                    {locked && <Text style={styles.crownIcon}>👑</Text>}
                    <Text style={[styles.chipText, radius === opt && styles.chipTextSelected, locked && styles.chipTextLocked]}>{radiusLabel(opt)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── 적용 버튼 ── */}
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                queryClient.invalidateQueries({ queryKey: ['nearby-search'] });
                queryClient.invalidateQueries({ queryKey: ['search'] });
                setShowSort(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.applyBtnText}>적용하기</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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

  moodBannerWrap: {
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.sm,
  },
  moodBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  moodBannerText: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.white,
    lineHeight: 18,
  },

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

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.sm,
  },
  countText: { fontSize: FontSize.sm, color: '#4A5565' },
  countHighlight: { color: '#9810FA', fontWeight: FontWeight.bold },

  toggleWrap: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  toggleBtnActive: { backgroundColor: '#9810FA' },
  toggleText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: '#4A5565' },
  toggleTextActive: { color: Colors.white },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  loadingText: { fontSize: FontSize.base, color: Colors.text.secondary },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  emptyDesc: { fontSize: FontSize.base, color: Colors.gray[500], textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    marginTop: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary[600], borderRadius: BorderRadius.full,
  },
  retryBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: '#fff' },

  list: { paddingHorizontal: Spacing['2xl'], gap: Spacing.md },
  listItemWrap: { alignSelf: 'stretch' },
  gridRow: { gap: Spacing.sm },
  gridItemWrap: { flex: 1 },

  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.sm,
  },
  nearbyTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.gray[800],
  },
  nearbyCount: {
    fontSize: FontSize.sm,
    color: Colors.primary[600],
    fontWeight: FontWeight.semibold,
  },

  sortOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sortSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing['2xl'],
    paddingBottom: 40,
    gap: Spacing.sm,
  },
  sortHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.gray[200], alignSelf: 'center', marginBottom: Spacing.sm,
  },
  sortTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#101828', marginBottom: Spacing.sm },
  sortOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    borderRadius: 16, backgroundColor: Colors.gray[50],
  },
  sortOptionActive: {
    backgroundColor: Colors.primary[50], borderWidth: 1.5, borderColor: Colors.primary[200],
  },
  sortOptionLeft: { gap: 2 },
  sortLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: '#101828' },
  sortLabelActive: { color: Colors.primary[700] },
  sortDesc: { fontSize: FontSize.xs, color: Colors.gray[500] },

  filterDivider: { height: 1, backgroundColor: Colors.gray[100], marginVertical: Spacing.xs },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[700],
  },
  filterCurrentVal: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary[600],
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.gray[200],
    backgroundColor: Colors.gray[50],
  },
  chipSelected: { borderColor: Colors.primary[500], backgroundColor: Colors.primary[600] },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.gray[600] },
  chipTextSelected: { color: Colors.white, fontWeight: FontWeight.bold },
  applyBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  chipLocked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  crownIcon: {
    fontSize: 10,
    marginRight: 2,
  },
  chipTextLocked: {
    color: '#9CA3AF',
  },
});


