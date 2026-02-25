import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Image, ActivityIndicator, useWindowDimensions, FlatList,
} from 'react-native';
import Animated, {
  useAnimatedStyle, withSpring, useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, Navigation, MapPin, Star, X } from 'lucide-react-native';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow,
} from '@constants/theme';
import { placeService } from '@services/place.service';
import { useLocation } from '@hooks/useLocation';
import ScreenTransition from '@components/ScreenTransition';
import MapContainer, { type MapHandle } from '@components/features/map/MapContainer';
import type { Place } from '@/types';

// ─── Category constants ───────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  '카페':    '☕',
  '레스토랑': '🍽️',
  '바':      '🍷',
  '공원':    '🌿',
  '문화공간': '🎨',
  '서점':    '📚',
  '기타':    '📍',
};

const CATEGORY_COLOR: Record<string, string> = {
  '카페':    '#9810FA',
  '레스토랑': '#F97316',
  '바':      '#EC4899',
  '공원':    '#22C55E',
  '문화공간': '#3B82F6',
  '서점':    '#14B8A6',
  '기타':    '#9CA3AF',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { coords, status: locationStatus, canAskAgain, requestPermission, openSettings } = useLocation();

  // 위치가 확정될 때까지 nearby 쿼리 비활성화
  const locationReady = locationStatus === 'granted' || locationStatus === 'denied';

  const mapRef = useRef<MapHandle>(null);

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [showList, setShowList] = useState(false);

  // Animated bottom card
  const cardY = useSharedValue(240);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
  }));

  // Animated place list sheet
  const listSheetY = useSharedValue(600);
  const listSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: listSheetY.value }],
  }));

  // ── Data ──────────────────────────────────────────────────────────────────────

  const { data: nearbyData, isLoading: nearbyLoading } = useQuery({
    queryKey: ['nearby-map', coords.lat, coords.lng],
    queryFn: () =>
      placeService.getNearby({ lat: coords.lat, lng: coords.lng, radius: 2000, limit: 40 }),
    enabled: locationReady,
    staleTime: 1000 * 60 * 5,
  });

  const { data: searchData, isFetching: searchLoading } = useQuery({
    queryKey: ['map-search', submittedQuery, coords.lat, coords.lng],
    queryFn: () =>
      placeService.search({ query: submittedQuery, lat: coords.lat, lng: coords.lng, limit: 40 }),
    enabled: submittedQuery.trim().length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // 주변 장소 + 검색 결과 동시에 표시 (중복 id 제거)
  const nearbyPlaces: Place[] = nearbyData?.data ?? [];
  const searchPlaces: Place[] = searchData?.data ?? [];
  const places: Place[] = (() => {
    if (!submittedQuery.trim()) return nearbyPlaces;
    const seen = new Set(nearbyPlaces.map((p) => p.id));
    const merged = [...nearbyPlaces];
    for (const p of searchPlaces) {
      if (!seen.has(p.id)) merged.push(p);
    }
    return merged;
  })();

  const isLoading = nearbyLoading || searchLoading;

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const showCard = useCallback(() => {
    cardY.value = withSpring(0, { damping: 20, stiffness: 220 });
  }, [cardY]);

  const hideCard = useCallback((onDone?: () => void) => {
    cardY.value = withSpring(240, { damping: 20, stiffness: 220 });
    setTimeout(() => onDone?.(), 280);
  }, [cardY]);

  const handleMarkerPress = useCallback((place: Place) => {
    setSelectedPlace(place);
    showCard();
    mapRef.current?.animateTo(place.lat, place.lng);
  }, [showCard]);

  const handleDismissCard = useCallback(() => {
    hideCard(() => setSelectedPlace(null));
  }, [hideCard]);

  const handleMyLocation = useCallback(() => {
    if (locationStatus === 'denied' && !canAskAgain) {
      openSettings();
    } else {
      requestPermission();
    }
    mapRef.current?.animateTo(coords.lat, coords.lng);
  }, [coords, locationStatus, canAskAgain, requestPermission, openSettings]);

  const handleSearchSubmit = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    setSubmittedQuery(q);
    handleDismissCard();
  }, [query, handleDismissCard]);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setSubmittedQuery('');
    handleDismissCard();
  }, [handleDismissCard]);

  const openList = useCallback(() => {
    if (selectedPlace) handleDismissCard();
    listSheetY.value = 600;
    setShowList(true);
  }, [selectedPlace, handleDismissCard, listSheetY]);

  const closeList = useCallback(() => {
    listSheetY.value = withSpring(600, { damping: 20, stiffness: 220 });
    setTimeout(() => setShowList(false), 320);
  }, [listSheetY]);

  useEffect(() => {
    if (showList) {
      listSheetY.value = withSpring(0, { damping: 20, stiffness: 220 });
    }
  }, [showList, listSheetY]);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const CARD_BOTTOM = insets.bottom + Spacing.md;
  const LOC_BTN_BOTTOM = selectedPlace
    ? CARD_BOTTOM + 170 + Spacing.md
    : CARD_BOTTOM + Spacing['3xl'];

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <ScreenTransition>
      <View style={styles.container}>

        {/* ── GPS 로딩 전체 화면 ──────────────────────────────────────────── */}
        {!locationReady && (
          <View style={[StyleSheet.absoluteFillObject, styles.gpsLoading]}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text style={styles.gpsLoadingText}>내 위치를 찾고 있어요...</Text>
          </View>
        )}

        {/* ── Map (native only via platform-specific component) ─────────── */}
        {locationReady && (
          <MapContainer
            ref={mapRef}
            places={places}
            selectedId={selectedPlace?.id ?? null}
            coords={coords}
            onMarkerPress={handleMarkerPress}
            onMapPress={() => {
              if (showList) { closeList(); return; }
              if (selectedPlace) handleDismissCard();
            }}
          />
        )}

        {/* ── 위치 권한 거부 배너 ───────────────────────────────────────── */}
        {locationStatus === 'denied' && (
          <TouchableOpacity
            style={[styles.locationDeniedBanner, { top: insets.top + 72 }]}
            onPress={canAskAgain ? requestPermission : openSettings}
            activeOpacity={0.85}
          >
            <Navigation size={13} color={Colors.white} />
            <Text style={styles.locationDeniedText}>
              {canAskAgain ? '위치 권한을 허용하면 내 주변 장소를 볼 수 있어요' : '설정에서 위치 권한을 허용해주세요'}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Loading spinner ──────────────────────────────────────────────── */}
        {isLoading && (
          <View style={[styles.loadingPill, { top: insets.top + 64 }]}>
            <ActivityIndicator size="small" color={Colors.primary[500]} />
            <Text style={styles.loadingText}>장소 불러오는 중...</Text>
          </View>
        )}

        {/* ── Place count badge (tappable → list sheet) ────────────────────── */}
        {!isLoading && places.length > 0 && (
          <TouchableOpacity
            style={[styles.countBadge, { top: insets.top + 64 }]}
            onPress={openList}
            activeOpacity={0.8}
          >
            <MapPin size={11} color={Colors.primary[600]} />
            <Text style={styles.countText}>
              {submittedQuery ? `검색 포함 ${places.length}개` : `주변 ${places.length}개`}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Search bar ───────────────────────────────────────────────────── */}
        <View style={[
          styles.searchBar,
          { top: insets.top + Spacing.md, width: width - Spacing['2xl'] * 2 },
        ]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={Colors.gray[700]} />
          </TouchableOpacity>

          <View style={styles.searchInputWrap}>
            {searchLoading
              ? <ActivityIndicator size="small" color={Colors.primary[400]} />
              : <Search size={15} color={Colors.gray[400]} />
            }
            <TextInput
              style={styles.searchInputText}
              placeholder="장소 검색"
              placeholderTextColor={Colors.gray[400]}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={handleClearSearch}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={15} color={Colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── My location button ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.locBtn, { bottom: LOC_BTN_BOTTOM }]}
          onPress={handleMyLocation}
          activeOpacity={0.8}
        >
          <Navigation size={20} color={Colors.primary[600]} />
        </TouchableOpacity>

        {/* ── Selected place card ──────────────────────────────────────────── */}
        {selectedPlace && (
          <Animated.View style={[styles.card, { bottom: CARD_BOTTOM }, cardStyle]}>
            <TouchableOpacity
              style={styles.cardClose}
              onPress={handleDismissCard}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={15} color={Colors.gray[400]} />
            </TouchableOpacity>

            <View style={styles.cardRow}>
              {/* Thumbnail */}
              {selectedPlace.imageUrl ? (
                <Image
                  source={{ uri: selectedPlace.imageUrl }}
                  style={styles.cardThumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.cardThumb, styles.cardThumbFallback]}>
                  <Text style={styles.cardThumbEmoji}>
                    {CATEGORY_EMOJI[selectedPlace.category] ?? '📍'}
                  </Text>
                </View>
              )}

              {/* Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {selectedPlace.name}
                </Text>
                <Text style={styles.cardCat}>{selectedPlace.category}</Text>

                <View style={styles.cardMeta}>
                  {!!selectedPlace.distance && (
                    <View style={styles.metaItem}>
                      <MapPin size={10} color={Colors.text.muted} />
                      <Text style={styles.metaText}>{selectedPlace.distance}</Text>
                    </View>
                  )}
                  {(selectedPlace.googleRating ?? 0) > 0 && (
                    <View style={styles.metaItem}>
                      <Star size={10} color="#FACC15" fill="#FACC15" />
                      <Text style={styles.metaText}>
                        {selectedPlace.googleRating!.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Buttons */}
                <View style={styles.cardBtns}>
                  <TouchableOpacity
                    style={styles.btnOutline}
                    onPress={() => router.push(`/place/${selectedPlace.id}`)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnOutlineText}>상세보기</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnPrimaryWrap}
                    onPress={() =>
                      router.push({
                        pathname: '/checkin',
                        params: { placeId: selectedPlace.id },
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#9810FA', '#E60076']}
                      style={styles.btnPrimary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.btnPrimaryText}>체크인</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Place list sheet ─────────────────────────────────────────────── */}
        {showList && (
          <>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={closeList}
              activeOpacity={1}
            />
            <Animated.View style={[styles.listSheet, { height: height * 0.6 }, listSheetStyle]}>
              <View style={styles.listHandle} />
              <Text style={styles.listTitle}>주변 장소 {places.length}개</Text>
              <FlatList
                data={places}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => {
                      closeList();
                      setTimeout(() => handleMarkerPress(item), 320);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.listIcon, { borderColor: CATEGORY_COLOR[item.category] ?? Colors.gray[400] }]}>
                      <Text style={styles.listIconEmoji}>{CATEGORY_EMOJI[item.category] ?? '📍'}</Text>
                    </View>
                    <View style={styles.listInfo}>
                      <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.listMeta}>
                        {item.category}{item.distance ? ` · ${item.distance}` : ''}
                      </Text>
                    </View>
                    {(item.googleRating ?? 0) > 0 && (
                      <View style={styles.listRating}>
                        <Star size={11} color="#FACC15" fill="#FACC15" />
                        <Text style={styles.listRatingText}>{item.googleRating!.toFixed(1)}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              />
            </Animated.View>
          </>
        )}

      </View>
    </ScreenTransition>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Location denied banner
  locationDeniedBanner: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#9810FA',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    ...Shadow.md,
  },
  locationDeniedText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },

  gpsLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    gap: 16,
  },
  gpsLoadingText: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },

  // Loading / count
  loadingPill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    ...Shadow.md,
  },
  loadingText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  countBadge: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    ...Shadow.md,
  },
  countText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary[700],
  },

  // Search bar
  searchBar: {
    position: 'absolute',
    left: Spacing['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },
  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.lg,
    height: 44,
    ...Shadow.md,
  },
  searchInputText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.gray[900],
    paddingVertical: 0,
  },

  // Location button
  locBtn: {
    position: 'absolute',
    right: Spacing['2xl'],
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },

  // Selected place card
  card: {
    position: 'absolute',
    left: Spacing['2xl'],
    right: Spacing['2xl'],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.lg,
    ...Shadow.lg,
  },
  cardClose: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  cardThumb: {
    width: 76, height: 76,
    borderRadius: BorderRadius['2xl'],
  },
  cardThumbFallback: {
    backgroundColor: Colors.primary[100],
    alignItems: 'center', justifyContent: 'center',
  },
  cardThumbEmoji: { fontSize: 28 },
  cardInfo: {
    flex: 1,
    gap: 3,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  cardCat: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  cardBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  btnOutline: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
  },
  btnOutlineText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[700],
  },
  btnPrimaryWrap: { flex: 1 },
  btnPrimary: {
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },

  // List sheet
  listSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingTop: Spacing.sm,
    ...Shadow.lg,
  },
  listHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[200],
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  listTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  listIconEmoji: { fontSize: 18 },
  listInfo: { flex: 1 },
  listName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[900],
  },
  listMeta: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  listRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  listRatingText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[700],
  },
});
