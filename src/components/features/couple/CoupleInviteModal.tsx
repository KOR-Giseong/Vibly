import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Search, X, ChevronLeft, Send, User, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, Gradients } from '@constants/theme';
import { coupleService, type UserSearchResult } from '@services/couple.service';

interface Props {
  visible: boolean;
  onClose: () => void;
  onInviteSent: () => void;
}

type Step = 'search' | 'message';

const GENDER_LABEL: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  MALE:   { emoji: '👨', label: '남성', color: '#3B82F6', bg: '#EFF6FF' },
  FEMALE: { emoji: '👩', label: '여성', color: '#E60076', bg: '#FDF2F8' },
  OTHER:  { emoji: '🧑', label: '기타', color: Colors.gray[500], bg: Colors.gray[100] },
};

function UserAvatar({ user, size = 48 }: { user: UserSearchResult; size?: number }) {
  if (user.avatarUrl) {
    return (
      <Image
        source={{ uri: user.avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <User size={size * 0.44} color={Colors.gray[400]} strokeWidth={1.5} />
    </View>
  );
}

function GenderBadge({ gender }: { gender?: string | null }) {
  if (!gender) return null;
  const cfg = GENDER_LABEL[gender];
  if (!cfg) return null;
  return (
    <View style={[styles.genderBadge, { backgroundColor: cfg.bg }]}>
      <Text style={styles.genderBadgeEmoji}>{cfg.emoji}</Text>
      <Text style={[styles.genderBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export function CoupleInviteModal({ visible, onClose, onInviteSent }: Props) {
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleClose = () => {
    setStep('search');
    setQuery('');
    setResults([]);
    setSelected(null);
    setMessage('');
    setError('');
    setSearched(false);
    onClose();
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    setSearched(true);
    try {
      const res = await coupleService.searchUser(query.trim());
      setResults(res);
    } catch {
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (user: UserSearchResult) => {
    setSelected(user);
    setStep('message');
  };

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    setError('');
    try {
      await coupleService.sendInvitation({
        receiverId: selected.id,
        message: message.trim() || undefined,
      });
      handleClose();
      onInviteSent();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '초대 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const displayName = (u: UserSearchResult) => u.nickname ?? u.name;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>

            {/* 핸들 */}
            <View style={styles.handle} />

            {/* ── 검색 단계 ── */}
            {step === 'search' ? (
              <>
                {/* 헤더 */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>파트너 찾기</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                    <X size={17} color={Colors.gray[500]} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.sheetSubtitle}>이메일 또는 닉네임으로 검색해보세요</Text>

                {/* 검색창 */}
                <View style={styles.searchRow}>
                  <View style={styles.searchInputWrap}>
                    <Search size={15} color={Colors.gray[400]} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="이메일 또는 닉네임"
                      placeholderTextColor={Colors.gray[400]}
                      value={query}
                      onChangeText={(t) => { setQuery(t); setSearched(false); }}
                      onSubmitEditing={handleSearch}
                      returnKeyType="search"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {query.length > 0 && (
                      <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
                        <X size={14} color={Colors.gray[300]} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.searchBtn, searching && { opacity: 0.6 }]}
                    onPress={handleSearch}
                    disabled={searching}
                  >
                    {searching
                      ? <ActivityIndicator color={Colors.white} size="small" />
                      : <Text style={styles.searchBtnText}>검색</Text>
                    }
                  </TouchableOpacity>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* 결과 */}
                {searched && !searching && results.length === 0 ? (
                  <View style={styles.emptyResult}>
                    <Text style={styles.emptyResultText}>검색 결과가 없습니다</Text>
                    <Text style={styles.emptyResultSub}>닉네임이나 이메일을 확인해주세요</Text>
                  </View>
                ) : (
                  <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ gap: 8, paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.resultItem}
                        onPress={() => handleSelect(item)}
                        activeOpacity={0.75}
                      >
                        <UserAvatar user={item} size={52} />
                        <View style={styles.resultInfo}>
                          <View style={styles.resultNameRow}>
                            <Text style={styles.resultName}>{displayName(item)}</Text>
                            <GenderBadge gender={item.gender} />
                          </View>
                          <Text style={styles.resultEmail} numberOfLines={1}>{item.email}</Text>
                        </View>
                        <View style={styles.selectBtn}>
                          <Text style={styles.selectBtnText}>선택</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </>
            ) : (
              <>
                {/* ── 메시지 단계 ── */}
                <View style={styles.sheetHeader}>
                  <TouchableOpacity onPress={() => setStep('search')} style={styles.backBtn}>
                    <ChevronLeft size={20} color={Colors.gray[600]} />
                  </TouchableOpacity>
                  <Text style={styles.sheetTitle}>초대 메시지</Text>
                  <View style={{ width: 36 }} />
                </View>

                {/* 선택된 유저 카드 */}
                {selected && (
                  <View style={styles.selectedCard}>
                    <LinearGradient
                      colors={['#FDF2F8', '#F3E8FF']}
                      style={styles.selectedCardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <UserAvatar user={selected} size={72} />
                      <View style={styles.selectedInfo}>
                        <View style={styles.resultNameRow}>
                          <Text style={styles.selectedName}>{displayName(selected)}</Text>
                          <GenderBadge gender={selected.gender} />
                        </View>
                        <Text style={styles.selectedEmail}>{selected.email}</Text>
                      </View>
                    </LinearGradient>
                  </View>
                )}

                {/* 메시지 입력 */}
                <Text style={styles.inputLabel}>메시지 (선택)</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="함께하고 싶다는 마음을 전해보세요 💕"
                  placeholderTextColor={Colors.gray[400]}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={200}
                />
                {message.length > 0 && (
                  <Text style={styles.charCount}>{message.length}/200</Text>
                )}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* 법적 고지 */}
                <View style={styles.legalBox}>
                  <AlertTriangle size={13} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
                  <Text style={styles.legalText}>
                    {'성희롱·악의적 메시지 등 부적절한 사용은 신고·이용 제재 대상이며 법적 조치를 받을 수 있습니다. 초대 발송 정보는 법적 분쟁 대비를 위해 1년간 보관됩니다.'}
                  </Text>
                </View>

                {/* 전송 버튼 */}
                <TouchableOpacity
                  style={[styles.sendBtn, sending && { opacity: 0.6 }]}
                  onPress={handleSend}
                  disabled={sending}
                >
                  <LinearGradient
                    colors={['#9810FA', '#E60076']}
                    style={styles.sendBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {sending
                      ? <ActivityIndicator color={Colors.white} />
                      : (
                        <>
                          <Send size={17} color={Colors.white} />
                          <Text style={styles.sendBtnText}>커플 초대 보내기</Text>
                        </>
                      )
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[200],
    alignSelf: 'center',
    marginBottom: 20,
  },

  // 헤더
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
    flex: 1,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.gray[400],
    textAlign: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 검색
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.gray[900],
  },
  searchBtn: {
    backgroundColor: '#E60076',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 18,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },

  // 빈 결과
  emptyResult: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyResultText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[500],
  },
  emptyResultSub: {
    fontSize: FontSize.sm,
    color: Colors.gray[400],
  },

  // 결과 아이템
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  avatarFallback: {
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
    gap: 4,
  },
  resultNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  resultName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[900],
  },
  resultEmail: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  genderBadgeEmoji: {
    fontSize: 11,
  },
  genderBadgeText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  selectBtn: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#F9A8D4',
  },
  selectBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: '#E60076',
  },

  // 선택된 유저 카드
  selectedCard: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: 20,
    ...Shadow.sm,
  },
  selectedCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  selectedInfo: {
    flex: 1,
    gap: 6,
  },
  selectedName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gray[900],
  },
  selectedEmail: {
    fontSize: FontSize.sm,
    color: Colors.gray[500],
  },

  // 메시지 입력
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[600],
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: 14,
    fontSize: FontSize.base,
    color: Colors.gray[900],
    minHeight: 110,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.gray[100],
    marginBottom: 6,
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.gray[400],
    textAlign: 'right',
    marginBottom: 16,
  },

  // 법적 고지
  legalBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 11,
    marginBottom: 4,
  },
  legalText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },

  // 전송 버튼
  sendBtn: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: 8,
    ...Shadow.md,
  },
  sendBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  sendBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
