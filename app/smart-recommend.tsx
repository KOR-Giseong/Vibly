import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated,
  Modal, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Globe, ChevronDown, X } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import { placeService } from '@services/place.service';
import { useLocation } from '@hooks/useLocation';
import { usePlaceCacheStore } from '@stores/placeCache.store';
import ScreenTransition from '@components/ScreenTransition';
import type { Place } from '@/types';

type SearchMode = 'nearby' | 'region';

interface Region {
  id: string;
  label: string;
  coords: { lat: number; lng: number };
}

const REGIONS: Region[] = [
  { id: 'seoul',     label: '서울',  coords: { lat: 37.5665, lng: 126.9780 } },
  { id: 'gyeonggi', label: '경기',  coords: { lat: 37.4138, lng: 127.5183 } },
  { id: 'incheon',  label: '인천',  coords: { lat: 37.4563, lng: 126.7052 } },
  { id: 'gangwon',  label: '강원',  coords: { lat: 37.8228, lng: 128.1555 } },
  { id: 'chungbuk', label: '충북',  coords: { lat: 36.6357, lng: 127.4917 } },
  { id: 'chungnam', label: '충남',  coords: { lat: 36.5184, lng: 126.8000 } },
  { id: 'sejong',   label: '세종',  coords: { lat: 36.4801, lng: 127.2890 } },
  { id: 'daejeon',  label: '대전',  coords: { lat: 36.3504, lng: 127.3845 } },
  { id: 'jeonbuk',  label: '전북',  coords: { lat: 35.8202, lng: 127.1089 } },
  { id: 'jeonnam',  label: '전남',  coords: { lat: 34.8161, lng: 126.4629 } },
  { id: 'gwangju',  label: '광주',  coords: { lat: 35.1595, lng: 126.8526 } },
  { id: 'gyeongbuk',label: '경북',  coords: { lat: 36.5760, lng: 128.5055 } },
  { id: 'daegu',    label: '대구',  coords: { lat: 35.8714, lng: 128.6014 } },
  { id: 'gyeongnam',label: '경남',  coords: { lat: 35.4606, lng: 128.2132 } },
  { id: 'busan',    label: '부산',  coords: { lat: 35.1796, lng: 129.0756 } },
  { id: 'ulsan',    label: '울산',  coords: { lat: 35.5384, lng: 129.3114 } },
  { id: 'jeju',     label: '제주',  coords: { lat: 33.4996, lng: 126.5312 } },
];

const MAX_CARDS = 15;

export default function SmartRecommendScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coords } = useLocation();
  const { setPlace } = usePlaceCacheStore();
  const [mode, setMode] = useState<SearchMode>('nearby');
  const [selectedRegion, setSelectedRegion] = useState<Region>(REGIONS[0]);
  const [showRegionModal, setShowRegionModal] = useState(false);

  const GPS_COORDS = { lat: coords?.lat ?? 37.5665, lng: coords?.lng ?? 126.9780 };
  const queryCoords = mode === 'nearby' ? GPS_COORDS : selectedRegion.coords;
  const { lat, lng } = queryCoords;

  const { data, isLoading, error } = useQuery({
    queryKey: ['smart-recommend', lat, lng, mode, selectedRegion.id],
    queryFn: () => placeService.smartRecommend(lat, lng, mode === 'nearby' ? 'nearby' : 'wide'),
    staleTime: 5 * 60 * 1000,
  });

  // ── 애니메이션 값 ──────────────────────────────────────────────────────────
  const headerFade  = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(20)).current;
  const msgScale    = useRef(new Animated.Value(0.94)).current;
  const msgPulse    = useRef(new Animated.Value(1)).current;
  const kwFade      = useRef(new Animated.Value(0)).current;
  const cardFades   = useRef(Array.from({ length: MAX_CARDS }, () => new Animated.Value(0))).current;
  const cardSlides  = useRef(Array.from({ length: MAX_CARDS }, () => new Animated.Value(18))).current;
  const pulseRef    = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!data) return;

    // 리셋
    headerFade.setValue(0);
    headerSlide.setValue(20);
    msgScale.setValue(0.94);
    kwFade.setValue(0);
    cardFades.forEach((a) => a.setValue(0));
    cardSlides.forEach((a) => a.setValue(18));
    pulseRef.current?.stop();

    const count = Math.min(data.places.length, MAX_CARDS);

    Animated.sequence([
      // 1. 배지 + AI 메시지 카드 등장
      Animated.parallel([
        Animated.timing(headerFade,  { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.spring(msgScale,    { toValue: 1, tension: 130, friction: 7, useNativeDriver: true }),
      ]),
      // 2. 키워드 태그
      Animated.timing(kwFade, { toValue: 1, duration: 260, useNativeDriver: true }),
      // 3. 장소 카드 순차 등장
      Animated.stagger(
        65,
        cardFades.slice(0, count).map((fade, i) =>
          Animated.parallel([
            Animated.timing(fade,          { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.timing(cardSlides[i], { toValue: 0, duration: 280, useNativeDriver: true }),
          ]),
        ),
      ),
    ]).start(() => {
      // 장소 카드 다 등장 후 AI 카드 미세 펄스 (살아있는 느낌)
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(msgPulse, { toValue: 1.012, duration: 1800, useNativeDriver: true }),
          Animated.timing(msgPulse, { toValue: 1,     duration: 1800, useNativeDriver: true }),
        ]),
      );
      pulseRef.current.start();
    });

    return () => { pulseRef.current?.stop(); };
  }, [data]);

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

        {/* 범위 토글 */}
        <View style={styles.toggleWrap}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'nearby' && styles.toggleBtnActive]}
            onPress={() => setMode('nearby')}
            activeOpacity={0.8}
          >
            {mode === 'nearby' && (
              <LinearGradient colors={['#7C3AED', '#A855F7']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            )}
            <MapPin size={14} color={mode === 'nearby' ? '#fff' : '#7C3AED'} />
            <Text style={[styles.toggleText, mode === 'nearby' && styles.toggleTextActive]}>현재 위치 중심</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'region' && styles.toggleBtnActive]}
            onPress={() => { setMode('region'); setShowRegionModal(true); }}
            activeOpacity={0.8}
          >
            {mode === 'region' && (
              <LinearGradient colors={['#7C3AED', '#A855F7']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            )}
            <Globe size={14} color={mode === 'region' ? '#fff' : '#7C3AED'} />
            <Text style={[styles.toggleText, mode === 'region' && styles.toggleTextActive]}>{selectedRegion.label}</Text>
            <ChevronDown size={13} color={mode === 'region' ? '#fff' : '#7C3AED'} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
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
              {/* 상황 배지 - fade + slide */}
              <Animated.View
                style={[styles.contextRow, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}
              >
                <View style={styles.contextBadge}>
                  <Text style={styles.contextText}>🌤 {data.weather}</Text>
                </View>
                <View style={styles.contextBadge}>
                  <Text style={styles.contextText}>🕐 {data.timeOfDay}</Text>
                </View>
                {mode === 'region' && (
                  <View style={[styles.contextBadge, { backgroundColor: '#FDF2F8' }]}>
                    <Text style={[styles.contextText, { color: '#9D174D' }]}>🏙 {selectedRegion.label}</Text>
                  </View>
                )}
              </Animated.View>

              {/* AI 메시지 - scale + fade + 펄스 */}
              <Animated.View
                style={[
                  styles.messageCard,
                  {
                    opacity: headerFade,
                    transform: [{ scale: Animated.multiply(msgScale, msgPulse) }],
                  },
                ]}
              >
                <Text style={styles.messageText}>✨ {data.message}</Text>
              </Animated.View>

              {/* 키워드 태그 - fade */}
              <Animated.View style={[styles.keywordRow, { opacity: kwFade }]}>
                {data.keywords.map((kw) => (
                  <View key={kw} style={styles.keyword}>
                    <Text style={styles.keywordText}># {kw}</Text>
                  </View>
                ))}
              </Animated.View>

              {/* 추천 장소 - 순차 slide-up */}
              <Animated.Text style={[styles.sectionTitle, { opacity: kwFade }]}>추천 장소</Animated.Text>
              {data.places.map((place, idx) => (
                <Animated.View
                  key={`${place.id}_${idx}`}
                  style={{
                    opacity: cardFades[idx] ?? 1,
                    transform: [{ translateY: cardSlides[idx] ?? 0 }],
                  }}
                >
                  <TouchableOpacity
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
                      {mode === 'nearby' && place.distance && (
                        <Text style={styles.placeDistance}>{place.distance}</Text>
                      )}
                    </View>
                    <View style={styles.placeCategory}>
                      <Text style={styles.placeCategoryText}>{place.category}</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </>
          ) : null}
        </ScrollView>
      </LinearGradient>
      {/* 지역 선택 모달 */}
      <Modal
        visible={showRegionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRegionModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowRegionModal(false)}>
          <Pressable style={styles.regionModalCard}>
            <View style={styles.regionModalHeader}>
              <Text style={styles.regionModalTitle}>지역 선택</Text>
              <TouchableOpacity onPress={() => setShowRegionModal(false)}>
                <X size={20} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {REGIONS.map((region) => {
                const isActive = selectedRegion.id === region.id;
                return (
                  <TouchableOpacity
                    key={region.id}
                    style={[styles.regionItem, isActive && styles.regionItemActive]}
                    onPress={() => { setSelectedRegion(region); setShowRegionModal(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.regionItemText, isActive && styles.regionItemTextActive]}>
                      {region.label}
                    </Text>
                    {isActive && <View style={styles.regionItemDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  toggleWrap: {
    flexDirection: 'row',
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.md,
    backgroundColor: '#EDE9FE',
    borderRadius: BorderRadius.full,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  toggleBtnActive: {},
  toggleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: '#7C3AED',
  },
  toggleTextActive: {
    color: '#fff',
  },
  scroll: { paddingHorizontal: Spacing['2xl'], gap: Spacing.lg },
  loadingWrap: { alignItems: 'center', paddingTop: 60, gap: Spacing.lg },
  loadingText: { fontSize: FontSize.sm, color: Colors.gray[500], textAlign: 'center' },
  errorText: { fontSize: FontSize.sm, color: Colors.gray[500], textAlign: 'center' },
  contextRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
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
  // ── 지역 모달 ──────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  regionModalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    maxHeight: '75%',
  },
  regionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  regionModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  regionItemActive: { backgroundColor: '#F3E8FF' },
  regionItemText: { fontSize: FontSize.base, color: Colors.gray[700] },
  regionItemTextActive: { fontWeight: FontWeight.semibold, color: '#7C3AED' },
  regionItemDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7C3AED' },
});
