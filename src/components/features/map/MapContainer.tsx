import React, { forwardRef, useImperativeHandle, useRef, useEffect, memo } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '@constants/theme';
import type { Place } from '@/types';

// ─── Category colors ──────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  '카페':      '#9810FA',
  '레스토랑':  '#F97316',
  '바':        '#EC4899',
  '공원':      '#22C55E',
  '문화공간':  '#3B82F6',
  '서점':      '#14B8A6',
  '볼링장':    '#EAB308',
  '노래방':    '#A855F7',
  '찜질방/스파': '#06B6D4',
  '방탈출':    '#EF4444',
  '오락실':    '#F59E0B',
  '기타':      '#6B7280',
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
  partnerPlaceIds?: Set<string>;
}

// 파트너 스크랩 마커 색상
const PARTNER_COLOR = '#E60076';
const PARTNER_BG    = '#FFF0F7';

// ─── 개별 마커 핀 컴포넌트 (각각 독립적인 둥둥 애니메이션) ──────────────────

interface MarkerPinProps {
  place: Place;
  isSelected: boolean;
  isPartner?: boolean;
}

const MarkerPin = memo(({ place, isSelected, isPartner }: MarkerPinProps) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const color = isPartner ? PARTNER_COLOR : (CATEGORY_COLOR[place.category] ?? '#6B7280');
  const label = (isPartner ? '♥ ' : '') + (place.name ?? '').slice(0, 5);

  // 둥둥 뜨는 루프 애니메이션
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, []);

  // 선택 시 튕기는 효과
  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.35,
          tension: 300,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 200,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  return (
    <Animated.View
      style={{
        alignItems: 'center',
        transform: [
          { translateY: floatAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      {/* 핀 버블 */}
      <View style={[
        styles.pinBubble,
        { backgroundColor: isSelected ? color : (isPartner ? PARTNER_BG : Colors.white) },
        isPartner && !isSelected && styles.pinBubblePartner,
        isSelected && styles.pinBubbleSelected,
      ]}>
        <View style={[styles.pinDot, { backgroundColor: color }]} />
        <Text
          style={[
            styles.pinLabel,
            { color: isSelected ? Colors.white : color },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>

      {/* 핀 꼬리 삼각형 */}
      <View style={[
        styles.pinTail,
        { borderTopColor: isSelected ? color : Colors.white },
      ]} />

      {/* 그림자 타원 */}
      <View style={[styles.pinShadow, isSelected && styles.pinShadowSelected]} />
    </Animated.View>
  );
});

MarkerPin.displayName = 'MarkerPin';

// ─── MapContainer ─────────────────────────────────────────────────────────────

const MapContainer = forwardRef<MapHandle, MapContainerProps>(
  ({ places, selectedId, coords, onMarkerPress, onMapPress, partnerPlaceIds }, ref) => {
    const mapRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      animateTo: (lat, lng) => {
        mapRef.current?.animateToRegion(
          { latitude: lat, longitude: lng, ...DEFAULT_DELTA },
          400,
        );
      },
    }));

    return (
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
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
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            onPress={() => onMarkerPress(place)}
            tracksViewChanges={selectedId === place.id}
            anchor={{ x: 0.5, y: 1 }}
          >
            <MarkerPin
              place={place}
              isSelected={selectedId === place.id}
              isPartner={partnerPlaceIds?.has(place.id)}
            />
          </Marker>
        ))}
      </MapView>
    );
  },
);

MapContainer.displayName = 'MapContainer';
export default MapContainer;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pinBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 52,
  },
  pinBubbleSelected: {
    borderWidth: 0,
    elevation: 8,
    shadowOpacity: 0.3,
  },
  pinBubblePartner: {
    borderColor: PARTNER_COLOR,
    borderWidth: 1.5,
  },
  pinDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.white,
    marginTop: -1,
  },
  pinShadow: {
    width: 10,
    height: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginTop: 2,
  },
  pinShadowSelected: {
    width: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
