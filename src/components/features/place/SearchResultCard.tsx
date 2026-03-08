import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from '@constants/theme';
import { isGoogleImage } from '@utils/format';
import type { Place } from '@/types';

const SCORE_COLORS = ['#9810FA', '#E60076'] as const;
const SPONSOR_COLORS = ['#FF6900', '#F0B100'] as const;

interface Props {
  place: Place & { vibeScore?: number; isSponsored?: boolean };
  onPress: (place: Place) => void;
  mode?: 'list' | 'grid';
}

// -- List card (Figma match) --------------------------------------------------
function ListCard({ place, onPress }: Props) {
  const vibe = place.tags?.[0];

  return (
    <TouchableOpacity
      onPress={() => onPress(place)}
      activeOpacity={0.85}
      style={styles.listCard}
    >
      {place.isSponsored && (
        <LinearGradient
          colors={SPONSOR_COLORS}
          style={styles.sponsorBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.sponsorText}>{'스폰서'}</Text>
        </LinearGradient>
      )}

      <View style={styles.listInner}>
        <View style={styles.listImgWrap}>
          {place.imageUrl ? (
            <Image source={{ uri: place.imageUrl }} style={styles.listImg} resizeMode="cover" />
          ) : (
            <View style={[styles.listImg, styles.imgPlaceholder]} />
          )}
          <View style={[styles.imgLabel, isGoogleImage(place.imageUrl) ? styles.imgLabelReal : styles.imgLabelDefault]}>
            <Text style={styles.imgLabelText}>
              {isGoogleImage(place.imageUrl) ? '📷 실제 이미지' : '🖼 Vibly 기본 이미지'}
            </Text>
          </View>
        </View>

        <View style={styles.listInfo}>
          <Text style={styles.listName} numberOfLines={1}>{place.name}</Text>
          <Text style={styles.listCategory}>{place.categoryLabel ?? place.category}</Text>

          <View style={styles.tagRow}>
            {Boolean(vibe) && (
              <View style={styles.vibeTag}>
                <Text style={styles.vibeTagText}>{vibe}</Text>
              </View>
            )}
            {place.vibeScore != null && place.vibeScore > 0 && (
              <LinearGradient
                colors={SCORE_COLORS}
                style={styles.scoreBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.scoreText}>{place.vibeScore}{'점'}</Text>
              </LinearGradient>
            )}
          </View>

          <View style={styles.metaRow}>
            {Boolean(place.distance) && (
              <Text style={styles.metaText}>{'📍 '}{place.distance}</Text>
            )}
            {/* Google 평점 우선, 없으면 Vibly 평점 */}
            {(place.googleRating ?? 0) > 0 ? (
              <Text style={styles.metaText}>{'⭐ '}{place.googleRating!.toFixed(1)}</Text>
            ) : (place.rating ?? 0) > 0 ? (
              <Text style={styles.metaText}>{'★ '}{place.rating.toFixed(1)}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// -- Grid card (Figma match) --------------------------------------------------
function GridCard({ place, onPress }: Props) {
  const vibe = place.tags?.[0];

  return (
    <TouchableOpacity
      onPress={() => onPress(place)}
      activeOpacity={0.85}
      style={styles.gridCard}
    >
      <View style={styles.gridImgWrap}>
        {place.imageUrl ? (
          <Image source={{ uri: place.imageUrl }} style={styles.gridImg} resizeMode="cover" />
        ) : (
          <View style={[styles.gridImg, styles.imgPlaceholder]} />
        )}
        <View style={[styles.imgLabel, isGoogleImage(place.imageUrl) ? styles.imgLabelReal : styles.imgLabelDefault]}>
          <Text style={styles.imgLabelText}>
            {isGoogleImage(place.imageUrl) ? '📷 실제 이미지' : '🖼 Vibly 기본 이미지'}
          </Text>
        </View>
      </View>

      {place.isSponsored && (
        <LinearGradient
          colors={SPONSOR_COLORS}
          style={styles.gridSponsorBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.sponsorText}>{'스폰서'}</Text>
        </LinearGradient>
      )}

      <View style={styles.gridInfo}>
        <Text style={styles.gridName} numberOfLines={1}>{place.name}</Text>
        <Text style={styles.gridCategory}>{place.categoryLabel ?? place.category}</Text>

        {Boolean(vibe) && (
          <View style={styles.gridVibeTag}>
            <Text style={styles.gridVibeTagText}>{vibe}</Text>
          </View>
        )}

        {place.vibeScore != null && place.vibeScore > 0 && (
          <LinearGradient
            colors={SCORE_COLORS}
            style={styles.gridScoreBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.gridScoreText}>{place.vibeScore}{'점'}</Text>
          </LinearGradient>
        )}
      </View>
    </TouchableOpacity>
  );
}

// -- Unified export -----------------------------------------------------------
export function SearchResultCard({ place, onPress, mode = 'list' }: Props) {
  return mode === 'grid'
    ? <GridCard place={place} onPress={onPress} />
    : <ListCard place={place} onPress={onPress} />;
}

// -- Styles -------------------------------------------------------------------
const styles = StyleSheet.create({
  imgPlaceholder: { backgroundColor: Colors.primary[100] },
  listImgWrap: {
    width: 112,
    height: 112,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridImgWrap: {
    width: '100%' as const,
    height: 160,
    overflow: 'hidden',
  },
  imgLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    alignItems: 'center',
  },
  imgLabelText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '500' as const,
  },
  imgLabelReal: { backgroundColor: 'rgba(0,0,0,0.5)' },
  imgLabelDefault: { backgroundColor: 'rgba(152,16,250,0.75)' },
  sponsorText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },

  // List card
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'stretch',
    height: 144,
    ...Shadow.sm,
  },
  sponsorBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  listInner: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
    height: 144,
  },
  listImg: {
    width: 112,
    height: 112,
    borderRadius: 16,
  },
  listInfo: {
    flex: 1,
    height: 112,
  },
  listName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#101828',
    lineHeight: 24,
  },
  listCategory: {
    fontSize: FontSize.xs,
    color: '#6A7282',
    lineHeight: 16,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  vibeTag: {
    backgroundColor: '#F3E8FF',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  vibeTagText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: '#8200DB',
  },
  scoreBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: '#6A7282',
    fontWeight: FontWeight.medium,
  },

  // Grid card
  gridCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  gridImg: {
    width: '100%',
    height: 160,
  },
  gridSponsorBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  gridInfo: {
    padding: Spacing.md,
    gap: 4,
    alignItems: 'center',
  },
  gridName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#101828',
    textAlign: 'center',
  },
  gridCategory: {
    fontSize: FontSize.xs,
    color: '#6A7282',
    textAlign: 'center',
  },
  gridVibeTag: {
    backgroundColor: '#F3E8FF',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    width: '100%',
    alignItems: 'center',
  },
  gridVibeTagText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: '#8200DB',
  },
  gridScoreBadge: {
    borderRadius: BorderRadius.full,
    paddingVertical: 4,
    alignItems: 'center',
    width: '100%',
  },
  gridScoreText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
