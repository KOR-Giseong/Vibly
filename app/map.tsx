import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Navigation, MapPin } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';

const NEARBY_PINS = [
  { id: '1', name: '블루보틀 성수', vibe: '아늑한', emoji: '☕', x: '30%', y: '40%' },
  { id: '2', name: '피크닉 한강', vibe: '평화로운', emoji: '🌿', x: '60%', y: '60%' },
  { id: '3', name: '앤트러사이트', vibe: '감성적', emoji: '🎸', x: '50%', y: '25%' },
];

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <ScreenTransition>
    <View style={{ flex: 1, backgroundColor: Colors.gray[100] }}>
      {/* Mock Map */}
      <View style={styles.map}>
        {/* Grid pattern background */}
        <View style={styles.mapGrid} />

        {/* Pins */}
        {NEARBY_PINS.map((pin) => (
          <TouchableOpacity
            key={pin.id}
            style={[styles.pin, { left: pin.x, top: pin.y }, selected === pin.id && styles.pinSelected]}
            onPress={() => setSelected(pin.id === selected ? null : pin.id)}
            activeOpacity={0.9}
          >
            <Text style={styles.pinEmoji}>{pin.emoji}</Text>
            {selected === pin.id && (
              <View style={styles.pinLabel}>
                <Text style={styles.pinLabelText}>{pin.name}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Current Location */}
        <View style={styles.myLocation}>
          <View style={styles.myLocationPulse} />
          <View style={styles.myLocationDot} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { top: insets.top + Spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.searchInput}>
          <Search size={16} color={Colors.gray[400]} />
          <TextInput
            style={styles.searchText}
            placeholder="장소 검색"
            placeholderTextColor={Colors.gray[400]}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {/* Current Location Button */}
      <TouchableOpacity style={[styles.locBtn, { bottom: 220 + insets.bottom }]}>
        <Navigation size={20} color={Colors.primary[600]} />
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>근처 장소</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sheetList}>
          {NEARBY_PINS.map((pin) => (
            <TouchableOpacity
              key={pin.id}
              style={[styles.sheetCard, selected === pin.id && styles.sheetCardActive]}
              onPress={() => { setSelected(pin.id); router.push(`/place/${pin.id}`); }}
              activeOpacity={0.8}
            >
              <View style={styles.sheetEmoji}>
                <Text style={{ fontSize: 24 }}>{pin.emoji}</Text>
              </View>
              <Text style={styles.sheetName} numberOfLines={1}>{pin.name}</Text>
              <View style={styles.vibeTag}>
                <Text style={styles.vibeText}>{pin.vibe}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, position: 'relative', backgroundColor: '#E8F4FD' },
  mapGrid: { position: 'absolute', inset: 0, opacity: 0.3 },
  pin: {
    position: 'absolute', width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    ...Shadow.md, zIndex: 10,
  },
  pinSelected: { backgroundColor: Colors.primary[100], borderWidth: 2, borderColor: Colors.primary[500] },
  pinEmoji: { fontSize: 22 },
  pinLabel: {
    position: 'absolute', bottom: 54, backgroundColor: Colors.gray[900],
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: 4,
    minWidth: 80, alignItems: 'center',
  },
  pinLabelText: { fontSize: FontSize.xs, color: Colors.white, fontWeight: FontWeight.medium },
  myLocation: { position: 'absolute', left: '45%', top: '55%', alignItems: 'center', justifyContent: 'center' },
  myLocationPulse: { position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(124,58,237,0.15)' },
  myLocationDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary[600], borderWidth: 3, borderColor: Colors.white },
  searchBar: { position: 'absolute', left: Spacing['2xl'], right: Spacing['2xl'], flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.md },
  searchInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], paddingHorizontal: Spacing.lg, height: 44, ...Shadow.md,
  },
  searchText: { flex: 1, fontSize: FontSize.base, color: Colors.gray[900] },
  locBtn: {
    position: 'absolute', right: Spacing['2xl'], width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.md,
  },
  bottomSheet: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius['3xl'], borderTopRightRadius: BorderRadius['3xl'], paddingTop: Spacing.md, ...Shadow.lg },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray[200], alignSelf: 'center', marginBottom: Spacing.md },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900], paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.md },
  sheetList: { paddingHorizontal: Spacing['2xl'], gap: Spacing.md, paddingBottom: Spacing.sm },
  sheetCard: { width: 120, backgroundColor: Colors.gray[50], borderRadius: BorderRadius['2xl'], padding: Spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  sheetCardActive: { borderColor: Colors.primary[400], backgroundColor: Colors.primary[50] },
  sheetEmoji: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm, ...Shadow.sm },
  sheetName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.gray[900], textAlign: 'center', marginBottom: 4 },
  vibeTag: { backgroundColor: Colors.primary[100], borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  vibeText: { fontSize: 9, color: Colors.primary[700], fontWeight: FontWeight.medium },
});
