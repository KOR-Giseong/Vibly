import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Badge } from '@components/ui';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from '@constants/theme';
import type { Place } from '@/types';

interface PlaceCardProps {
  place: Place;
  onPress: (place: Place) => void;
}

export function PlaceCard({ place, onPress }: PlaceCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(place)}
      activeOpacity={0.9}
      style={styles.container}
    >
      <View style={styles.imageWrap}>
        {place.imageUrl ? (
          <Image source={{ uri: place.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}
        <View style={[styles.imgLabel, place.imageUrl ? styles.imgLabelReal : styles.imgLabelDefault]}>
          <Text style={styles.imgLabelText}>
            {place.imageUrl ? '📷 실제 이미지' : '🖼 기본 이미지'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
        <Text style={styles.category}>{place.category}</Text>

        {place.tags.length > 0 && (
          <Badge label={place.tags[0]} variant="primary" />
        )}

        <View style={styles.footer}>
          <MapPin size={12} color={Colors.text.muted} />
          <Text style={styles.distance}>{place.distance ?? '-'}</Text>
          {/* Google 평점 우선, 없으면 Vibly 평점 */}
          {(place.googleRating ?? 0) > 0 ? (
            <Text style={styles.rating}>⭐ {place.googleRating!.toFixed(1)}</Text>
          ) : (place.rating ?? 0) > 0 ? (
            <Text style={styles.rating}>★ {place.rating.toFixed(1)}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    overflow: 'hidden',
    padding: Spacing.lg,
    gap: Spacing.lg,
    ...Shadow.sm,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius['2xl'],
  },
  imageFallback: {
    backgroundColor: Colors.primary[100],
  },
  imageWrap: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  imgLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    alignItems: 'center',
  },
  imgLabelText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: FontWeight.medium,
  },
  imgLabelReal: { backgroundColor: 'rgba(0,0,0,0.5)' },
  imgLabelDefault: { backgroundColor: 'rgba(152,16,250,0.75)' },
  content: {
    flex: 1,
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  category: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  distance: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    flex: 1,
  },
  rating: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
  ratingEmpty: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
  },
});
