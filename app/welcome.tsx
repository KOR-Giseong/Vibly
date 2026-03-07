import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@stores/auth.store';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';

const FEATURES = [
  { emoji: '🗺️', title: '무드 기반 탐색', desc: '지금 기분에 딱 맞는 공간을 찾아요!' },
  { emoji: '✨', title: '바이브 큐레이션', desc: '취향에 맞는 장소만 골라드려요!' },
  { emoji: '📍', title: '체크인 & 기록', desc: '방문한 공간의 기억을 남겨요!' },
];

// 아이콘(0), 타이틀(1), 서브타이틀(2), 피쳐 3개(3~5), 버튼(6) — 총 7개
const ITEM_COUNT = 7;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const anims = useRef(
    Array.from({ length: ITEM_COUNT }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(28),
    }))
  ).current;

  useEffect(() => {
    Animated.stagger(
      110,
      anims.map(({ opacity, translateY }) =>
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1, duration: 480, useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0, damping: 16, stiffness: 140, useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, []);

  const anim = (i: number) => ({
    opacity: anims[i].opacity,
    transform: [{ translateY: anims[i].translateY }],
  });

  const displayName = user?.nickname ?? user?.name ?? '';

  return (
    <ScreenTransition>
    <LinearGradient
      colors={['#FAF5FF', '#FDF2F8', '#EFF6FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={[
        styles.container,
        { paddingTop: insets.top + Spacing['2xl'], paddingBottom: insets.bottom + Spacing['3xl'] },
      ]}>
        {/* 앱 로고 */}
        <Animated.View style={[styles.iconWrap, anim(0)]}>
          <Image
            source={require('@assets/Logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 타이틀 */}
        <Animated.Text style={[styles.title, anim(1)]}>
          {displayName}님, 환영해요! 🎉
        </Animated.Text>

        {/* 서브타이틀 */}
        <Animated.Text style={[styles.subtitle, anim(2)]}>
          Vibly와 함께 특별한 공간을{'\n'}발견해보세요!
        </Animated.Text>

        {/* 피쳐 카드 */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <Animated.View key={f.title} style={[styles.featureCard, anim(3 + i)]}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* 시작 버튼 */}
        <Animated.View style={[styles.btnWrap, anim(6)]}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.lg }]}
            />
            <Text style={styles.btnText}>Vibly 시작하기</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrap: {
    marginBottom: Spacing.xl,
  },
  logoImage: {
    width: 120,
    height: 120,
  },

  title: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['3xl'],
  },

  features: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing['3xl'],
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  featureIconWrap: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[800],
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FontSize.sm,
    color: Colors.gray[500],
  },

  btnWrap: {
    width: '100%',
  },
  btn: {
    height: 56,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
