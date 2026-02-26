/**
 * LocationPermissionModal
 *
 * 위치 권한이 거부됐을 때 표시되는 바텀 시트 스타일 모달.
 * - canAskAgain=true  → "권한 허용하기" (requestPermission)
 * - canAskAgain=false → "설정 열기"     (Linking.openSettings)
 * - "나중에 하기" → 모달 닫기 (onDismiss)
 *
 * 사용처: map.tsx, (tabs)/index.tsx 등 위치가 필요한 모든 화면
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Settings } from 'lucide-react-native';
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
  Gradients,
} from '@constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LocationPermissionModalProps {
  /** 모달 표시 여부 (locationStatus === 'denied' 일 때 true) */
  visible: boolean;
  /** 사용자가 "나중에 하기"를 누를 때 호출 */
  onDismiss: () => void;
  /** 권한 재요청 (canAskAgain=true 일 때) */
  onRequestPermission: () => void;
  /** 설정 앱 열기 (canAskAgain=false 일 때) */
  onOpenSettings: () => void;
  /** OS가 다시 권한을 물을 수 있는 상태인지 */
  canAskAgain: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LocationPermissionModal({
  visible,
  onDismiss,
  onRequestPermission,
  onOpenSettings,
  canAskAgain,
}: LocationPermissionModalProps) {
  /** 카드가 아래에서 올라오는 슬라이드 애니메이션 */
  const slideY = useRef(new Animated.Value(300)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0,
          damping: 20,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideY.setValue(300);
      backdropOpacity.setValue(0);
    }
  }, [visible, slideY, backdropOpacity]);

  const handlePrimaryAction = () => {
    if (canAskAgain) {
      onRequestPermission();
    } else {
      onOpenSettings();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* 반투명 배경 */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onDismiss} />
      </Animated.View>

      {/* 카드 (아래에서 슬라이드 업) */}
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.card, { transform: [{ translateY: slideY }] }]}>
          {/* 드래그 핸들 */}
          <View style={styles.handle} />

          {/* 아이콘 */}
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.iconBg}
          >
            <MapPin size={36} color={Colors.white} strokeWidth={2} />
          </LinearGradient>

          {/* 텍스트 */}
          <Text style={styles.title}>위치 권한이 필요해요</Text>
          <Text style={styles.description}>
            주변 감성 장소를 추천해드리려면{'\n'}
            위치 정보 접근 권한이 필요합니다.{'\n\n'}
            {canAskAgain
              ? '아래 버튼을 눌러 권한을 허용해 주세요.'
              : `기기 설정에서 Vibly 앱의\n위치 권한을 '앱 사용 중 허용'으로 변경해 주세요.`}
          </Text>

          {/* 개인정보 안내 */}
          <View style={styles.privacyBadge}>
            <Text style={styles.privacyText}>
              🔒 위치 정보는 장소 추천에만 사용되며, 서버에 저장되지 않아요
            </Text>
          </View>

          {/* 버튼 영역 */}
          <View style={styles.buttonGroup}>
            {/* Primary 버튼 */}
            <TouchableOpacity
              style={styles.primaryBtnWrapper}
              onPress={handlePrimaryAction}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                {canAskAgain ? null : (
                  <Settings
                    size={18}
                    color={Colors.white}
                    style={{ marginRight: Spacing.sm }}
                  />
                )}
                <Text style={styles.primaryBtnText}>
                  {canAskAgain ? '권한 허용하기' : '설정 열기'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary 버튼 */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryBtnText}>나중에 하기</Text>
            </TouchableOpacity>
          </View>

          {/* iOS safe area 여백 */}
          {Platform.OS === 'ios' && <View style={{ height: 12 }} />}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /** 반투명 배경 */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  /** 카드를 하단에 고정하기 위한 래퍼 */
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  /** 메인 카드 */
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing['3xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    alignItems: 'center',
    ...Shadow.lg,
  },

  /** 드래그 핸들 */
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[200],
    marginBottom: Spacing['2xl'],
  },

  /** 아이콘 배경 원 */
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
    ...Shadow.lg,
  },

  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  description: {
    fontSize: FontSize.md,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },

  /** 개인정보 안내 뱃지 */
  privacyBadge: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing['2xl'],
    alignSelf: 'stretch',
  },
  privacyText: {
    fontSize: 11,
    color: Colors.primary[600],
    textAlign: 'center',
    lineHeight: 18,
  },

  buttonGroup: {
    width: '100%',
    gap: Spacing.sm,
  },

  // Primary
  primaryBtnWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  primaryBtn: {
    height: 54,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },

  // Secondary
  secondaryBtn: {
    height: 54,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  secondaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.gray[600],
  },
});
