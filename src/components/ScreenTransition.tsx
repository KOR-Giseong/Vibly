import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
}

/**
 * 모든 화면에서 사용하는 진입 애니메이션 래퍼.
 * 화면이 마운트될 때 fade-in + spring slide-up 효과를 줍니다.
 */
export default function ScreenTransition({ children }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withSpring(0, {
      damping: 22,
      stiffness: 280,
      mass: 0.7,
    });
  }, []);

  const style = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
