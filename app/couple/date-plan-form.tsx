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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Calendar, FileText, X, Trash2 } from 'lucide-react-native';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, Gradients,
} from '@constants/theme';
import { coupleService } from '@services/couple.service';

// ── 캘린더 헬퍼 ──────────────────────────────────────────────────────────────
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function formatDisplayDate(date: Date) {
  return `${date.getFullYear()}년 ${MONTHS[date.getMonth()]} ${date.getDate()}일`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isToday(date: Date) {
  return isSameDay(date, new Date());
}

function buildCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

// ── 캘린더 모달 컴포넌트 ────────────────────────────────────────────────────
interface CalendarPickerProps {
  visible: boolean;
  selectedDate: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

function CalendarPicker({ visible, selectedDate, onConfirm, onClose }: CalendarPickerProps) {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [tempDate, setTempDate] = useState(selectedDate);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const days = buildCalendarDays(viewYear, viewMonth);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={cal.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
          <View style={cal.sheet}>
            {/* 헤더 */}
            <View style={cal.header}>
              <Text style={cal.headerTitle}>날짜 선택</Text>
              <TouchableOpacity onPress={onClose} style={cal.closeBtn}>
                <X size={18} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>

            {/* 월 네비게이션 */}
            <View style={cal.monthRow}>
              <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
                <ChevronLeft size={20} color={Colors.gray[600]} />
              </TouchableOpacity>
              <Text style={cal.monthText}>{viewYear}년 {MONTHS[viewMonth]}</Text>
              <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
                <ChevronRight size={20} color={Colors.gray[600]} />
              </TouchableOpacity>
            </View>

            {/* 요일 헤더 */}
            <View style={cal.weekRow}>
              {WEEKDAYS.map((wd, i) => (
                <Text key={wd} style={[cal.weekday, i === 0 && { color: '#EF4444' }, i === 6 && { color: '#3B82F6' }]}>
                  {wd}
                </Text>
              ))}
            </View>

            {/* 날짜 그리드 */}
            <View style={cal.grid}>
              {days.map((d, idx) => {
                if (!d) return <View key={`empty-${idx}`} style={cal.dayCell} />;
                const isSelected = isSameDay(d, tempDate);
                const todayMark = isToday(d);
                const isSun = idx % 7 === 0;
                const isSat = idx % 7 === 6;
                return (
                  <TouchableOpacity
                    key={d.toISOString()}
                    style={[cal.dayCell, isSelected && cal.daySelected]}
                    onPress={() => setTempDate(d)}
                    activeOpacity={0.7}
                  >
                    {todayMark && !isSelected && <View style={cal.todayDot} />}
                    <Text style={[
                      cal.dayText,
                      isSelected && cal.dayTextSelected,
                      !isSelected && isSun && { color: '#EF4444' },
                      !isSelected && isSat && { color: '#3B82F6' },
                    ]}>
                      {d.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 선택된 날짜 표시 */}
            <View style={cal.selectedRow}>
              <Text style={cal.selectedText}>{formatDisplayDate(tempDate)} 선택됨</Text>
            </View>

            {/* 확인 버튼 */}
            <TouchableOpacity
              style={cal.confirmBtn}
              onPress={() => { onConfirm(tempDate); onClose(); }}
            >
              <LinearGradient colors={['#9810FA', '#E60076']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cal.confirmGrad}>
                <Text style={cal.confirmText}>선택 완료</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── 메인 화면 ────────────────────────────────────────────────────────────────
export default function DatePlanFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; title?: string; dateAt?: string; memo?: string }>();
  const isEdit = !!params.id;

  const [title, setTitle] = useState(params.title ?? '');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (params.dateAt) {
      const d = new Date(params.dateAt);
      if (!isNaN(d.getTime())) return d;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  });
  const [calVisible, setCalVisible] = useState(false);
  const [memo, setMemo] = useState(params.memo ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('알림', '제목을 입력해주세요.'); return; }

    setSaving(true);
    try {
      if (isEdit && params.id) {
        await coupleService.updateDatePlan(params.id, {
          title: title.trim(),
          dateAt: selectedDate.toISOString(),
          memo: memo.trim() || undefined,
        });
      } else {
        await coupleService.createDatePlan({
          title: title.trim(),
          dateAt: selectedDate.toISOString(),
          memo: memo.trim() || undefined,
        });
      }
      router.back();
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message ?? '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!params.id) return;
    Alert.alert(
      '플랜 삭제',
      '이 데이트 플랜을 삭제할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await coupleService.deleteDatePlan(params.id!);
              router.back();
            } catch (e: any) {
              Alert.alert('오류', e?.response?.data?.message ?? '삭제에 실패했습니다.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? '데이트 플랜 수정' : '데이트 플랜 추가'}</Text>
        <View style={styles.headerRight}>
          {isEdit && (
            <TouchableOpacity
              style={[styles.deleteBtn, deleting && { opacity: 0.5 }]}
              onPress={handleDelete}
              disabled={deleting || saving}
            >
              {deleting
                ? <ActivityIndicator color="#EF4444" size="small" />
                : <Trash2 size={17} color="#EF4444" />
              }
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving || deleting}
          >
            {saving
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={styles.saveBtnText}>{isEdit ? '수정' : '저장'}</Text>
            }
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity style={styles.fieldCard} onPress={() => setCalVisible(true)} activeOpacity={0.7}>
          <Text style={styles.fieldLabel}>날짜 *</Text>
          <View style={styles.inputRow}>
            <Calendar size={16} color="#9810FA" />
            <Text style={styles.dateValue}>{formatDisplayDate(selectedDate)}</Text>
            <ChevronRight size={16} color={Colors.gray[400]} />
          </View>
        </TouchableOpacity>

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

      <CalendarPicker
        visible={calVisible}
        selectedDate={selectedDate}
        onConfirm={setSelectedDate}
        onClose={() => setCalVisible(false)}
      />
    </LinearGradient>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────────────
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
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
  dateValue: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[900],
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

// ── 캘린더 스타일 ─────────────────────────────────────────────────────────────
const CELL_SIZE = 40;

const cal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 360,
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  closeBtn: {
    padding: 4,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.gray[800],
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[500],
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CELL_SIZE / 2,
    marginBottom: 2,
  },
  daySelected: {
    backgroundColor: '#9810FA',
  },
  dayText: {
    fontSize: FontSize.sm,
    color: Colors.gray[800],
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E60076',
    position: 'absolute',
    bottom: 5,
  },
  selectedRow: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    marginTop: Spacing.sm,
  },
  selectedText: {
    fontSize: FontSize.sm,
    color: Colors.gray[600],
    fontWeight: FontWeight.semibold,
  },
  confirmBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  confirmGrad: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});

