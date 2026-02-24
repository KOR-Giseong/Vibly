import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { placeService } from '@services/place.service';
import { PlaceCard } from './PlaceCard';
import { Colors, Spacing, FontSize, FontWeight } from '@constants/theme';
import type { Place } from '@/types';

interface NearbyPlaceListProps {
  coords: { lat: number; lng: number } | null;
  onSeeAll?: () => void;
}

export function NearbyPlaceList({ coords, onSeeAll }: NearbyPlaceListProps) {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['nearby', coords?.lat, coords?.lng],
    queryFn: () =>
      placeService.getNearby({ lat: coords!.lat, lng: coords!.lng, limit: 5 }),
    enabled: !!coords,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  const places = data?.data ?? [];

  const handlePress = (place: Place) => {
    router.push(`/place/${place.id}`);
  };

  return (
    <View style={styles.section}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>주변 추천 장소</Text>
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

      {/* 위치 권한 없음 */}
      {!coords && !isLoading && (
        <View style={styles.empty}>
          <MapPin size={32} color={Colors.gray[300]} />
          <Text style={styles.emptyText}>위치 권한이 필요해요</Text>
          <Text style={styles.emptySubText}>설정에서 위치 권한을 허용하면{'\n'}주변 장소를 추천해드려요</Text>
        </View>
      )}

      {/* 데이터 없음 */}
      {coords && !isLoading && places.length === 0 && (
        <View style={styles.empty}>
          <MapPin size={32} color={Colors.gray[300]} />
          <Text style={styles.emptyText}>주변에 등록된 장소가 없어요</Text>
          <Text style={styles.emptySubText}>AI에게 장소를 추천받아보세요</Text>
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
});
