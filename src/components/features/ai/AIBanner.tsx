import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@constants/theme';

const AI_GRADIENT = ['#9810FA', '#E60076'] as const;

const AI_SHADOW = {
  shadowColor: '#AD46FF',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.3,
  shadowRadius: 15,
  elevation: 15,
};

interface AIBannerProps {
  onPress: () => void;
}

export function AIBanner({ onPress }: AIBannerProps) {
  return (
    <LinearGradient
      colors={AI_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.container, AI_SHADOW]}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Sparkles size={24} color={Colors.white} />
        <Text style={styles.title}>AI 추천</Text>
      </View>

      {/* 설명 */}
      <Text style={styles.description}>
        "조용한 카페에서 책 읽고 싶어"라고 말해보세요
      </Text>

      {/* CTA 버튼 */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.button}>
        <Text style={styles.buttonText}>AI에게 물어보기</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['2xl'],
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  description: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  buttonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
});
