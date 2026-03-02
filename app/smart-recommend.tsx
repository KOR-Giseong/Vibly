import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { placeService } from '@services/place.service';
import { useLocation } from '@hooks/useLocation';
import { usePlaceCacheStore } from '@stores/placeCache.store';
import ScreenTransition from '@components/ScreenTransition';
import type { Place } from '@/types';

export default function SmartRecommendScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coords } = useLocation();
  const { setPlace } = usePlaceCacheStore();

  const DEFAULT_COORDS = { lat: 37.5665, lng: 126.9780 };
  const lat = coords?.lat ?? DEFAULT_COORDS.lat;
  const lng = coords?.lng ?? DEFAULT_COORDS.lng;

  const { data, isLoading, error } = useQuery({
    queryKey: ['smart-recommend', lat, lng],
    queryFn: () => placeService.smartRecommend(lat, lng),
    staleTime: 5 * 60 * 1000,
  });

  const handlePlacePress = (place: Place) => {
    setPlace(place.id, place);
    router.push(`/place/${place.id}`);
  };

  return (
    <ScreenTransition>
      <LinearGradient colors={['#F5F3FF', '#FFFFFF']} style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>지금 어디 갈까?</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>AI가 지금 상황에 맞는 장소를 찾고 있어요...</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.errorText}>추천 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</Text>
            </View>
          ) : data ? (
            <>
              {/* 상황 배지 */}
              <View style={styles.contextRow}>
                <View style={styles.contextBadge}>
                  <Text style={styles.contextText}>🌤 {data.weather}</Text>
                </View>
                <View style={styles.contextBadge}>
                  <Text style={styles.contextText}>🕐 {data.timeOfDay}</Text>
                </View>
              </View>

              {/* AI 메시지 */}
              <View style={styles.messageCard}>
                <Text style={styles.messageText}>✨ {data.message}</Text>
              </View>

              {/* 키워드 태그 */}
              <View style={styles.keywordRow}>
                {data.keywords.map((kw) => (
                  <View key={kw} style={styles.keyword}>
                    <Text style={styles.keywordText}># {kw}</Text>
                  </View>
                ))}
              </View>

              {/* 추천 장소 목록 */}
              <Text style={styles.sectionTitle}>추천 장소</Text>
              {data.places.map((place, idx) => (
                <TouchableOpacity
                  key={`${place.id}_${idx}`}
                  style={styles.placeCard}
                  onPress={() => handlePlacePress(place)}
                  activeOpacity={0.85}
                >
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                    <View style={styles.placeMetaRow}>
                      <MapPin size={12} color={Colors.gray[400]} />
                      <Text style={styles.placeMeta} numberOfLines={1}>{place.address}</Text>
                    </View>
                    {place.distance && (
                      <Text style={styles.placeDistance}>{place.distance}</Text>
                    )}
                  </View>
                  <View style={styles.placeCategory}>
                    <Text style={styles.placeCategoryText}>{place.category}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  scroll: { paddingHorizontal: Spacing['2xl'], gap: Spacing.lg },
  loadingWrap: { alignItems: 'center', paddingTop: 60, gap: Spacing.lg },
  loadingText: { fontSize: FontSize.sm, color: Colors.gray[500], textAlign: 'center' },
  errorText: { fontSize: FontSize.sm, color: Colors.gray[500], textAlign: 'center' },
  contextRow: { flexDirection: 'row', gap: Spacing.sm },
  contextBadge: {
    backgroundColor: '#EDE9FE',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  contextText: { fontSize: FontSize.sm, color: '#6D28D9', fontWeight: FontWeight.medium },
  messageCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  messageText: { fontSize: FontSize.base, color: '#6D28D9', fontWeight: FontWeight.medium },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  keyword: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  keywordText: { fontSize: FontSize.sm, color: '#7C3AED' },
  sectionTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[900],
  },
  placeCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.sm,
  },
  placeInfo: { flex: 1 },
  placeName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gray[900] },
  placeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  placeMeta: { fontSize: FontSize.xs, color: Colors.gray[400], flex: 1 },
  placeDistance: { fontSize: FontSize.xs, color: Colors.gray[400], marginTop: 2 },
  placeCategory: {
    backgroundColor: '#EDE9FE',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginLeft: Spacing.sm,
  },
  placeCategoryText: { fontSize: FontSize.xs, color: '#6D28D9', fontWeight: FontWeight.medium },
});
