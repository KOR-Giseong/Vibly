import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@constants/theme';

const AI_GRADIENT = ['#9810FA', '#E60076'] as const;

interface AIBannerProps {
  onPress: () => void;
}

export function AIBanner({ onPress }: AIBannerProps) {
  // 진입 애니메이션 (페이드인 + 아래에서 위로)
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const entryY = useRef(new Animated.Value(24)).current;

  // Sparkles 아이콘 반짝임 (스케일 루프)
  const sparkleScale = useRef(new Animated.Value(1)).current;

  // 버튼 눌림 스케일
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 진입 애니메이션
    Animated.parallel([
      Animated.timing(entryOpacity, {
        toValue: 1,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.spring(entryY, {
        toValue: 0,
        delay: 150,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Sparkles 반짝임 루프
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleScale, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(sparkleScale, { toValue: 1,    duration: 700, useNativeDriver: true }),
        Animated.delay(1400),
      ]),
    );
    sparkleLoop.start();
    return () => sparkleLoop.stop();
  }, []);

  const handlePressIn = () =>
    Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ opacity: entryOpacity, transform: [{ translateY: entryY }] }}>
      <LinearGradient
        colors={AI_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: sparkleScale }] }}>
            <Sparkles size={24} color={Colors.white} />
          </Animated.View>
          <Text style={styles.title}>AI 추천</Text>
        </View>

        {/* 설명 */}
        <Text style={styles.description}>
          "조용한 카페에서 책 읽고 싶어"라고 말해보세요
        </Text>

        {/* CTA 버튼 */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={styles.button}
          >
            <Text style={styles.buttonText}>AI에게 물어보기</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['2xl'],
    gap: Spacing.md,
    shadowColor: '#AD46FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
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
