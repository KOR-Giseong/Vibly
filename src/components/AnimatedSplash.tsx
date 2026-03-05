import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '@constants/theme';

const LETTERS = ['V', 'i', 'b', 'l', 'y'];

export default function AnimatedSplash() {
  const anims = useRef(
    LETTERS.map(() => ({
      translateY: new Animated.Value(50),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.6),
    })),
  ).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const letterAnims = LETTERS.map((_, i) =>
      Animated.parallel([
        Animated.spring(anims[i].translateY, {
          toValue: 0,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(anims[i].opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(anims[i].scale, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.sequence([
      Animated.stagger(90, letterAnims),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
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
  },
  letter: {
    fontSize: 58,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 1,
  },
  tagline: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#A78BFA',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
