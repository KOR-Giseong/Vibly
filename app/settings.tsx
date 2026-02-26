import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as ExpoNotifications from 'expo-notifications';
import {
  ArrowLeft,
  ChevronRight,
  Bell,
  User,
  Lock,
  Globe,
  HelpCircle,
  FileText,
  Shield,
  Settings as SettingsIcon,
  ExternalLink,
  LogOut,
  Trash2,
  X,
} from 'lucide-react-native';
import { Colors, Gradients, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@constants/theme';
import { useAuth } from '@hooks/useAuth';
import { authService } from '@services/auth.service';

const ADMIN_WEB_URL = 'https://admin.vibly.app';

// ─── 설정 행 컴포넌트 ─────────────────────────────────────────────────────────

// ─── 설정 행 컴포넌트 ─────────────────────────────────────────────────────────

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

function SettingRow({ icon, label, onPress, rightElement, destructive }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, destructive && styles.iconContainerDestructive]}>
          {icon}
        </View>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
      </View>
      {rightElement ?? (onPress && <ChevronRight size={18} color={Colors.gray[400]} />)}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

// ─── 비밀번호 변경 모달 ──────────────────────────────────────────────────────

function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!currentPw || !newPw || !confirmPw) { Alert.alert('입력 오류', '모든 항목을 입력해 주세요.'); return; }
    if (newPw !== confirmPw) { Alert.alert('입력 오류', '새 비밀번호가 일치하지 않아요.'); return; }
    if (newPw.length < 8) { Alert.alert('입력 오류', '비밀번호는 8자 이상이어야 해요.'); return; }
    setLoading(true);
    try {
      await authService.changePassword(currentPw, newPw);
      Alert.alert('완료', '비밀번호가 변경되었어요.', [{ text: '확인', onPress: onClose }]);
    } catch (err: any) {
      Alert.alert('오류', err?.response?.data?.message ?? '비밀번호 변경에 실패했어요.');
    } finally { setLoading(false); }
  }, [currentPw, newPw, confirmPw, onClose]);

  const handleClose = () => { setCurrentPw(''); setNewPw(''); setConfirmPw(''); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>비밀번호 변경</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={20} color={Colors.gray[600]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.inputLabel}>현재 비밀번호</Text>
          <TextInput style={styles.input} value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholder="현재 비밀번호 입력" placeholderTextColor={Colors.gray[400]} autoCapitalize="none" />
          <Text style={styles.inputLabel}>새 비밀번호</Text>
          <TextInput style={styles.input} value={newPw} onChangeText={setNewPw} secureTextEntry placeholder="8자 이상" placeholderTextColor={Colors.gray[400]} autoCapitalize="none" />
          <Text style={styles.inputLabel}>새 비밀번호 확인</Text>
          <TextInput style={styles.input} value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder="비밀번호 재입력" placeholderTextColor={Colors.gray[400]} autoCapitalize="none" />
          <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.submitButtonText}>변경하기</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleNotificationToggle = useCallback(async (value: boolean) => {
    if (value) {
      const { status } = await ExpoNotifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('알림 권한 필요', '설정 앱에서 Vibly의 알림 권한을 허용해 주세요.', [
          { text: '취소', style: 'cancel' },
          { text: '설정 열기', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
    }
    setNotificationsEnabled(value);
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert('계정 삭제', '모든 데이터가 영구적으로 삭제됩니다. 정말 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제하기',
        style: 'destructive',
        onPress: () =>
          Alert.alert('최종 확인', '이 작업은 되돌릴 수 없습니다. 계속하시겠어요?', [
            { text: '취소', style: 'cancel' },
            {
              text: '영구 삭제',
              style: 'destructive',
              onPress: async () => {
                try {
                  await authService.deleteAccount();
                  router.replace('/(auth)/login');
                } catch { Alert.alert('오류', '계정 삭제에 실패했어요.'); }
              },
            },
          ]),
      },
    ]);
  }, [router]);

  const openAdminWeb = useCallback(() => Linking.openURL(ADMIN_WEB_URL), []);
  const handleLanguage = useCallback(() => {
    Alert.alert('언어 설정', '현재 한국어만 지원합니다.\n글로벌 버전에서 다국어를 지원할 예정이에요.', [{ text: '확인' }]);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Gradients.background} style={styles.gradient}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>설정</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* 계정 */}
          <Section title="계정">
            <SettingRow icon={<User size={18} color={Colors.primary[600]} />} label="프로필 수정" onPress={() => router.push('/profile-edit')} />
            <View style={styles.divider} />
            <SettingRow icon={<Lock size={18} color={Colors.primary[600]} />} label="비밀번호 변경" onPress={() => setShowPasswordModal(true)} />
            <View style={styles.divider} />
            <SettingRow
              icon={<Globe size={18} color={Colors.primary[600]} />}
              label="언어 설정"
              onPress={handleLanguage}
              rightElement={
                <View style={styles.badgeRow}>
                  <Text style={styles.badgeText}>한국어</Text>
                  <ChevronRight size={18} color={Colors.gray[400]} />
                </View>
              }
            />
          </Section>

          {/* 알림 */}
          <Section title="알림">
            <SettingRow
              icon={<Bell size={18} color={Colors.primary[600]} />}
              label="푸시 알림"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: Colors.gray[200], true: Colors.primary[500] }}
                  thumbColor={Colors.white}
                  ios_backgroundColor={Colors.gray[200]}
                />
              }
            />
          </Section>

          {/* 지원 */}
          <Section title="지원">
            <SettingRow icon={<HelpCircle size={18} color={Colors.primary[600]} />} label="고객센터" onPress={() => router.push('/support')} />
            <View style={styles.divider} />
            <SettingRow
              icon={<FileText size={18} color={Colors.primary[600]} />}
              label="서비스 약관"
              onPress={() => router.push('/terms')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Shield size={18} color={Colors.primary[600]} />}
              label="개인정보 처리방침"
              onPress={() => router.push('/privacy')}
            />
          </Section>

          {/* 관리자 (isAdmin만) */}
          {user?.isAdmin && (
            <Section title="관리자">
              <SettingRow
                icon={<SettingsIcon size={18} color="#9810FA" />}
                label="관리자 웹"
                onPress={openAdminWeb}
                rightElement={
                  <View style={styles.badgeRow}>
                    <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>
                    <ExternalLink size={14} color={Colors.gray[400]} />
                  </View>
                }
              />
            </Section>
          )}

          {/* 앱 정보 */}
          <View style={styles.appInfoCard}>
            <Image
              source={require('../assets/Logo2.png')}
              style={styles.appInfoLogo}
              resizeMode="contain"
            />
            <Text style={styles.appInfoVersion}>버전 {appVersion}</Text>
            <Text style={styles.appInfoCopyright}>© 2025 Vibly. All rights reserved.</Text>
          </View>

          {/* 로그아웃 */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={18} color={Colors.primary[600]} />
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>

          {/* 계정 삭제 */}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount} activeOpacity={0.8}>
            <Trash2 size={14} color={Colors.gray[400]} />
            <Text style={styles.deleteText}>계정 삭제</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>

      <ChangePasswordModal visible={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  headerRight: { width: 36 },

  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.md,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: {
    width: 34, height: 34,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center', alignItems: 'center',
  },
  iconContainerDestructive: { backgroundColor: '#FEF2F2' },
  rowLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text.primary },
  rowLabelDestructive: { color: '#EF4444' },
  divider: { height: 1, backgroundColor: Colors.gray[100], marginLeft: Spacing.lg + 34 + 12 },

  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { fontSize: FontSize.xs, color: Colors.text.muted },

  adminBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  adminBadgeText: { fontSize: 10, fontWeight: FontWeight.bold, color: '#9810FA' },

  appInfoCard: { alignItems: 'center', marginBottom: Spacing['2xl'], paddingVertical: Spacing.xl },
  appInfoLogo: { width: 200, height: 68, marginBottom: Spacing.sm },  
  appInfoVersion: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: 4 },
  appInfoCopyright: { fontSize: FontSize.xs, color: Colors.text.muted },

  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  logoutText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary[600] },

  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md },
  deleteText: { fontSize: FontSize.xs, color: Colors.gray[400] },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing['2xl'],
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing['2xl'],
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },

  inputLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.text.secondary, marginBottom: 6, marginTop: Spacing.md },
  input: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  inputTextarea: { height: 120, paddingTop: 12 },
  charCount: { fontSize: 11, color: Colors.text.muted, textAlign: 'right', marginTop: 4 },
  supportDesc: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: Spacing.sm, lineHeight: 20 },

  submitButton: { backgroundColor: Colors.primary[600], borderRadius: BorderRadius.lg, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.xl },
  submitButtonDisabled: { backgroundColor: Colors.gray[300] },
  submitButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.white },
});
