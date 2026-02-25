import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Image,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, X } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { placeService } from '@services/place.service';
import { MoodSelector } from '@components/features/mood/MoodSelector';
import ScreenTransition from '@components/ScreenTransition';
import type { Mood } from '@/types';

// 카테고리 → 이모지 매핑
const CATEGORY_EMOJI: Record<string, string> = {
  CAFE: '☕', RESTAURANT: '🍽️', BAR: '🍺',
  PARK: '🌳', CULTURAL: '🎨', BOOKSTORE: '📚',
  BOWLING: '🎳', KARAOKE: '🎤', SPA: '♨️',
  ESCAPE: '🔐', ARCADE: '🕹️', ETC: '📍',
};

export default function CheckInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { placeId } = useLocalSearchParams<{ placeId: string }>();

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [memo, setMemo] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // ── 장소 데이터 (상세 페이지 캐시 재사용) ──────────────────────────────────
  const { data: place, isLoading: isPlaceLoading } = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => placeService.getById(placeId!),
    enabled: !!placeId,
    staleTime: 1000 * 60 * 5,
  });

  // ── 체크인 제출 ────────────────────────────────────────────────────────────
  const { mutate: submitCheckIn, isPending: isSubmitting } = useMutation({
    mutationFn: () =>
      placeService.checkIn(placeId!, selectedMood!.value, memo.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place', placeId] });
      Alert.alert('체크인 완료! 🎉', `${place?.name ?? '장소'}에 체크인했어요.`, [
        { text: '확인', onPress: () => router.back() },
      ]);
    },
    onError: () => {
      Alert.alert('오류', '체크인에 실패했어요. 다시 시도해주세요.');
    },
  });

  // ── 사진 선택 (갤러리) ─────────────────────────────────────────────────────
  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const canSubmit = !!selectedMood && !isSubmitting;
  const placeEmoji = CATEGORY_EMOJI[place?.category?.toUpperCase?.() ?? ''] ?? '📍';

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 120 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 헤더 */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <ArrowLeft size={22} color={Colors.gray[700]} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>체크인</Text>
              <View style={styles.headerPlaceholder} />
            </View>

            {/* 장소 정보 카드 */}
            <View style={styles.placeCard}>
              {isPlaceLoading ? (
                <ActivityIndicator color={Colors.primary[500]} />
              ) : (
                <>
                  {place?.imageUrl ? (
                    <Image
                      source={{ uri: place.imageUrl }}
                      style={styles.placeIconWrap}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={Gradients.primary}
                      style={styles.placeIconWrap}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.placeEmoji}>{placeEmoji}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName} numberOfLines={1}>
                      {place?.name ?? '-'}
                    </Text>
                    <Text style={styles.placeAddress} numberOfLines={1}>
                      {place?.address ?? ''}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* 사진 추가 */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>사진 추가 (선택)</Text>
              {photoUri ? (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={() => setPhotoUri(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoUploadArea}
                  onPress={handlePickPhoto}
                  activeOpacity={0.7}
                >
                  <Camera size={32} color={Colors.gray[400]} />
                  <Text style={styles.photoUploadText}>사진 업로드</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 기분 선택 */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>지금 기분은?</Text>
              <MoodSelector selectedMood={selectedMood} onSelect={setSelectedMood} />
            </View>

            {/* 한줄 메모 */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>한줄 메모 (선택)</Text>
              <TextInput
                style={styles.textarea}
                multiline
                numberOfLines={4}
                placeholder="이 장소에서 느낀 감정을 기록해보세요..."
                placeholderTextColor={Colors.gray[400]}
                value={memo}
                onChangeText={setMemo}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>
          </ScrollView>

          {/* 체크인 완료 버튼 (하단 고정) */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitDisabled]}
              disabled={!canSubmit}
              activeOpacity={0.85}
              onPress={() => submitCheckIn()}
            >
              {canSubmit && (
                <LinearGradient
                  colors={Gradients.primary}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              )}
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                  체크인 완료
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  scroll: {
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing['2xl'],
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  headerPlaceholder: { width: 40 },

  // 장소 카드
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  placeIconWrap: {
    width: 56, height: 56,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeEmoji: { fontSize: 26 },
  placeInfo: { flex: 1, gap: 4 },
  placeName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  placeAddress: {
    fontSize: FontSize.xs,
    color: Colors.gray[500],
  },

  // 섹션
  section: { gap: Spacing.md },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[900],
  },

  // 사진
  photoUploadArea: {
    borderWidth: 2,
    borderColor: Colors.primary[200],
    borderStyle: 'dashed',
    borderRadius: BorderRadius['2xl'],
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(152,16,250,0.03)',
  },
  photoUploadText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary[500],
  },
  photoPreviewWrap: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    height: 180,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 메모
  textarea: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    fontSize: FontSize.base,
    color: Colors.gray[900],
    minHeight: 100,
    ...Shadow.sm,
  },

  // 하단 고정 버튼
  bottomBar: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
  },
  submitBtn: {
    height: 56,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  submitDisabled: { backgroundColor: Colors.gray[200] },
  submitText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  submitTextDisabled: { color: Colors.gray[400] },
});
