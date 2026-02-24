import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MOODS } from '@constants/theme';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '@constants/theme';
import type { Mood } from '@/types';

interface MoodSelectorProps {
  selectedMood: Mood | null;
  onSelect: (mood: Mood) => void;
}

export function MoodSelector({ selectedMood, onSelect }: MoodSelectorProps) {
  return (
    <View style={styles.grid}>
      {MOODS.map((mood) => {
        const isSelected = selectedMood?.value === mood.value;
        return (
          <TouchableOpacity
            key={mood.value}
            onPress={() => onSelect(mood)}
            activeOpacity={0.8}
            style={styles.itemWrapper}
          >
            {isSelected ? (
              <LinearGradient
                colors={mood.gradient}
                style={styles.item}
              >
                <Text style={styles.emoji}>{mood.emoji}</Text>
                <Text style={[styles.label, styles.labelSelected]}>{mood.label}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.item, styles.itemDefault]}>
                <Text style={styles.emoji}>{mood.emoji}</Text>
                <Text style={styles.label}>{mood.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  itemWrapper: {
    width: '30%',
  },
  item: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
  },
  itemDefault: {
    backgroundColor: Colors.white,
  },
  emoji: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  labelSelected: {
    color: Colors.white,
  },
});
