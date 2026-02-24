import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Sparkles, MapPin, Star, ChevronRight } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow, MOODS } from '@constants/theme';
import { useAuthStore } from '@stores/auth.store';
import { useMoodStore } from '@stores/mood.store';
import { useMoodSearch } from '@hooks/useMoodSearch';
import ScreenTransition from '@components/ScreenTransition';

const MOCK_NEARBY = [
  { id: '1', name: '블루보틀 성수', category: '카페', vibe: '아늑한', distance: '350m', rating: 4.8 },
  { id: '2', name: '피크닉 한강공원', category: '공원', vibe: '평화로운', distance: '1.2km', rating: 4.6 },
  { id: '3', name: '앤트러사이트 합정', category: '카페', vibe: '감성적', distance: '800m', rating: 4.7 },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { selectedMood, setSelectedMood, rateLimitRemaining, searchResult } = useMoodStore();
  const { search, isLoading } = useMoodSearch();

  const [activeSearch, setActiveSearch] = useState(false);

  const handleMoodSelect = async (mood: typeof MOODS[number]) => {
    setSelectedMood(mood);
    setActiveSearch(true);
    await search(mood.label);
  };

  const displayName = user?.name?.split(' ')[0] ?? '게스트';

  return (
    <ScreenTransition>
    <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>안녕하세요 {displayName}님 ✨</Text>
            <Text style={styles.subGreeting}>오늘은 어떤 기분이신가요?</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.bellBtn}>
            <Bell size={22} color={Colors.gray[700]} />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>

        {/* Rate Limit Warning */}
        {rateLimitRemaining <= 5 && (
          <View style={[styles.rateLimitCard, { backgroundColor: rateLimitRemaining <= 2 ? '#FEF2F2' : '#FFFBEB' }]}>
            <Text style={styles.rateLimitText}>
              {rateLimitRemaining <= 2
                ? `⚠️ AI 검색 횟수가 ${rateLimitRemaining}번 남았어요`
                : `💛 AI 검색 횟수 ${rateLimitRemaining}번 남음`}
            </Text>
          </View>
        )}

        {/* Mood Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>지금 기분을 선택해보세요</Text>
          <View style={styles.moodGrid}>
            {MOODS.map((mood) => {
              const isActive = selectedMood?.value === mood.value;
              return (
                <TouchableOpacity
                  key={mood.value}
                  style={[styles.moodItem, isActive && styles.moodItemActive]}
                  onPress={() => handleMoodSelect(mood)}
                  activeOpacity={0.8}
                >
                  {isActive && (
                    <LinearGradient
                      colors={mood.gradient}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.moodLabel, isActive && styles.moodLabelActive]}>{mood.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* AI Result Card */}
        {isLoading && (
          <View style={styles.aiCard}>
            <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Sparkles size={20} color={Colors.white} />
            <Text style={styles.aiText}>AI가 장소를 찾고 있어요...</Text>
          </View>
        )}
        {searchResult && !isLoading && (
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.aiCard} activeOpacity={0.9}>
            <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={{ flex: 1 }}>
              <View style={styles.aiRow}>
                <Sparkles size={18} color={Colors.white} />
                <Text style={styles.aiLabel}>AI 추천 결과</Text>
              </View>
              <Text style={styles.aiSummary} numberOfLines={2}>{searchResult.summary}</Text>
            </View>
            <ChevronRight size={20} color={Colors.white} />
          </TouchableOpacity>
        )}

        {/* Nearby Places */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>근처 추천 장소</Text>
            <TouchableOpacity onPress={() => router.push('/map')}>
              <Text style={styles.seeAll}>지도로 보기</Text>
            </TouchableOpacity>
          </View>
          {MOCK_NEARBY.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.placeCard}
              onPress={() => router.push(`/place/${place.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.placeImg}>
                <Text style={{ fontSize: 28 }}>🏠</Text>
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeCategory}>{place.category}</Text>
                <View style={styles.placeMeta}>
                  <View style={styles.vibeTag}><Text style={styles.vibeTagText}>{place.vibe}</Text></View>
                  <View style={styles.distRow}>
                    <MapPin size={12} color={Colors.gray[400]} />
                    <Text style={styles.distText}>{place.distance}</Text>
                  </View>
                  <View style={styles.distRow}>
                    <Star size={12} color="#FACC15" fill="#FACC15" />
                    <Text style={styles.distText}>{place.rating}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['4xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing['3xl'] },
  greeting: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  subGreeting: { fontSize: FontSize.sm, color: Colors.gray[500], marginTop: 2 },
  bellBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  bellBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  rateLimitCard: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg },
  rateLimitText: { fontSize: FontSize.sm, color: Colors.gray[700] },
  section: { marginBottom: Spacing['2xl'] },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900], marginBottom: Spacing.lg },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary[600], fontWeight: FontWeight.medium },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  moodItem: {
    width: '30.5%', paddingVertical: Spacing.lg, borderRadius: BorderRadius.xl,
    alignItems: 'center', backgroundColor: Colors.white, overflow: 'hidden',
    ...Shadow.sm,
  },
  moodItemActive: {},
  moodEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  moodLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.gray[600] },
  moodLabelActive: { color: Colors.white },
  aiCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderRadius: BorderRadius['2xl'], padding: Spacing.xl, overflow: 'hidden',
    marginBottom: Spacing['2xl'], ...Shadow.lg,
  },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  aiLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: 'rgba(255,255,255,0.8)' },
  aiText: { fontSize: FontSize.base, color: Colors.white },
  aiSummary: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.white },
  placeCard: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm,
  },
  placeImg: {
    width: 72, height: 72, borderRadius: BorderRadius.xl, backgroundColor: Colors.gray[100],
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.lg,
  },
  placeInfo: { flex: 1 },
  placeName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  placeCategory: { fontSize: FontSize.sm, color: Colors.gray[500], marginBottom: Spacing.sm },
  placeMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  vibeTag: { backgroundColor: Colors.primary[100], borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  vibeTagText: { fontSize: FontSize.xs, color: Colors.primary[700], fontWeight: FontWeight.medium },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  distText: { fontSize: FontSize.xs, color: Colors.gray[500] },
});
