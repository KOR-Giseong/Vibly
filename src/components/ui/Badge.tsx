import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '@constants/theme';

type BadgeVariant = 'primary' | 'pink' | 'blue' | 'gray';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  return (
    <View style={[styles.base, variantStyles[variant].bg]}>
      <Text style={[styles.text, variantStyles[variant].text]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});

const variantStyles = {
  primary: StyleSheet.create({
    bg:   { backgroundColor: Colors.primary[100] },
    text: { color: Colors.primary[700] },
  }),
  pink: StyleSheet.create({
    bg:   { backgroundColor: Colors.pink[100] },
    text: { color: Colors.pink[600] },
  }),
  blue: StyleSheet.create({
    bg:   { backgroundColor: '#EFF6FF' },
    text: { color: '#1D4ED8' },
  }),
  gray: StyleSheet.create({
    bg:   { backgroundColor: Colors.gray[100] },
    text: { color: Colors.gray[600] },
  }),
};
