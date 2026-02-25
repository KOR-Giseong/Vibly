import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, Modal, TextInput, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Sparkles, X } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { useAuthStore } from '@stores/auth.store';
import { useMoodStore } from '@stores/mood.store';
import { useMoodSearch } from '@hooks/useMoodSearch';
import { useLocation } from '@hooks/useLocation';
import { MoodSelector } from '@components/features/mood/MoodSelector';
import { RateLimitBanner } from '@components/features/mood/RateLimitBanner';
import { AIBanner } from '@components/features/ai/AIBanner';
import { NearbyPlaceList } from '@components/features/place/NearbyPlaceList';
import ScreenTransition from '@components/ScreenTransition';
import type { Mood } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user } = useAuthStore();
  const { selectedMood, setSelectedMood, rateLimitRemaining } = useMoodStore();
  const { search } = useMoodSearch();
  const { coords, status: locationStatus } = useLocation();

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiQuery, setAiQuery] = useState('');

  const displayName = user?.name?.split(' ')[0] ?? '게스트';

  // 기분 카드 선택 → 검색 후 검색 화면으로 이동
  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    search(mood.label, coords ?? undefined);
    router.push('/(tabs)/search');
  };

  // AI 모달에서 검색 실행
  const handleAISearch = () => {
    if (!aiQuery.trim()) return;
    search(aiQuery.trim(), coords ?? undefined);
    setShowAIModal(false);
    setAiQuery('');
    router.push('/(tabs)/search');
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
            </TouchableOpacity>
          </View>

          {/* 검색 횟수 안내 */}
          <View style={styles.block}>
            <RateLimitBanner remaining={rateLimitRemaining} />
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
});

