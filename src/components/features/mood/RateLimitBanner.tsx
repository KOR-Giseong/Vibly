import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Coins, Crown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@constants/theme';
import { useCreditStore } from '@stores/credit.store';

// 크레딧 비용 안내 상수
const SEARCH_COST_BASIC = 5;
const SEARCH_COST_AI = 10;

/**
 * 홈 화면 크레딧 안내 배너 (구 RateLimitBanner)
 * - 구독자: 무제한 표시
 * - 비구독자: 보유 크레딧 + 소모 비용 표시
 */
export function RateLimitBanner() {
  const router = useRouter();
  const { credits, isPremium } = useCreditStore();

  if (isPremium) {
    return (
      <View style={[styles.container, styles.premiumContainer]}>
        <Crown size={18} color="#7C3AED" />
        <View style={styles.content}>
          <Text style={[styles.title, styles.premiumTitle]}>구독 중 · 무제한 검색</Text>
          <Text style={[styles.subtitle, { color: '#A78BFA' }]}>AI 검색을 마음껏 사용하세요!</Text>
        </View>
      </View>
    );
  }

  const isLow = credits < SEARCH_COST_BASIC;

  return (
    <TouchableOpacity
      style={[styles.container, isLow && styles.lowContainer]}
      onPress={() => router.push('/credits')}
      activeOpacity={0.8}
    >
      <Coins size={18} color={isLow ? '#DC2626' : '#D97706'} />
      <View style={styles.content}>
        <Text style={[styles.title, isLow && styles.lowTitle]}>
          {isLow ? '크레딧이 부족해요' : `보유 크레딧: ${credits.toLocaleString()}`}
        </Text>
        <Text style={styles.subtitle}>
          기본 검색 {SEARCH_COST_BASIC} · AI 검색 {SEARCH_COST_AI} 소모 · 탭해서 충전
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  premiumContainer: {
    backgroundColor: '#F3E8FF',
    borderColor: '#E9D5FF',
  },
  lowContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  content: { flex: 1, gap: 2 },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#92400E',
  },
  premiumTitle: { color: '#7C3AED' },
  lowTitle: { color: '#DC2626' },
  subtitle: {
    fontSize: FontSize.xs,
    color: '#B45309',
  },
});
