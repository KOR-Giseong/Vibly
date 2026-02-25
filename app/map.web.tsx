import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';

export default function MapScreenWeb() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScreenTransition>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.gray[700]} />
        </TouchableOpacity>

        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <MapPin size={36} color={Colors.primary[400]} />
          </View>
          <Text style={styles.title}>지도는 앱에서 사용 가능해요</Text>
          <Text style={styles.desc}>
            Vibly 앱을 설치하면{'\n'}주변 장소를 지도에서 확인할 수 있어요
          </Text>
        </View>
      </View>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  backBtn: {
    margin: Spacing['2xl'],
    width: 44, height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
    ...Shadow.sm,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing['3xl'],
  },
  iconWrap: {
    width: 80, height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    textAlign: 'center',
  },
  desc: {
    fontSize: FontSize.base,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
});
