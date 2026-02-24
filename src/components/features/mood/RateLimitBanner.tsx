import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Info } from 'lucide-react-native';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@constants/theme';

const BANNER_COLORS = {
  bg: '#EFF6FF',
  border: '#BEDBFF',
  icon: '#1C398E',
  title: '#1C398E',
  label: '#6B7280',
  value: '#1447E6',
  trackBg: 'rgba(255,255,255,0.5)',
  trackFill: '#155DFC',
} as const;

interface RateLimitBannerProps {
  remaining: number;
  total?: number;
}

export function RateLimitBanner({ remaining, total = 20 }: RateLimitBannerProps) {
  const progress = Math.max(0, Math.min(remaining / total, 1));

  return (
    <View style={styles.container}>
      <Info size={20} color={BANNER_COLORS.icon} />
      <View style={styles.content}>
        <Text style={styles.title}>검색 횟수 안내</Text>

        <Text style={styles.subtitle}>
          <Text style={styles.label}>남은 검색: </Text>
          <Text style={styles.value}>{remaining}회</Text>
          <Text style={styles.label}> / {total}회</Text>
        </Text>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` as any }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: BANNER_COLORS.bg,
    borderWidth: 2,
    borderColor: BANNER_COLORS.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingLeft: Spacing.lg + 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: BANNER_COLORS.title,
  },
  subtitle: {
    fontSize: FontSize.xs,
  },
  label: {
    color: BANNER_COLORS.label,
  },
  value: {
    fontWeight: FontWeight.bold,
    color: BANNER_COLORS.value,
  },
  track: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: BANNER_COLORS.trackBg,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  fill: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: BANNER_COLORS.trackFill,
  },
});
