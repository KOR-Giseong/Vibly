import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@constants/theme';
import { SvgProps } from 'react-native-svg';
import TwinkleIcon from '@assets/Twinkle.svg';
import PositionPointIcon from '@assets/Position Point.svg';
import LoveIcon from '@assets/Love.svg';

// ─── 슬라이드 데이터 ────────────────────────────────────────────────────────
const SLIDES: {
  icon: React.FC<SvgProps>;
  title: string;
  desc: string;
  gradient: readonly [string, string, string];
}[] = [
  {
    icon: TwinkleIcon,
    title: '당신의 감정을\n이해합니다',
    desc: 'AI가 당신의 기분을 분석하고\n완벽한 장소를 추천해드려요',
    gradient: ['#F3E8FF', '#FCE7F3', '#FAF5FF'],
  },
  {
    icon: PositionPointIcon,
    title: '새로운 장소를\n발견하세요',
    desc: '주변의 숨겨진 명소와\n감성 넘치는 공간을 찾아보세요',
    gradient: ['#DBEAFE', '#F3E8FF', '#FDF2F8'],
  },
  {
    icon: LoveIcon,
    title: '당신만의\n바이브 저장하기',
    desc: '특별한 순간을 기록하고\n감정의 여정을 저장하세요',
    gradient: ['#FCE7F3', '#FFE4E6', '#FAF5FF'],
  },
];

// ─── 슬라이드 아이템 ────────────────────────────────────────────────────────
const SlideItem = ({ item }: { item: typeof SLIDES[number] }) => (
  <LinearGradient
    colors={item.gradient}
    style={StyleSheet.absoluteFill}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    <View style={styles.slideContent}>
      <View style={styles.iconWrap}>
        <item.icon width={64} height={64} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDesc}>{item.desc}</Text>
    </View>
  </LinearGradient>
);

// ─── 페이지 인디케이터 ────────────────────────────────────────────────────────
const PageDots = ({ total, current }: { total: number; current: number }) => (
  <View style={styles.dots}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
    ))}
  </View>
);

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // 애니메이션 값
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const isLast = currentIndex === SLIDES.length - 1;

  // 슬라이드 전환 애니메이션: 페이드아웃+위로 → 인덱스 변경 → 아래서 페이드인
  const animateTransition = (onMidpoint: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onMidpoint();
      translateYAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (!isLast) {
      animateTransition(() => setCurrentIndex(prev => prev + 1));
    } else {
      animateTransition(() => router.replace('/(auth)/login'));
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/* 슬라이드 (애니메이션 적용) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          },
        ]}
      >
        <SlideItem item={SLIDES[currentIndex]} />
      </Animated.View>

      {/* 건너뛰기 - 오른쪽 상단 */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: insets.top + Spacing.lg }]}
          onPress={handleSkip}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>
      )}

      {/* 하단 컨트롤 */}
      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + Spacing['2xl'] }]}>
        <PageDots total={SLIDES.length} current={currentIndex} />

        <TouchableOpacity
          style={[styles.nextBtn, { width: width - Spacing['2xl'] * 2 }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#9810FA', '#E60076']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.lg }]}
          />
          <Text style={styles.nextText}>
            {isLast ? '시작하기' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── 스타일 ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  iconWrap: {
    width: 128,
    height: 128,
    borderRadius: BorderRadius['3xl'],
    backgroundColor: '#FFFFFF66',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['3xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: FontWeight.bold,
    color: '#101828',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: Spacing.lg,
  },
  slideDesc: {
    fontSize: FontSize.md,
    color: '#4A5565',
    textAlign: 'center',
    lineHeight: 26,
  },

  // 건너뛰기
  skipBtn: {
    position: 'absolute',
    right: Spacing['2xl'],
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  skipText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: '#6A7282',
  },

  // 하단
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.xl,
  },

  // 페이지 인디케이터
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: '#D1D5DC',
  },
  dotActive: {
    width: 32,
    backgroundColor: '#9810FA',
  },

  // 다음 버튼
  nextBtn: {
    height: 56,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  nextText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
