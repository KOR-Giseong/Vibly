import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, Modal, TextInput, KeyboardAvoidingView, Platform, Pressable, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Sparkles, X, MapPin, ChevronDown } from 'lucide-react-native';
import { notificationApi } from '@services/notification.service';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { useAuthStore } from '@stores/auth.store';
import { useMoodStore } from '@stores/mood.store';
import { useMoodSearch } from '@hooks/useMoodSearch';
import { useLocation } from '@hooks/useLocation';
import { MoodSelector } from '@components/features/mood/MoodSelector';
import { RateLimitBanner } from '@components/features/mood/RateLimitBanner';
import { AIBanner } from '@components/features/ai/AIBanner';
import { NearbyPlaceList } from '@components/features/place/NearbyPlaceList';
import { LocationPermissionModal } from '@components/ui';
import ScreenTransition from '@components/ScreenTransition';
import type { Mood } from '@/types';

// ── 지역 목록 ─────────────────────────────────────────────────────────────────
type Region = {
  id: string;
  label: string;
  coords: { lat: number; lng: number } | null; // null = 현재 위치 사용
  radius: number | null; // null = 반경 제한 없음
};

const REGIONS: Region[] = [
  { id: 'nearby',   label: '내 위치',  coords: null,                          radius: undefined as any },
  { id: 'all',      label: '전체',     coords: { lat: 37.5665, lng: 126.9780 }, radius: null },
  { id: 'seoul',    label: '서울',     coords: { lat: 37.5665, lng: 126.9780 }, radius: null },
  { id: 'gyeonggi', label: '경기',    coords: { lat: 37.4138, lng: 127.5183 }, radius: null },
  { id: 'incheon',  label: '인천',    coords: { lat: 37.4563, lng: 126.7052 }, radius: null },
  { id: 'busan',    label: '부산',    coords: { lat: 35.1796, lng: 129.0756 }, radius: null },
  { id: 'daegu',    label: '대구',    coords: { lat: 35.8714, lng: 128.6014 }, radius: null },
  { id: 'gwangju',  label: '광주',    coords: { lat: 35.1595, lng: 126.8526 }, radius: null },
  { id: 'daejeon',  label: '대전',    coords: { lat: 36.3504, lng: 127.3845 }, radius: null },
  { id: 'ulsan',    label: '울산',    coords: { lat: 35.5384, lng: 129.3114 }, radius: null },
  { id: 'jeju',     label: '제주',    coords: { lat: 33.4996, lng: 126.5312 }, radius: null },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user } = useAuthStore();
  const { selectedMood, setSelectedMood } = useMoodStore();
  const { search, credits, isPremium } = useMoodSearch();
  const { coords, status: locationStatus, canAskAgain, requestPermission, openSettings } = useLocation();

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [locationModalDismissed, setLocationModalDismissed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<Region>(REGIONS[0]);
  const [showRegionModal, setShowRegionModal] = useState(false);

  // 선택된 지역 기준 검색 좌표/반경 결정
  const getSearchParams = () => {
    if (selectedRegion.id === 'nearby') {
      return { searchCoords: coords ?? undefined, searchRadius: undefined as number | null | undefined };
    }
    return { searchCoords: selectedRegion.coords ?? undefined, searchRadius: selectedRegion.radius };
  };

  // 실시간 추천 카드 애니메이션
  const cardScale  = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const shimmerX   = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (!isPremium) return;
    // 진입 애니메이션
    Animated.parallel([
      Animated.spring(cardScale,   { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      // shimmer 루프
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerX, { toValue: 2, duration: 1800, useNativeDriver: true }),
          Animated.timing(shimmerX, { toValue: -1, duration: 0, useNativeDriver: true }),
          Animated.delay(2400),
        ]),
      ).start();
    });
  }, [isPremium]);

  // 탭 포커스마다 미읽음 수 갱신
  useFocusEffect(
    useCallback(() => {
      notificationApi.getUnreadCount().then(setUnreadCount).catch(() => {});
    }, []),
  );

  const displayName = (user?.nickname ?? user?.name)?.split(' ')[0] ?? '게스트';

  // 기분 카드 선택 → 크레딧 확인 후 검색 화면으로 이동
  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    const { searchCoords, searchRadius } = getSearchParams();
    if (isPremium) {
      search(mood.label, searchCoords, searchRadius);
      router.push('/(tabs)/search');
      return;
    }
    Alert.alert(
      '크레딧 사용',
      `5 크레딧을 사용하여 검색합니다.\n현재 보유: ${credits} 크레딧`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '검색하기',
          onPress: () => {
            search(mood.label, searchCoords, searchRadius);
            router.push('/(tabs)/search');
          },
        },
      ],
    );
  };

  // AI 모달에서 검색 실행
  const handleAISearch = () => {
    if (!aiQuery.trim()) return;
    const { searchCoords, searchRadius } = getSearchParams();
    if (isPremium) {
      search(aiQuery.trim(), searchCoords, searchRadius);
      setShowAIModal(false);
      setAiQuery('');
      router.push('/(tabs)/search');
      return;
    }
    Alert.alert(
      '크레딧 사용',
      `10 크레딧을 사용하여 AI 검색합니다.\n현재 보유: ${credits} 크레딧`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '검색하기',
          onPress: () => {
            const { searchCoords: sc, searchRadius: sr } = getSearchParams();
            search(aiQuery.trim(), sc, sr);
            setShowAIModal(false);
            setAiQuery('');
            router.push('/(tabs)/search');
          },
        },
      ],
    );
  };

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <View>
              <View style={styles.greetingRow}>
                <Text style={styles.greeting}>안녕하세요 {displayName}님 </Text>
                <Image
                  source={require('@assets/Staricon.png')}
                  style={styles.starIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.subGreeting}>오늘 기분이 어떠세요?</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={styles.bellBtn}
            >
              <Bell size={22} color={Colors.gray[700]} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* 검색 횟수 안내 */}
          <View style={styles.block}>
            <RateLimitBanner />
          </View>

          {/* 실시간 추천 카드 (프리미엄 전용) */}
          {isPremium && (
            <Animated.View style={{ opacity: cardOpacity, transform: [{ scale: cardScale }] }}>
              <TouchableOpacity
                style={styles.smartRecommendCard}
                onPress={() => router.push('/smart-recommend')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#7C3AED', '#A855F7']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                {/* shimmer 레이어 */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      transform: [{
                        translateX: shimmerX.interpolate({
                          inputRange: [-1, 2],
                          outputRange: [-300, 300],
                        }),
                      }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent']}
                    style={{ flex: 1, width: 120 }}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </Animated.View>
                <View style={styles.smartRecommendContent}>
                  <Text style={styles.smartRecommendEmoji}>🌤</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smartRecommendTitle}>지금 어디 갈까?</Text>
                    <Text style={styles.smartRecommendSub}>날씨와 시간대에 맞는 장소를 AI가 추천해드려요</Text>
                  </View>
                  <Sparkles size={20} color="rgba(255,255,255,0.8)" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* 지역 선택 */}
          <View style={styles.regionRow}>
            <Text style={styles.regionGuide} numberOfLines={1}>위치 또는 지역을 선택해 장소를 찾아보세요!</Text>
            <TouchableOpacity
              style={styles.regionPill}
              onPress={() => setShowRegionModal(true)}
              activeOpacity={0.75}
            >
              <MapPin size={14} color="#9810FA" />
              <Text style={styles.regionPillText}>{selectedRegion.label}</Text>
              <ChevronDown size={14} color={Colors.gray[500]} />
            </TouchableOpacity>
          </View>

          {/* 기분 선택 */}
          <View style={styles.block}>
            <Text style={styles.sectionTitle}>지금 기분</Text>
            <MoodSelector selectedMood={selectedMood} onSelect={handleMoodSelect} />
          </View>

          {/* AI 추천 배너 */}
          <View style={styles.block}>
            <AIBanner onPress={() => setShowAIModal(true)} />
          </View>

          {/* 주변 추천 장소 */}
          <View style={styles.block}>
            <NearbyPlaceList coords={coords} locationStatus={locationStatus} />
          </View>
        </ScrollView>
      </LinearGradient>

      {/* AI 텍스트 입력 모달 */}
      <Modal
        visible={showAIModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAIModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAIModal(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKAV}
          >
            <Pressable style={styles.modalCard}>
              {/* 닫기 버튼 */}
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowAIModal(false)}
              >
                <X size={18} color={Colors.gray[500]} />
              </TouchableOpacity>

              {/* 아이콘 + 제목 */}
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                style={styles.modalIconWrap}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Sparkles size={22} color={Colors.white} />
              </LinearGradient>

              <Text style={styles.modalTitle}>AI에게 물어보기</Text>
              <Text style={styles.modalDesc}>
                지금 기분이나 원하는 분위기를{'\n'}자유롭게 말해보세요
              </Text>

              {/* 입력창 */}
              <TextInput
                style={styles.modalInput}
                placeholder="예) 오늘 너무 지쳐서 조용히 쉬고 싶어요"
                placeholderTextColor={Colors.gray[400]}
                value={aiQuery}
                onChangeText={setAiQuery}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                autoFocus
                returnKeyType="search"
                onSubmitEditing={handleAISearch}
              />

              {/* 검색 버튼 */}
              <TouchableOpacity
                onPress={handleAISearch}
                disabled={!aiQuery.trim()}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={aiQuery.trim() ? ['#9810FA', '#E60076'] : [Colors.gray[200], Colors.gray[200]]}
                  style={styles.modalBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Sparkles size={16} color={aiQuery.trim() ? Colors.white : Colors.gray[400]} />
                  <Text style={[styles.modalBtnText, !aiQuery.trim() && styles.modalBtnTextDisabled]}>
                    장소 찾기
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* 지역 선택 모달 */}
      <Modal
        visible={showRegionModal}
        transparent
        animationType="fade"
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
            {REGIONS.map((region) => {
              const isActive = selectedRegion.id === region.id;
              return (
                <TouchableOpacity
                  key={region.id}
                  style={[styles.regionItem, isActive && styles.regionItemActive]}
                  onPress={() => {
                    setSelectedRegion(region);
                    setShowRegionModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.regionItemText, isActive && styles.regionItemTextActive]}>
                    {region.label}
                  </Text>
                  {isActive && <View style={styles.regionItemDot} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* 위치 권한 모달 */}
      <LocationPermissionModal
        visible={locationStatus === 'denied' && !locationModalDismissed}
        onDismiss={() => setLocationModalDismissed(true)}
        onRequestPermission={() => {
          setLocationModalDismissed(true);
          requestPermission();
        }}
        onOpenSettings={() => {
          setLocationModalDismissed(true);
          openSettings();
        }}
        canAskAgain={canAskAgain}
      />
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: { width: 24, height: 24, marginTop: -2 },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  subGreeting: {
    fontSize: FontSize.sm,
    color: Colors.gray[500],
    marginTop: 2,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    lineHeight: 13,
  },
  block: { gap: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  // ── 모달 ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalKAV: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.md,
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: FontSize.sm,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    fontSize: FontSize.sm,
    color: Colors.gray[900],
    minHeight: 88,
    marginTop: 4,
    backgroundColor: Colors.gray[50],
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    marginTop: 4,
  },
  modalBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  modalBtnTextDisabled: {
    color: Colors.gray[400],
  },
  smartRecommendCard: {
    marginHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadow.md,
  },
  smartRecommendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  smartRecommendEmoji: {
    fontSize: 28,
  },
  smartRecommendTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  // ── 지역 선택 ────────────────────────────────────────────────────────────────
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  regionGuide: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.gray[500],
  },
  regionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    ...Shadow.sm,
  },
  regionPillText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[700],
  },
  regionModalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
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
  regionItemActive: {
    backgroundColor: '#F3E8FF',
  },
  regionItemText: {
    fontSize: FontSize.base,
    color: Colors.gray[700],
  },
  regionItemTextActive: {
    fontWeight: FontWeight.semibold,
    color: '#9810FA',
  },
  regionItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9810FA',
  },
  // ─────────────────────────────────────────────────────────────────────────────
  smartRecommendSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});

