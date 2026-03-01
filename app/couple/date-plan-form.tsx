import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Calendar, FileText } from 'lucide-react-native';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, Gradients,
} from '@constants/theme';
import { coupleService } from '@services/couple.service';

export default function DatePlanFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('알림', '제목을 입력해주세요.'); return; }
    if (!dateStr.trim()) { Alert.alert('알림', '날짜를 입력해주세요. (예: 2025-12-25)'); return; }
    const dateAt = new Date(dateStr);
    if (isNaN(dateAt.getTime())) { Alert.alert('알림', '올바른 날짜 형식을 입력해주세요. (예: 2025-12-25)'); return; }

    setSaving(true);
    try {
      await coupleService.createDatePlan({
        title: title.trim(),
        dateAt: dateAt.toISOString(),
        memo: memo.trim() || undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message ?? '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>데이트 플랜 추가</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.saveBtnText}>저장</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 제목 */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>제목 *</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 한강 피크닉 데이트"
            placeholderTextColor={Colors.gray[300]}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* 날짜 */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>날짜 *</Text>
          <View style={styles.inputRow}>
            <Calendar size={16} color={Colors.gray[400]} />
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0, padding: 0 }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.gray[300]}
              value={dateStr}
              onChangeText={setDateStr}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>

        {/* 메모 */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>메모 (선택)</Text>
          <View style={styles.memoWrap}>
            <FileText size={15} color={Colors.gray[400]} style={{ marginTop: 2 }} />
            <TextInput
              style={styles.memoInput}
              placeholder="데이트 관련 메모를 남겨보세요"
              placeholderTextColor={Colors.gray[300]}
              value={memo}
              onChangeText={setMemo}
              multiline
              maxLength={500}
            />
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  saveBtn: {
    backgroundColor: '#E60076',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    minWidth: 52,
    alignItems: 'center',
    ...Shadow.sm,
  },
  saveBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  fieldCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.gray[500],
    letterSpacing: 0.5,
  },
  input: {
    fontSize: FontSize.base,
    color: Colors.gray[900],
    paddingVertical: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  memoWrap: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  memoInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.gray[900],
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
