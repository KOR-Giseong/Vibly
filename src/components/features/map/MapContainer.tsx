import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors, Shadow } from '@constants/theme';
import type { Place } from '@/types';

// ─── Category styling ─────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  '카페':    Colors.primary[500],
  '레스토랑': '#F97316',
  '바':      Colors.pink[500],
  '공원':    '#22C55E',
  '문화공간': '#3B82F6',
  '서점':    '#14B8A6',
  '기타':    Colors.gray[500],
};

const CATEGORY_EMOJI: Record<string, string> = {
  '카페':    '☕',
  '레스토랑': '🍽️',
  '바':      '🍷',
  '공원':    '🌿',
  '문화공간': '🎨',
  '서점':    '📚',
  '기타':    '📍',
};

const DEFAULT_DELTA = { latitudeDelta: 0.012, longitudeDelta: 0.012 };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MapHandle {
  animateTo: (lat: number, lng: number) => void;
}

export interface MapContainerProps {
  places: Place[];
  selectedId: string | null;
  coords: { lat: number; lng: number };
  onMarkerPress: (place: Place) => void;
  onMapPress: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const MapContainer = forwardRef<MapHandle, MapContainerProps>(
  ({ places, selectedId, coords, onMarkerPress, onMapPress }, ref) => {
    const mapRef = useRef<MapView>(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useImperativeHandle(ref, () => ({
      animateTo: (lat, lng) => {
        mapRef.current?.animateToRegion(
          { latitude: lat, longitude: lng, ...DEFAULT_DELTA },
          400,
        );
      },
    }));

    // 마커 선택 시 spring bounce 애니메이션
    useEffect(() => {
      if (!selectedId) return;
      scaleAnim.setValue(0.5);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 250,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }, [selectedId]);

    return (
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: coords.lat,
          longitude: coords.lng,
          ...DEFAULT_DELTA,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={onMapPress}
      >
        {places.map((place) => {
          const isSelected = selectedId === place.id;
          return (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              onPress={() => onMarkerPress(place)}
              tracksViewChanges
            >
              <Animated.View style={[
                styles.marker,
                { borderColor: CATEGORY_COLOR[place.category] ?? Colors.gray[400] },
                isSelected && styles.markerActive,
                isSelected && { transform: [{ scale: scaleAnim }] },
              ]}>
                <Text style={styles.markerEmoji}>
                  {CATEGORY_EMOJI[place.category] ?? '📍'}
                </Text>
              </Animated.View>
            </Marker>
          );
        })}
      </MapView>
    );
  },
);

MapContainer.displayName = 'MapContainer';
export default MapContainer;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  marker: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5,
    ...Shadow.md,
  },
  markerActive: {
    width: 50, height: 50,
    borderRadius: 25,
    ...Shadow.lg,
  },
  markerEmoji: { fontSize: 18 },
});
