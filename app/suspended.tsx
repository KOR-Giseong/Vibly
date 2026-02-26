/**
 * SuspendedScreen
 *
 * 계정이 일시 정지된 사용자에게 표시되는 화면.
 * - 정지 사유 / 정지 기간 표시
 * - 고객센터 문의 → /support
 * - 로그아웃 버튼 (다른 계정으로 전환 가능)
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ShieldOff, MessageCircle, BookOpen, LogOut } from 'lucide-react-native';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, Gradients,
} from '@constants/theme';
import { useAuthStore } from '@stores/auth.store';
import { authService } from '@services/auth.service';

// 가이드라인 URL (추후 실제 URL로 교체)
const GUIDELINE_URL = 'https://vibly.app/guidelines';

// ─── 날짜 포맷 ────────────────────────────────────────────────────────────────

function formatSuspendedUntil(iso?: string | null): string {
  if (!iso) return '기간 미정';
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuspendedScreen() {
  const router = useRouter();
  const { user, reset } = useAuthStore();

  const handleContact = () => {
    router.push('/support');
  };

  const handleGuideline = () => {
    Linking.openURL(GUIDELINE_URL).catch(() => {});
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch { /* 무시 */ }
    reset();
    router.replace('/auth');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient colors={Gradients.background} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* 로고 아이콘 */}
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={['#FEF2F2', '#FFF1F2']}
              style={styles.iconBg}
            >
              <ShieldOff size={44} color="#EF4444" strokeWidth={1.8} />
            </LinearGradient>
          </View>

          {/* 제목 */}
          <Text style={styles.title}>계정이 일시 정지되었습니다</Text>

          {/* 정지 사유 카드 */}
          <View style={[styles.infoCard, styles.infoCardRed]}>
            <Text style={styles.infoLabel}>정지 사유</Text>
            <Text style={styles.infoValueRed}>
              {user?.suspendReason ?? '커뮤니티 가이드라인 위반'}
            </Text>
          </View>

          {/* 정지 기간 카드 */}
          <View style={[styles.infoCard, styles.infoCardBlue]}>
            <Text style={styles.infoLabelBlue}>정지 기간</Text>
            <Text style={styles.infoValueBlue}>
              {formatSuspendedUntil(user?.suspendedUntil)}까지
            </Text>
            <Text style={styles.infoSubBlue}>
              정지 기간이 종료되면 자동으로 계정이 복구됩니다
            </Text>
          </View>

          {/* 안내 문구 */}
          <Text style={styles.guide}>
            이의 제기를 원하시면 고객센터로 문의해 주세요.{'\n'}
            정지 기간이 종료되면 자동으로 계정이 복구됩니다.
          </Text>

          {/* 버튼 그룹 */}
          <View style={styles.btnGroup}>
            {/* 고객센터 문의 */}
            <TouchableOpacity
              style={styles.primaryBtnWrap}
              onPress={handleContact}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <MessageCircle size={18} color={Colors.white} />
                <Text style={styles.primaryBtnText}>고객센터 문의</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* 가이드라인 보기 */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleGuideline}
              activeOpacity={0.75}
            >
              <BookOpen size={16} color={Colors.gray[600]} />
              <Text style={styles.secondaryBtnText}>가이드라인 보기</Text>
            </TouchableOpacity>
          </View>

          {/* 로그아웃 */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={14} color={Colors.gray[400]} />
            <Text style={styles.logoutText}>다른 계정으로 로그인</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing['2xl'],
  },

  // 아이콘
  iconWrap: { marginBottom: Spacing.md },
  iconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    ...Shadow.md,
  },

  // 제목
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    textAlign: 'center',
    lineHeight: 34,
  },

  // 정보 카드
  infoCard: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 1.5,
    gap: 6,
  },
  infoCardRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  infoCardBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },

  infoLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#82181A',
  },
  infoValueRed: {
    fontSize: FontSize.base,
    color: '#C10007',
    lineHeight: 22,
  },
  infoLabelBlue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#1C398E',
  },
  infoValueBlue: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: '#1447E6',
  },
  infoSubBlue: {
    fontSize: FontSize.xs,
    color: '#3B82F6',
    marginTop: 2,
  },

  // 안내 문구
  guide: {
    fontSize: FontSize.sm,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },

  // 버튼 그룹
  btnGroup: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryBtnWrap: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  primaryBtn: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  primaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    ...Shadow.sm,
  },
  secondaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.gray[700],
  },

  // 로그아웃
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  logoutText: {
    fontSize: FontSize.sm,
    color: Colors.gray[400],
  },
});
