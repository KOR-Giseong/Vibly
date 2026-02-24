import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Bell, MapPin, Shield, HelpCircle, Info } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { useAuth } from '@hooks/useAuth';

const SECTIONS = [
  {
    title: '계정',
    items: [
      { label: '알림 설정', icon: Bell,      type: 'toggle', key: 'notifications' },
      { label: '위치 서비스', icon: MapPin,  type: 'toggle', key: 'location'      },
      { label: '개인정보 보호', icon: Shield, type: 'nav',    route: '/settings'  },
    ],
  },
  {
    title: '지원',
    items: [
      { label: '도움말', icon: HelpCircle, type: 'nav', route: '/settings' },
      { label: '앱 정보', icon: Info,      type: 'nav', route: '/settings' },
    ],
  },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [toggles, setToggles] = React.useState({ notifications: true, location: true });

  const toggle = (key: keyof typeof toggles) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.row, i < section.items.length - 1 && styles.rowDivider]}
                  onPress={() => item.type === 'nav' && router.push(item.route as any)}
                  activeOpacity={item.type === 'toggle' ? 1 : 0.7}
                >
                  <View style={styles.rowLeft}>
                    <View style={styles.iconWrap}>
                      <item.icon size={16} color={Colors.primary[600]} />
                    </View>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                  </View>
                  {item.type === 'toggle' ? (
                    <Switch
                      value={toggles[item.key as keyof typeof toggles]}
                      onValueChange={() => toggle(item.key as keyof typeof toggles)}
                      trackColor={{ false: Colors.gray[200], true: Colors.primary[400] }}
                      thumbColor={Colors.white}
                    />
                  ) : (
                    <ChevronRight size={18} color={Colors.gray[400]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Vibly v1.0.0</Text>
          <Text style={styles.copyright}>© 2025 Vibly. All rights reserved.</Text>
        </View>

        {/* Danger Zone */}
        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <TouchableOpacity style={[styles.row, styles.rowDivider]} onPress={logout} activeOpacity={0.7}>
              <Text style={styles.dangerText}>로그아웃</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} activeOpacity={0.7}>
              <Text style={styles.dangerText}>계정 삭제</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  scroll: { paddingHorizontal: Spacing['2xl'] },
  sectionWrap: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.gray[500], marginBottom: Spacing.sm, marginLeft: Spacing.xs },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], overflow: 'hidden', ...Shadow.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: FontSize.md, color: Colors.gray[900], fontWeight: FontWeight.medium },
  appInfo: { alignItems: 'center', marginBottom: Spacing.xl },
  appVersion: { fontSize: FontSize.sm, color: Colors.gray[500] },
  copyright: { fontSize: FontSize.xs, color: Colors.gray[400], marginTop: 4 },
  dangerText: { fontSize: FontSize.md, color: '#EF4444', fontWeight: FontWeight.medium },
});
