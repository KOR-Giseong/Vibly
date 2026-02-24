import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Filter, List, Grid, MapPin, Star } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow } from '@constants/theme';
import { useMoodStore } from '@stores/mood.store';

type ViewMode = 'list' | 'grid';

const MOCK_RESULTS = [
  { id: '1', name: '블루보틀 성수', category: '카페', vibe: '아늑한', vibeScore: 95, distance: '350m', rating: 4.8, sponsored: false },
  { id: '2', name: '테라로사 서울숲', category: '카페', vibe: '평화로운', vibeScore: 88, distance: '500m', rating: 4.7, sponsored: true },
  { id: '3', name: '피크닉 한강공원', category: '공원', vibe: '활기찬', vibeScore: 82, distance: '1.2km', rating: 4.6, sponsored: false },
  { id: '4', name: '앤트러사이트 합정', category: '카페', vibe: '감성적', vibeScore: 91, distance: '800m', rating: 4.7, sponsored: false },
  { id: '5', name: '하우스 오브 커피', category: '카페', vibe: '아늑한', vibeScore: 79, distance: '1.5km', rating: 4.5, sponsored: false },
];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedMood, searchResult } = useMoodStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [query, setQuery] = useState('');

  const results = MOCK_RESULTS;
  const mood = selectedMood?.label ?? '기분';

  return (
    <LinearGradient colors={Gradients.background} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>검색 결과</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Filter size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="장소나 기분을 검색해보세요"
            placeholderTextColor={Colors.gray[400]}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {/* Info + Toggle */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>"{mood}" 기분으로 검색 · {results.length}곳 발견</Text>
        </View>
        <View style={styles.toggleWrap}>
          {([['list', <List size={16} color={viewMode === 'list' ? Colors.white : Colors.gray[500]} />],
             ['grid', <Grid size={16} color={viewMode === 'grid' ? Colors.white : Colors.gray[500]} />]] as const).map(([mode, icon]) => (
            <TouchableOpacity
              key={mode}
              style={[styles.toggleBtn, viewMode === mode && styles.toggleActive]}
              onPress={() => setViewMode(mode as ViewMode)}
            >
              {viewMode === mode && (
                <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              )}
              {icon}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
          <Text style={styles.emptyDesc}>다른 기분이나 키워드로 찾아볼까요?</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) =>
            viewMode === 'list' ? (
              <TouchableOpacity
                style={styles.listCard}
                onPress={() => router.push(`/place/${item.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.listImg}>
                  <Text style={{ fontSize: 28 }}>🏠</Text>
                  {item.sponsored && (
                    <View style={styles.sponsorBadge}>
                      <Text style={styles.sponsorText}>광고</Text>
                    </View>
                  )}
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={styles.listCategory}>{item.category}</Text>
                  <View style={styles.listMeta}>
                    <View style={styles.vibeTag}><Text style={styles.vibeText}>{item.vibe}</Text></View>
                    <Text style={styles.scoreBadge}>✨ {item.vibeScore}</Text>
                  </View>
                  <View style={styles.listBottom}>
                    <View style={styles.metaRow}><MapPin size={11} color={Colors.gray[400]} /><Text style={styles.metaText}>{item.distance}</Text></View>
                    <View style={styles.metaRow}><Star size={11} color="#FACC15" fill="#FACC15" /><Text style={styles.metaText}>{item.rating}</Text></View>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => router.push(`/place/${item.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.gridImg}><Text style={{ fontSize: 36 }}>🏠</Text></View>
                <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.gridCategory}>{item.category}</Text>
                <View style={styles.vibeTag}><Text style={styles.vibeText}>{item.vibe}</Text></View>
              </TouchableOpacity>
            )
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.lg },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  searchWrap: { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.md },
  searchBar: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, ...Shadow.sm },
  searchInput: { paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.gray[900] },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.lg },
  infoCard: { backgroundColor: Colors.primary[100], borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs },
  infoText: { fontSize: FontSize.xs, color: Colors.primary[700], fontWeight: FontWeight.medium },
  toggleWrap: { flexDirection: 'row', backgroundColor: Colors.gray[100], borderRadius: BorderRadius.md, overflow: 'hidden' },
  toggleBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  toggleActive: {},
  list: { paddingHorizontal: Spacing['2xl'], gap: Spacing.md },
  listCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], padding: Spacing.lg, ...Shadow.sm },
  listImg: { width: 80, height: 80, borderRadius: BorderRadius.xl, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center', marginRight: Spacing.lg },
  sponsorBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: '#F97316', borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  sponsorText: { fontSize: 9, color: Colors.white, fontWeight: FontWeight.bold },
  listInfo: { flex: 1 },
  listName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  listCategory: { fontSize: FontSize.sm, color: Colors.gray[500], marginBottom: Spacing.xs },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  vibeTag: { backgroundColor: Colors.primary[100], borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  vibeText: { fontSize: FontSize.xs, color: Colors.primary[700], fontWeight: FontWeight.medium },
  scoreBadge: { fontSize: FontSize.xs, color: Colors.gray[600], fontWeight: FontWeight.medium },
  listBottom: { flexDirection: 'row', gap: Spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaText: { fontSize: FontSize.xs, color: Colors.gray[500] },
  gridCard: { flex: 1, margin: Spacing.xs, backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], padding: Spacing.md, ...Shadow.sm },
  gridImg: { height: 80, borderRadius: BorderRadius.xl, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  gridName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gray[900] },
  gridCategory: { fontSize: FontSize.xs, color: Colors.gray[500], marginBottom: Spacing.xs },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['3xl'] },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.gray[900], marginBottom: Spacing.sm },
  emptyDesc: { fontSize: FontSize.base, color: Colors.gray[500], textAlign: 'center' },
});
