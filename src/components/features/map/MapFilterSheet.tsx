import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlidersHorizontal, Check } from 'lucide-react-native';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow,
} from '@constants/theme';
import {
  useMapFilterStore,
  LIMIT_OPTIONS, RADIUS_OPTIONS,
  radiusLabel,
  type LimitOption, type RadiusOption,
} from '@stores/mapFilter.store';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MapFilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OptionChip<T extends number>({
  value,
  selected,
  label,
  onPress,
}: {
  value: T;
  selected: boolean;
  label: string;
  onPress: (v: T) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={() => onPress(value)}
      activeOpacity={0.75}
    >
      {selected && <Check size={11} color={Colors.white} strokeWidth={3} />}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MapFilterSheet({ visible, onClose }: MapFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const { limit, radius, setLimit, setRadius } = useMapFilterStore();

  // Animation
  const sheetY = useSharedValue(400);
  const overlayOpacity = useSharedValue(0);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  useEffect(() => {
    if (visible) {
      sheetY.value = withSpring(0, { damping: 22, stiffness: 260 });
      overlayOpacity.value = withTiming(1, { duration: 200 });
    } else {
      sheetY.value = withSpring(400, { damping: 22, stiffness: 260 });
      overlayOpacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[styles.backdrop, overlayStyle]} />
      </Pressable>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }, sheetStyle]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <SlidersHorizontal size={18} color={Colors.primary[600]} />
          <Text style={styles.headerTitle}>검색 필터</Text>
        </View>

        {/* ── 표시 개수 ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>표시 장소 수</Text>
            <Text style={styles.sectionValue}>{limit}개</Text>
          </View>
          <View style={styles.chipRow}>
            {LIMIT_OPTIONS.map((opt) => (
              <OptionChip<LimitOption>
                key={opt}
                value={opt}
                selected={limit === opt}
                label={`${opt}개`}
                onPress={setLimit}
              />
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── 검색 반경 ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>검색 반경</Text>
            <Text style={styles.sectionValue}>{radiusLabel(radius)}</Text>
          </View>
          <View style={styles.chipRow}>
            {RADIUS_OPTIONS.map((opt) => (
              <OptionChip<RadiusOption>
                key={opt}
                value={opt}
                selected={radius === opt}
                label={radiusLabel(opt)}
                onPress={setRadius}
              />
            ))}
          </View>
        </View>

        {/* Confirm button */}
        <TouchableOpacity style={styles.confirmBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.confirmText}>적용하기</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing['2xl'],
    ...Shadow.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[200],
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  section: {
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[700],
  },
  sectionValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary[600],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.gray[50],
  },
  chipSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[600],
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray[600],
  },
  chipTextSelected: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginVertical: Spacing.xs,
  },
  confirmBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
