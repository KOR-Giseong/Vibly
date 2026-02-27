import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Image,
  ActivityIndicator, Alert, ActionSheetIOS,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ArrowLeft, Receipt, X, MapPin, CheckCircle } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { placeService } from '@services/place.service';
import { MoodSelector } from '@components/features/mood/MoodSelector';
import ScreenTransition from '@components/ScreenTransition';
import type { Mood } from '@/types';

const GPS_LIMIT_M = 100; // 체크인 허용 반경 (미터)
const RECEIPT_REQUIRED = ['CAFE', 'RESTAURANT', 'BAR'];  // 영수증 필수
const GPS_ONLY = ['PARK', 'CULTURAL'];                    // GPS 필수

/** Haversine 거리 계산 (미터) */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // ── 위치 자동 취득 ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLocationLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch {
        // 위치 취득 실패 시 영수증으로만 체크인 가능
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  // ── 장소 데이터 (상세 페이지 캐시 재사용) ──────────────────────────────────
  const { data: place, isLoading: isPlaceLoading } = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => placeService.getById(placeId!),
    enabled: !!placeId,
    staleTime: 1000 * 60 * 5,
  });

  // ── 체크인 제출 (영수증 or GPS) ─────────────────────────────────────────────
  const { mutate: submitCheckIn, isPending: isSubmitting } = useMutation({
    mutationFn: () =>
      placeService.checkIn(
        placeId!,
        selectedMood!.value,
        receiptUri,
        memo.trim() || undefined,
        receiptUri ? undefined : (userLocation ?? undefined),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place', placeId] });
      Alert.alert('체크인 완료! 🎉', `${place?.name ?? '장소'}에 체크인했어요.`, [
        { text: '확인', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      // 422: OCR 체크인 검증 실패
      const msg: string =
        error?.response?.data?.message ??
        '체크인에 실패했어요. 다시 시도해주세요.';
      Alert.alert('체크인 실패', msg);
    },
  });

  // ── 영수증 촬영 (카메라/갤러리 선택) ─────────────────────────────────────────
  const openReceiptPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['취소', '카메라로 촬영', '갤러리에서 선택'], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) launchCamera();
          if (idx === 2) launchGallery();
        },
      );
    } else {
      Alert.alert('영수증 사진', '추가 방법을 선택해주세요.', [
        { text: '취소', style: 'cancel' },
        { text: '카메라로 촬영', onPress: launchCamera },
        { text: '갤러리에서 선택', onPress: launchGallery },
      ]);
    }
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const launchGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  // 장소와의 거리 계산
  const distanceM =
    userLocation && place?.lat && place?.lng
      ? haversineDistance(userLocation.lat, userLocation.lng, place.lat, place.lng)
      : null;
  const isNearby = distanceM !== null && distanceM <= GPS_LIMIT_M;

  // 카테고리별 체크인 방식
  const category = place?.category?.toUpperCase?.() ?? '';
  const checkInMode =
    RECEIPT_REQUIRED.includes(category) ? 'receipt' :
    GPS_ONLY.includes(category) ? 'gps' : 'both';

  // canSubmit 카테고리별 분기
  const canSubmit = !!selectedMood && !isSubmitting && (
    checkInMode === 'receipt' ? !!receiptUri :
    checkInMode === 'gps'     ? isNearby :
    (!!receiptUri || isNearby)  // both
  );
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

            {/* 영수증 / GPS 섹션 (카테고리별 분기) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>
                  {checkInMode === 'receipt' ? '영수증 사진' :
                   checkInMode === 'gps' ? 'GPS 위치 확인' : '영수증 사진'}
                </Text>
                <View style={[
                  styles.optionalBadge,
                  checkInMode === 'receipt' ? styles.requiredBadge :
                  checkInMode === 'gps' ? styles.gpsBadge : null,
                ]}>
                  <Text style={styles.optionalText}>
                    {checkInMode === 'receipt' ? '필수' :
                     checkInMode === 'gps' ? 'GPS 전용' : '선택'}
                  </Text>
                </View>
              </View>
              <View style={styles.receiptHint}>
                <Receipt size={14} color={Colors.primary[500]} />
                <Text style={styles.receiptHintText}>
                  {checkInMode === 'receipt'
                    ? '이 장소는 영수증으로만 체크인할 수 있어요.'
                    : checkInMode === 'gps'
                    ? '이 장소는 GPS로만 체크인할 수 있어요. 100m 이내 접근 필요.'
                    : '영수증 첨부 시 인증 마크 부여, 없으면 GPS 100m 이내로 체크인.'
                  }
                </Text>
              </View>

              {/* GPS 상태 (receipt 전용이 아니면 표시) */}
              {checkInMode !== 'receipt' && (
                <View style={[
                  styles.gpsStatus,
                  isNearby ? styles.gpsStatusOk : userLocation ? styles.gpsStatusWarn : styles.gpsStatusFail,
                ]}>
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={Colors.gray[500]} />
                  ) : isNearby ? (
                    <CheckCircle size={14} color="#16a34a" />
                  ) : (
                    <MapPin size={14} color={userLocation ? '#d97706' : Colors.gray[400]} />
                  )}
                  <Text style={[
                    styles.gpsStatusText,
                    isNearby ? styles.gpsStatusTextOk
                    : userLocation ? styles.gpsStatusTextWarn
                    : styles.gpsStatusTextFail,
                  ]}>
                    {locationLoading
                      ? 'GPS 위치 확인 중...'
                      : isNearby
                      ? `📍 ${Math.round(distanceM!)}m 이내 — GPS 체크인 가능`
                      : distanceM !== null
                      ? `📍 ${Math.round(distanceM)}m 떨어짐 — ${GPS_LIMIT_M}m 이내 접근 필요`
                      : '위치 권한 없음 — 위치 접근을 허용해주세요'}
                  </Text>
                </View>
              )}

              {/* 영수증 업로드 (gps 전용이 아니면 표시) */}
              {checkInMode !== 'gps' && (
                receiptUri ? (
                  <View style={styles.photoPreviewWrap}>
                    <Image source={{ uri: receiptUri }} style={styles.photoPreview} resizeMode="contain" />
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      onPress={() => setReceiptUri(null)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={14} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.photoUploadArea}
                    onPress={openReceiptPicker}
                    activeOpacity={0.7}
                  >
                    <Receipt size={32} color={Colors.primary[400]} />
                    <Text style={styles.photoUploadText}>영수증 촬영 / 업로드</Text>
                    <Text style={styles.photoUploadSub}>카메라 촬영 또는 갤러리에서 선택</Text>
                  </TouchableOpacity>
                )
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
                  {!selectedMood
                    ? '기분을 먼저 선택해주세요'
                    : checkInMode === 'receipt'
                    ? (receiptUri ? '영수증 인증 체크인 ✓' : '영수증을 첨부해주세요')
                    : checkInMode === 'gps'
                    ? (isNearby ? `GPS 체크인 (${Math.round(distanceM!)}m)` : distanceM !== null ? `너무 멀어요 (${Math.round(distanceM)}m)` : '위치 권한이 필요해요')
                    : receiptUri
                    ? '영수증 인증 체크인 ✓'
                    : isNearby
                    ? `GPS 체크인 (${Math.round(distanceM!)}m)`
                    : distanceM !== null
                    ? `너무 멀어요 (${Math.round(distanceM)}m) — 영수증 첨부 필요`
                    : '위치 권한 없음 — 영수증을 첨부해주세요'}
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
  photoUploadSub: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
    marginTop: 2,
  },

  // 섹션 헤더 (라벨 + 배지)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  requiredBadge: {
    backgroundColor: Colors.primary[500],
  },
  gpsBadge: {
    backgroundColor: '#16a34a',
  },
  optionalBadge: {
    backgroundColor: Colors.gray[400],
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  optionalText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },

  // GPS 상태
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  gpsStatusOk: { backgroundColor: 'rgba(22,163,74,0.08)' },
  gpsStatusWarn: { backgroundColor: 'rgba(217,119,6,0.08)' },
  gpsStatusFail: { backgroundColor: 'rgba(0,0,0,0.04)' },
  gpsStatusText: { fontSize: FontSize.xs, flex: 1 },
  gpsStatusTextOk: { color: '#16a34a' },
  gpsStatusTextWarn: { color: '#d97706' },
  gpsStatusTextFail: { color: Colors.gray[400] },

  // 영수증 안내 문구
  receiptHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(152,16,250,0.06)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  receiptHintText: {
    fontSize: FontSize.xs,
    color: Colors.primary[600],
    flex: 1,
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
