import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Gradients } from '@constants/theme';

const LETTERS = ['V', 'i', 'b', 'l', 'y'];

// ── 점 애니메이션 로딩 텍스트 ───────────────────────────────────────────────
function LoadingDots() {
  const dotOpacities = useRef([
    new Animated.Value(0.2),
    new Animated.Value(0.2),
    new Animated.Value(0.2),
  ]).current;

  useEffect(() => {
    const animate = (anim: Animated.Value) =>
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.2, duration: 400, useNativeDriver: true }),
      ]);

    const loop = Animated.loop(
      Animated.stagger(200, dotOpacities.map(animate)),
    );
    loop.start();
    return () => loop.stop();
  }, [dotOpacities]);

  return (
    <View style={styles.loadingRow}>
      <Text style={styles.loadingText}>리소스 불러오는 중</Text>
      {dotOpacities.map((opacity, i) => (
        <Animated.Text key={i} style={[styles.loadingDot, { opacity }]}>
          .
        </Animated.Text>
      ))}
    </View>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  /** API 로딩이 아직 완료되지 않았으면 true → 로딩 인디케이터 표시 */
  isLoading?: boolean;
  /** 애니메이션 완료 && 로딩 완료 시 호출 */
  onFinish?: () => void;
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function AnimatedSplash({ isLoading = false, onFinish }: Props) {
  const [animDone, setAnimDone] = useState(false);

  const letterAnims = useRef(
    LETTERS.map(() => ({
      translateY: new Animated.Value(80),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3),
    })),
  ).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;

  // 애니메이션 완료 && 로딩 완료 → onFinish
  useEffect(() => {
    if (!animDone || isLoading) return;
    Animated.timing(loadingOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setTimeout(() => onFinish?.(), 100));
  }, [animDone, isLoading, loadingOpacity, onFinish]);

  // 애니메이션 완료 && 아직 로딩 중 → 인디케이터 페이드인
  useEffect(() => {
    if (!animDone || !isLoading) return;
    Animated.timing(loadingOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [animDone, isLoading, loadingOpacity]);

  // 메인 입장 애니메이션
  useEffect(() => {
    const anims = LETTERS.map((_, i) =>
      Animated.parallel([
        Animated.spring(letterAnims[i].translateY, {
          toValue: 0,
          friction: 3,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(letterAnims[i].opacity, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(letterAnims[i].scale, {
          toValue: 1,
          friction: 3,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.sequence([
      Animated.stagger(110, anims),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => setAnimDone(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LinearGradient
      colors={Gradients.background}
      style={styles.container}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
    >
      {/* 로고 + 태그라인 */}
      <View style={styles.centerContent}>
        <MaskedView
          style={styles.maskedView}
          maskElement={
            <View style={styles.lettersRow}>
              {LETTERS.map((letter, i) => (
                <Animated.Text
                  key={letter + i}
                  style={[
                    styles.letter,
                    {
                      opacity: letterAnims[i].opacity,
                      transform: [
                        { translateY: letterAnims[i].translateY },
                        { scale: letterAnims[i].scale },
                      ],
                    },
                  ]}
                >
                  {letter}
                </Animated.Text>
              ))}
            </View>
          }
        >
          <LinearGradient
            colors={['#9810FA', '#E60076']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Vibe Together
        </Animated.Text>
      </View>

      {/* 리소스 로딩 인디케이터 - 애니메이션 완료 후 API 대기 중일 때만 노출 */}
      <Animated.View style={[styles.loadingContainer, { opacity: loadingOpacity }]}>
        <LoadingDots />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
  },
  maskedView: {
    alignSelf: 'center',
    height: 90,
    width: 300,
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: 90,
    width: 300,
  },
  letter: {
    fontSize: 64,
    fontWeight: '800',
    color: '#000',
    includeFontPadding: false,
  },
  tagline: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
    color: '#A78BFA',
    letterSpacing: 5,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#C4B5FD',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  loadingDot: {
    fontSize: 14,
    color: '#C4B5FD',
    lineHeight: 16,
    marginLeft: 1,
  },
});
