import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grid, List, Bookmark, MapPin, Star } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';

type ViewMode = 'grid' | 'list';

const CATEGORIES = ['전체', '카페', '레스토랑', '바', '문화공간', '기타'];

const MOCK_BOOKMARKS = [
  { id: '1', name: '블루보틀 성수', category: '카페', vibe: '아늑한', rating: 4.8, savedAt: '2025.01.15' },
  { id: '2', name: '피크닉 한강공원', category: '공원', vibe: '평화로운', rating: 4.6, savedAt: '2025.01.10' },
  { id: '3', name: '앤트러사이트 합정', category: '카페', vibe: '감성적', rating: 4.7, savedAt: '2025.01.08' },
  { id: '4', name: '어반플레이 성수', category: '문화공간', vibe: '활기찬', rating: 4.5, savedAt: '2025.01.05' },
];

export default function BookmarkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeCategory, setActiveCategory] = useState('전체');

  const filtered = activeCategory === '전체'
    ? MOCK_BOOKMARKS
    : MOCK_BOOKMARKS.filter(b => b.category === activeCategory);

  return (
    <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View>
          <Text style={styles.headerTitle}>저장한 장소</Text>
          <Text style={styles.headerSub}>{filtered.length}곳 저장됨</Text>
        </View>
        <View style={styles.toggleWrap}>
          {([['grid', Grid], ['list', List]] as const).map(([mode, Icon]) => (
            <TouchableOpacity
              key={mode}
              style={[styles.toggleBtn, viewMode === mode && styles.toggleActive]}
              onPress={() => setViewMode(mode)}
            >
              {viewMode === mode && (
                <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              )}
              <Icon size={16} color={viewMode === mode ? Colors.white : Colors.gray[500]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category Filter */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, activeCategory === item && styles.categoryChipActive]}
            onPress={() => setActiveCategory(item)}
          >
            {activeCategory === item && (
              <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            )}
            <Text style={[styles.categoryText, activeCategory === item && styles.categoryTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Places */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Bookmark size={56} color={Colors.gray[300]} />
          <Text style={styles.emptyTitle}>저장한 장소가 없어요</Text>
          <Text style={styles.emptyDesc}>마음에 드는 장소를 저장해보세요</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={[styles.placeList, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) =>
            viewMode === 'grid' ? (
              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => router.push(`/place/${item.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.gridImg}>
                  <Text style={{ fontSize: 32 }}>🏠</Text>
                  <View style={styles.heartBadge}><Text>❤️</Text></View>
                </View>
                <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.gridCategory}>{item.category}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.listCard}
                onPress={() => router.push(`/place/${item.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.listImg}>
                  <Text style={{ fontSize: 24 }}>🏠</Text>
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={styles.listCategory}>{item.category}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.vibeTag}><Text style={styles.vibeText}>{item.vibe}</Text></View>
                    <View style={styles.ratingRow}>
                      <Star size={11} color="#FACC15" fill="#FACC15" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.savedAt}>{item.savedAt}</Text>
              </TouchableOpacity>
            )
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.lg },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  headerSub: { fontSize: FontSize.sm, color: Colors.gray[500], marginTop: 2 },
  toggleWrap: { flexDirection: 'row', backgroundColor: Colors.gray[100], borderRadius: BorderRadius.md, overflow: 'hidden' },
  toggleBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  toggleActive: {},
  categoryList: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.lg, gap: Spacing.sm },
  categoryChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.white, overflow: 'hidden', ...Shadow.sm },
  categoryChipActive: {},
  categoryText: { fontSize: FontSize.sm, color: Colors.gray[600], fontWeight: FontWeight.medium },
  categoryTextActive: { color: Colors.white },
  placeList: { paddingHorizontal: Spacing['2xl'], gap: Spacing.md },
  gridCard: { flex: 1, margin: Spacing.xs, backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], overflow: 'hidden', ...Shadow.sm },
  gridImg: { height: 120, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  heartBadge: { position: 'absolute', bottom: 8, right: 8 },
  gridName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gray[900], margin: Spacing.sm, marginBottom: 2 },
  gridCategory: { fontSize: FontSize.xs, color: Colors.gray[500], marginHorizontal: Spacing.sm, marginBottom: Spacing.sm },
  listCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], padding: Spacing.lg, ...Shadow.sm },
  listImg: { width: 64, height: 64, borderRadius: BorderRadius.xl, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center', marginRight: Spacing.lg },
  listInfo: { flex: 1 },
  listName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  listCategory: { fontSize: FontSize.sm, color: Colors.gray[500], marginBottom: Spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  vibeTag: { backgroundColor: Colors.primary[100], borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  vibeText: { fontSize: FontSize.xs, color: Colors.primary[700], fontWeight: FontWeight.medium },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: FontSize.xs, color: Colors.gray[500] },
  savedAt: { fontSize: FontSize.xs, color: Colors.gray[400] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['3xl'], gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  emptyDesc: { fontSize: FontSize.base, color: Colors.gray[500], textAlign: 'center' },
});
