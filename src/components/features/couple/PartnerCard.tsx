import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Coins, User } from 'lucide-react-native';
import { Colors } from '@constants/theme';
import { useAuthStore } from '@stores/auth.store';
import type { CoupleInfo, PartnerProfile } from '@types';

interface Props {
  coupleInfo: CoupleInfo;
  partnerProfile?: PartnerProfile;
  onPress?: () => void;
}

function getDDay(anniversaryDate?: string | null): string | null {
  if (!anniversaryDate) return null;
  const ann = new Date(anniversaryDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - ann.getTime()) / (1000 * 60 * 60 * 24));
  return `D+${diff}`;
}

export function PartnerCard({ coupleInfo, partnerProfile, onPress }: Props) {
  const dDay = getDDay(coupleInfo.anniversaryDate);
  const { user } = useAuthStore();
  const myName = user?.nickname ?? user?.name ?? '나';
  const myAvatarUrl = user?.avatarUrl;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.cardShadow}>
      <LinearGradient
        colors={['#FFF0F8', '#F5F0FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* 두 프로필 + 하트 */}
        <View style={styles.avatarRow}>
          {/* 파트너 */}
          <View style={styles.avatarWrap}>
            {coupleInfo.partnerAvatarUrl ? (
              <Image source={{ uri: coupleInfo.partnerAvatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <User size={28} color="#E60076" strokeWidth={1.5} />
              </View>
            )}
            <Text style={styles.avatarName} numberOfLines={1}>{coupleInfo.partnerName}</Text>
          </View>

          {/* 중앙 하트 + D+day */}
          <View style={styles.heartWrap}>
            <LinearGradient
              colors={['#FDF2F8', '#F3EEFF']}
              style={styles.heartBg}
            >
              <Heart size={24} color="#E60076" fill="#E60076" />
            </LinearGradient>
            {dDay && <Text style={styles.dDay}>{dDay}</Text>}
            {coupleInfo.anniversaryDate && (
              <Text style={styles.anniversaryText}>
                {new Date(coupleInfo.anniversaryDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
              </Text>
            )}
          </View>

          {/* 나 */}
          <View style={styles.avatarWrap}>
            {myAvatarUrl ? (
              <Image source={{ uri: myAvatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.myAvatarFallback]}>
                <User size={28} color="#9810FA" strokeWidth={1.5} />
              </View>
            )}
            <Text style={styles.avatarName} numberOfLines={1}>{myName}</Text>
          </View>
        </View>

        {/* 파트너 스탯 */}
        {partnerProfile && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Coins size={14} color={Colors.gray[500]} />
              <Text style={styles.statText}>{partnerProfile.credits} 크레딧</Text>
            </View>
            <Text style={styles.statDivider}>·</Text>
            <Text style={styles.statText}>체크인 {partnerProfile.stats.checkinCount}</Text>
            <Text style={styles.statDivider}>·</Text>
            <Text style={styles.statText}>스크랩 {partnerProfile.stats.bookmarkCount}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    shadowColor: '#E60076',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarWrap: {
    alignItems: 'center',
    gap: 6,
    width: 80,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FBCFE8',
  },
  myAvatarFallback: {
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DDD6FE',
  },
  avatarName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[800],
    maxWidth: 80,
    textAlign: 'center',
  },
  heartWrap: {
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  heartBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
  },
  dDay: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E60076',
    letterSpacing: -0.5,
  },
  anniversaryText: {
    fontSize: 10,
    color: Colors.gray[400],
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(230, 0, 118, 0.08)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  statDivider: {
    color: Colors.gray[300],
  },
});
