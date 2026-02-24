import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { Colors, BorderRadius, Shadow } from '@constants/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'glass' | 'elevated';
  children: React.ReactNode;
}

export function Card({ variant = 'default', style, children, ...props }: CardProps) {
  return (
    <View style={[styles.base, variantStyles[variant], style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius['3xl'],
    overflow: 'hidden',
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    ...Shadow.sm,
  },
  elevated: {
    backgroundColor: Colors.white,
    ...Shadow.md,
  },
});
