import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MapPin, RefreshCw } from 'lucide-react-native';
import { placeService } from '@services/place.service';
import { usePlaceCacheStore } from '@stores/placeCache.store';
import { PlaceCard } from './PlaceCard';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@constants/theme';
import type { Place } from '@/types';

interface NearbyPlaceListProps {
  coords: { lat: number; lng: number };
  locationStatus?: 'idle' | 'loading' | 'granted' | 'denied';
  onSeeAll?: () => void;
}

export function NearbyPlaceList({ coords, locationStatus, onSeeAll }: NearbyPlaceListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const QUERY_KEY = ['nearby', coords.lat, coords.lng];

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      placeService.getNearby({ lat: coords.lat, lng: coords.lng, limit: 5 }),
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const places = data?.data ?? [];

  const { setPlace } = usePlaceCacheStore();

  const handlePress = (place: Place) => {
    setPlace(place);
    router.push({ pathname: `/place/${place.id}`, params: { source: 'home' } });
  };

  const isDenied = locationStatus === 'denied';

  return (
    <View style={styles.section}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.title}>주변 추천 장소</Text>
          {isDenied && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>서울 기준</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <RefreshCw size={14} color={Colors.gray[400]} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onSeeAll ?? (() => router.push('/map'))}>
          <Text style={styles.seeAll}>지도로 보기</Text>
        </TouchableOpacity>
      </View>

      {/* 로딩 */}
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary[500]} />
        </View>
      )}

      {/* 데이터 없음 */}
      {!isLoading && places.length === 0 && (
        <View style={styles.empty}>
          <MapPin size={32} color={Colors.gray[300]} />
          <Text style={styles.emptyText}>주변에 등록된 장소가 없어요</Text>
          <Text style={styles.emptySubText}>AI에게 장소를 추천받아보세요.</Text>
        </View>
      )}

      {/* 장소 목록 */}
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} onPress={handlePress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary[600],
  },
  centered: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[500],
    marginTop: Spacing.sm,
  },
  emptySubText: {
    fontSize: FontSize.sm,
    color: Colors.gray[400],
    textAlign: 'center',
    lineHeight: 20,
  },
  defaultBadge: {
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.gray[500],
  },
});
