import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Gradients, Shadow,
} from '@constants/theme';
import ScreenTransition from '@components/ScreenTransition';
import { communityApi } from '@services/community.service';
import type { PostCategory } from '@/types';
import { POST_CATEGORY_LABEL } from '@/types';

const CATEGORIES: PostCategory[] = ['FREE', 'INFO', 'QUESTION', 'REVIEW'];

export default function WritePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [category, setCategory] = useState<PostCategory>('FREE');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const createMut = useMutation({
    mutationFn: () => communityApi.createPost({ category, title: title.trim(), body: body.trim() }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      router.replace({ pathname: '/community/[id]', params: { id: data.id } });
    },
    onError: () => {
      Alert.alert('오류', '게시글 등록에 실패했어요. 다시 시도해주세요.');
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) { Alert.alert('알림', '제목을 입력해주세요.'); return; }
    if (!body.trim()) { Alert.alert('알림', '내용을 입력해주세요.'); return; }
    if (title.trim().length > 100) { Alert.alert('알림', '제목은 100자 이하로 입력해주세요.'); return; }
    createMut.mutate();
  };

  return (
    <ScreenTransition>
      <LinearGradient colors={Gradients.background} style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* 헤더 */}
          <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={22} color={Colors.gray[700]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>새 글 쓰기</Text>
            <TouchableOpacity
              style={[styles.submitBtn, (!title.trim() || !body.trim()) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!title.trim() || !body.trim() || createMut.isPending}
            >
              {createMut.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>등록</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* 카테고리 선택 */}
            <View style={styles.section}>
              <Text style={styles.label}>카테고리</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => {
                  const selected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryBtn, selected && styles.categoryBtnActive]}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryBtnText, selected && styles.categoryBtnTextActive]}>
                        {POST_CATEGORY_LABEL[cat]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 제목 입력 */}
            <View style={styles.section}>
              <Text style={styles.label}>제목 <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.titleInput}
                placeholder="제목을 입력하세요 (최대 100자)"
                placeholderTextColor={Colors.gray[400]}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                returnKeyType="next"
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            {/* 내용 입력 */}
            <View style={styles.section}>
              <Text style={styles.label}>내용 <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.bodyInput}
                placeholder="내용을 입력하세요 (최대 5000자)"
                placeholderTextColor={Colors.gray[400]}
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
                maxLength={5000}
              />
              <Text style={styles.charCount}>{body.length}/5000</Text>
            </View>

            {/* 안내문 */}
            <View style={styles.guideSection}>
              <Text style={styles.guideTitle}>📢 커뮤니티 이용 안내</Text>
              <Text style={styles.guideText}>• 욕설, 혐오 표현은 제재 대상입니다.</Text>
              <Text style={styles.guideText}>• 개인정보가 포함된 내용은 삼가주세요.</Text>
              <Text style={styles.guideText}>• 상업적 홍보글은 삭제될 수 있습니다.</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    position: 'relative',
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.full, backgroundColor: Colors.white, ...Shadow.sm,
    zIndex: 1,
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gray[900],
  },
  submitBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary[600], borderRadius: BorderRadius.lg,
    minWidth: 56, alignItems: 'center', zIndex: 1,
  },
  submitBtnDisabled: { backgroundColor: Colors.gray[300] },
  submitText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: '#fff' },

  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.gray[700], marginBottom: Spacing.sm },
  required: { color: '#EF4444' },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.gray[200],
  },
  categoryBtnActive: { backgroundColor: Colors.primary[600], borderColor: Colors.primary[600] },
  categoryBtnText: { fontSize: FontSize.sm, color: Colors.gray[600] },
  categoryBtnTextActive: { color: Colors.white, fontWeight: FontWeight.medium },

  titleInput: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md,
    fontSize: FontSize.base, color: Colors.gray[900], ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.gray[100],
  },
  bodyInput: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md,
    fontSize: FontSize.base, color: Colors.gray[900], ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.gray[100],
    minHeight: 200,
  },
  charCount: { fontSize: FontSize.xs, color: Colors.gray[400], textAlign: 'right', marginTop: 4 },

  guideSection: {
    marginHorizontal: Spacing.lg, padding: Spacing.md,
    backgroundColor: Colors.primary[600] + '08', borderRadius: BorderRadius.lg, gap: 4,
  },
  guideTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary[600], marginBottom: 4 },
  guideText: { fontSize: FontSize.xs, color: Colors.gray[600], lineHeight: 18 },
});
