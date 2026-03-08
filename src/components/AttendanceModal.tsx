import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, Gradients } from '@constants/theme';
import type { AttendanceCheckResult } from '@/types';

interface Props {
  visible: boolean;
  result: AttendanceCheckResult | null;
  onClose: () => void;
}

export function AttendanceModal({ visible, result, onClose }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bonusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        if (result?.isWeekBonus) {
          Animated.sequence([
            Animated.timing(bonusAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(bonusAnim, { toValue: 1.1, tension: 200, friction: 4, useNativeDriver: true }),
            Animated.spring(bonusAnim, { toValue: 1, tension: 200, friction: 4, useNativeDriver: true }),
          ]).start();
        }
      });
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      bonusAnim.setValue(0);
    }
  }, [visible]);

  if (!result) return null;

  const { alreadyChecked, streak, creditsEarned, totalCredits, isWeekBonus } = result;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.cardWrap, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={Gradients.background} style={styles.card}>
            {/* 타이틀 */}
            <Text style={styles.emoji}>{isWeekBonus ? '🎉' : alreadyChecked ? '✅' : '📅'}</Text>
            <Text style={styles.title}>
              {isWeekBonus
                ? '7일 연속 출석 달성!'
                : alreadyChecked
                ? '오늘 이미 출석했어요'
                : `${streak}일째 출석 완료!`}
            </Text>

            {/* 7일 streak 표시 */}
            <View style={styles.streakRow}>
              {Array.from({ length: 7 }, (_, i) => {
                const day = i + 1;
                const done = day <= streak;
                const isToday = day === streak;
                const dayCredits = day === 7 ? 50 : 5;
                return (
                  <View key={day} style={styles.dayWrap}>
                    <View
                      style={[
                        styles.dayCircle,
                        done && styles.dayCircleDone,
                        isToday && !alreadyChecked && styles.dayCircleToday,
                      ]}
                    >
                      <Text style={[styles.dayNum, done && styles.dayNumDone]}>
                        {day === 7 ? '🌟' : String(day)}
                      </Text>
                    </View>
                    <Text style={styles.dayLabel}>{day}일</Text>
                    <Text style={[styles.dayCredits, day === 7 && styles.dayCreditsBonus]}>
                      +{dayCredits}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* 크레딧 획득 */}
            {!alreadyChecked && (
              <Animated.View
                style={[
                  styles.creditBox,
                  isWeekBonus && { transform: [{ scale: bonusAnim }] },
                ]}
              >
                <LinearGradient
                  colors={isWeekBonus ? ['#F59E0B', '#F97316'] : ['#8B5CF6', '#6366F1']}
                  style={styles.creditGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.creditText}>+{creditsEarned} 크레딧 획득!</Text>
                </LinearGradient>
              </Animated.View>
            )}

            <Text style={styles.totalText}>보유 크레딧: {totalCredits}개</Text>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>확인</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrap: {
    width: '82%',
    borderRadius: BorderRadius.xl,
    ...Shadow.lg,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.md,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.gray[800],
    textAlign: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginVertical: Spacing.sm,
  },
  dayWrap: {
    alignItems: 'center',
    gap: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  dayCircleDone: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
  },
  dayCircleToday: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
  },
  dayNum: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[400],
  },
  dayNumDone: {
    color: '#fff',
  },
  dayLabel: {
    fontSize: 10,
    color: Colors.gray[400],
  },
  dayCredits: {
    fontSize: 9,
    color: '#8B5CF6',
    fontWeight: FontWeight.semibold,
  },
  dayCreditsBonus: {
    color: '#F59E0B',
  },
  creditBox: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  creditGradient: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  creditText: {
    color: '#fff',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.lg,
    textAlign: 'center',
  },
  totalText: {
    fontSize: FontSize.sm,
    color: Colors.gray[500],
  },
  closeBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
  },
  closeBtnText: {
    fontWeight: FontWeight.semibold,
    color: Colors.gray[700],
    fontSize: FontSize.base,
  },
});
