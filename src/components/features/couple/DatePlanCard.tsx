import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, MapPin, ChevronRight, Check } from 'lucide-react-native';
import { Colors } from '@constants/theme';
import type { DatePlan, DatePlanStatus } from '@types';

interface Props {
  plan: DatePlan;
  onPress?: () => void;
  onStatusChange?: (id: string, status: DatePlanStatus) => void;
}

const STATUS_CONFIG: Record<DatePlanStatus, { label: string; color: string; bg: string }> = {
  PLANNED:   { label: '예정', color: '#9810FA', bg: '#F3E8FF' },
  COMPLETED: { label: '완료', color: '#16A34A', bg: '#F0FDF4' },
  CANCELLED: { label: '취소', color: Colors.gray[500], bg: Colors.gray[100] },
};

function getDDay(dateAt: string): { label: string; color: string; bg: string } | null {
  const now = new Date();
  const target = new Date(dateAt);
  // 시간 제거 후 날짜만 비교
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tarDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diff = Math.round((tarDay.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return { label: 'D-Day', color: '#E60076', bg: '#FFF0F8' };
  if (diff > 0 && diff <= 7) return { label: `D-${diff}`, color: '#9810FA', bg: '#F3E8FF' };
  if (diff > 7) return { label: `D-${diff}`, color: Colors.gray[500], bg: Colors.gray[100] };
  // 지난 날짜 (overdue)
  return { label: `D+${Math.abs(diff)}`, color: '#DC2626', bg: '#FEF2F2' };
}

function getLeftBorderColor(plan: DatePlan): string {
  if (plan.status !== 'PLANNED') return 'transparent';
  const now = new Date();
  const target = new Date(plan.dateAt);
  const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '#DC2626';   // 지남 (빨강)
  if (diff === 0) return '#E60076'; // 오늘 (핑크)
  if (diff <= 3) return '#9810FA';  // 3일 이내 (보라)
  return Colors.gray[200];          // 여유
}

export function DatePlanCard({ plan, onPress, onStatusChange }: Props) {
  const cfg = STATUS_CONFIG[plan.status];
  const dDay = plan.status === 'PLANNED' ? getDDay(plan.dateAt) : null;
  const leftBorder = getLeftBorderColor(plan);

  const dateStr = new Date(plan.dateAt).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: leftBorder, borderLeftWidth: 3 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.left}>
        <View style={styles.dateRow}>
          <Calendar size={14} color={Colors.gray[400]} />
          <Text style={styles.date}>{dateStr}</Text>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {dDay && (
            <View style={[styles.badge, { backgroundColor: dDay.bg }]}>
              <Text style={[styles.badgeText, { color: dDay.color }]}>{dDay.label}</Text>
            </View>
          )}
        </View>
        <Text style={styles.title} numberOfLines={1}>{plan.title}</Text>
        {plan.memo ? (
          <Text style={styles.memo} numberOfLines={1}>{plan.memo}</Text>
        ) : null}
        {plan.placeIds.length > 0 && (
          <View style={styles.placeRow}>
            <MapPin size={12} color={Colors.gray[400]} />
            <Text style={styles.placeText}>{plan.placeIds.length}개 장소</Text>
          </View>
        )}
      </View>

      <View style={styles.right}>
        {plan.status === 'PLANNED' && onStatusChange && (
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => onStatusChange(plan.id, 'COMPLETED')}
          >
            <Check size={16} color="#16A34A" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
        <ChevronRight size={18} color={Colors.gray[300]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  left: {
    flex: 1,
    gap: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  date: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[900],
  },
  memo: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  placeText: {
    fontSize: 12,
    color: Colors.gray[400],
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doneBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
