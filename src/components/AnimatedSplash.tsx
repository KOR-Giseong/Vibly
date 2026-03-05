import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Gradients } from '@constants/theme';

const LETTERS = ['V', 'i', 'b', 'l', 'y'];

export default function AnimatedSplash() {
  const anims = useRef(
    LETTERS.map(() => ({
      translateY: new Animated.Value(80),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3),
    })),
  ).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const letterAnims = LETTERS.map((_, i) =>
      Animated.parallel([
        Animated.spring(anims[i].translateY, {
          toValue: 0,
          friction: 3,      // 낮을수록 더 많이 튀김
          tension: 120,     // 높을수록 빠르게 반응
          useNativeDriver: true,
        }),
        Animated.timing(anims[i].opacity, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(anims[i].scale, {
          toValue: 1,
          friction: 3,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.sequence([
      Animated.stagger(110, letterAnims),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [anims, taglineOpacity]);

  return (
    <LinearGradient
      colors={Gradients.background}
      style={styles.container}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
    >
      <MaskedView
        maskElement={
          <View style={styles.lettersRow}>
            {LETTERS.map((letter, i) => (
              <Animated.Text
                key={letter + i}
                style={[
                  styles.letter,
                  {
                    opacity: anims[i].opacity,
                    transform: [
                      { translateY: anims[i].translateY },
                      { scale: anims[i].scale },
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
          style={styles.gradientBox}
        />
      </MaskedView>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Vibe Together
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  letter: {
    fontSize: 64,
    fontWeight: '800',
    color: '#000',
    includeFontPadding: false,
  },
  gradientBox: {
    width: 260,
    height: 80,
  },
  tagline: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
    color: '#A78BFA',
    letterSpacing: 5,
    textTransform: 'uppercase',
  },
});
