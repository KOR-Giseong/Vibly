import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Coins } from 'lucide-react-native';
import { useCreditStore } from '@stores/credit.store';
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '@constants/theme';

interface CreditDisplayProps {
  /** 탭 시 크레딧 페이지로 이동 여부 (기본 true) */
  tappable?: boolean;
  size?: 'sm' | 'md';
}

export function CreditDisplay({ tappable = true, size = 'md' }: CreditDisplayProps) {
  const router = useRouter();
  const { credits, isPremium } = useCreditStore();

  const isSm = size === 'sm';

  const handlePress = () => {
    if (tappable) router.push('/credits');
  };

  return (
    <TouchableOpacity
      style={[styles.wrap, isSm && styles.wrapSm, isPremium && styles.wrapPremium]}
      onPress={handlePress}
      activeOpacity={tappable ? 0.7 : 1}
    >
      {isPremium ? (
        <Text style={[styles.icon, isSm && styles.iconSm]}>♾️</Text>
      ) : (
        <Coins size={isSm ? 13 : 15} color="#F59E0B" strokeWidth={2} />
      )}
      <Text style={[styles.text, isSm && styles.textSm, isPremium && styles.textPremium]}>
        {isPremium ? '구독중' : credits.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...Shadow.sm,
  },
  wrapSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  wrapPremium: {
    backgroundColor: '#F3E8FF',
    borderColor: '#E9D5FF',
  },
  icon: {
    fontSize: 13,
  },
  iconSm: {
    fontSize: 11,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#92400E',
  },
  textSm: {
    fontSize: FontSize.xs,
  },
  textPremium: {
    color: '#7C3AED',
  },
});
