import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  type TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, BorderRadius, FontSize, FontWeight, Spacing } from '@constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'kakao' | 'apple';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'lg',
  isLoading = false,
  leftIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  const sizeStyle = sizes[size];
  const variantStyle = variants[variant];

  const content = (
    <View style={styles.inner}>
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary[600] : Colors.white} size="small" />
      ) : (
        <>
          {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
          <Text style={[styles.text, sizeStyle.text, variantStyle.text]}>{children}</Text>
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isDisabled}
        style={[styles.base, sizeStyle.container, isDisabled && styles.disabled]}
        {...props}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: sizeStyle.container.borderRadius }]}
        />
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      style={[styles.base, sizeStyle.container, variantStyle.container, isDisabled && styles.disabled]}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { marginRight: Spacing.sm },
  text: {
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  disabled: { opacity: 0.5 },
});

const sizes = {
  sm: {
    container: { borderRadius: BorderRadius.lg,  paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
    text:      { fontSize: FontSize.sm },
  },
  md: {
    container: { borderRadius: BorderRadius.xl,  paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
    text:      { fontSize: FontSize.base },
  },
  lg: {
    container: { borderRadius: BorderRadius['2xl'], paddingVertical: Spacing.lg, paddingHorizontal: Spacing['2xl'] },
    text:      { fontSize: FontSize.md },
  },
} as const;

const variants = {
  primary:   { container: {},                                                                           text: { color: Colors.white } },
  secondary: { container: { backgroundColor: Colors.primary[100] },                                   text: { color: Colors.primary[700] } },
  outline:   { container: { borderWidth: 1.5, borderColor: Colors.gray[200], backgroundColor: Colors.white }, text: { color: Colors.gray[900] } },
  ghost:     { container: { backgroundColor: 'transparent' },                                         text: { color: Colors.primary[600] } },
  kakao:     { container: { backgroundColor: Colors.kakao },                                          text: { color: Colors.gray[900] } },
  apple:     { container: { backgroundColor: Colors.black },                                          text: { color: Colors.white } },
} as const;
