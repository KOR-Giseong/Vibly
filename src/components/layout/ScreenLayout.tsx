import React from 'react';
import { View, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@constants/theme';

interface ScreenLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  withGradientBg?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function ScreenLayout({
  children,
  scrollable = true,
  withGradientBg = true,
  style,
  contentStyle,
}: ScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {withGradientBg && (
        <LinearGradient
          colors={Gradients.background}
          style={StyleSheet.absoluteFill}
        />
      )}
      {scrollable ? (
        <ScrollView
          style={[styles.scroll, style]}
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, style, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
  fill:   { flex: 1 },
});
