/**
 * PropertyCard — card for displaying a property listing in search/browse lists.
 */

import * as React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  type StyleProp, type ViewStyle,
} from 'react-native';
import { BhkType, FurnishingStatus, PropertyStatus } from '@trustnest/shared';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadow } from '../theme';

// ─── Label maps ───────────────────────────────────────────────────────────────

const BHK_LABELS: Record<BhkType, string> = {
  [BhkType.STUDIO]:            'Studio',
  [BhkType.ONE_BHK]:           '1 BHK',
  [BhkType.TWO_BHK]:           '2 BHK',
  [BhkType.THREE_BHK]:         '3 BHK',
  [BhkType.FOUR_BHK_PLUS]:     '4+ BHK',
  [BhkType.VILLA]:              'Villa',
  [BhkType.INDEPENDENT_HOUSE]: 'Independent House',
};

const FURNISHING_LABELS: Record<FurnishingStatus, string> = {
  [FurnishingStatus.UNFURNISHED]:    'Unfurnished',
  [FurnishingStatus.SEMI_FURNISHED]: 'Semi',
  [FurnishingStatus.FULLY_FURNISHED]:'Fully furnished',
};

const STATUS_PILL: Record<PropertyStatus, { label: string; bg: string; fg: string }> = {
  [PropertyStatus.DRAFT]:  { label: 'Draft',  bg: '#F3F4F6', fg: '#374151' },
  [PropertyStatus.ACTIVE]: { label: 'Active', bg: colors.successLight, fg: colors.success },
  [PropertyStatus.PAUSED]: { label: 'Paused', bg: colors.warningLight, fg: colors.warning },
  [PropertyStatus.RENTED]: { label: 'Rented', bg: '#DBEAFE',           fg: '#1D4ED8'     },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PropertyCardProps {
  title: string;
  locality: string;
  city: string;
  bhkType: BhkType;
  furnishingStatus: FurnishingStatus;
  monthlyRentINR: number;
  depositINR: number;
  ownerName: string;
  ownerScore: number | null;
  imageUrl: string | null;
  status: PropertyStatus;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertyCard({
  title,
  locality,
  city,
  bhkType,
  furnishingStatus,
  monthlyRentINR,
  depositINR,
  ownerName,
  ownerScore,
  imageUrl,
  status,
  onPress,
  style,
}: PropertyCardProps): React.ReactElement {
  const pill    = STATUS_PILL[status] ?? STATUS_PILL[PropertyStatus.DRAFT];
  const initials = ownerName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, style]}
    >
      {/* Image section */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderEmoji}>🏠</Text>
          </View>
        )}
        {/* Status pill overlay */}
        <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
          <Text style={[styles.statusPillText, { color: pill.fg }]}>{pill.label}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.location}>{locality}, {city}</Text>

        {/* Chips row */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{BHK_LABELS[bhkType]}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{FURNISHING_LABELS[furnishingStatus]}</Text>
          </View>
        </View>

        {/* Rent row */}
        <View style={styles.rentRow}>
          <Text style={styles.rent}>
            ₹{monthlyRentINR.toLocaleString('en-IN')}/mo
          </Text>
          <Text style={styles.deposit}>
            Deposit ₹{depositINR.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Owner strip */}
        <View style={styles.ownerStrip}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.ownerName}>{ownerName}</Text>
          {ownerScore !== null && (
            <Text style={styles.ownerScore}>★ {ownerScore.toFixed(1)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius:    borderRadius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    overflow:        'hidden',
    ...shadow.card,
  },
  imageContainer: {
    width:    '100%',
    aspectRatio: 16 / 9,
  },
  image: {
    width:  '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex:            1,
    backgroundColor: '#F3F4F6',
    alignItems:      'center',
    justifyContent:  'center',
  },
  imagePlaceholderEmoji: {
    fontSize: 40,
  },
  statusPill: {
    position:          'absolute',
    top:               spacing.sm,
    right:             spacing.sm,
    borderRadius:      borderRadius.full,
    paddingVertical:   3,
    paddingHorizontal: 8,
  },
  statusPillText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  body: {
    padding: spacing.base,
    gap:     spacing.sm,
  },
  title: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      colors.text,
  },
  location: {
    fontSize: fontSize.sm,
    color:    colors.textSec,
  },
  chipsRow: {
    flexDirection: 'row',
    gap:           spacing.sm,
    flexWrap:      'wrap',
  },
  chip: {
    backgroundColor:   '#F3F4F6',
    borderRadius:      borderRadius.sm,
    paddingVertical:   3,
    paddingHorizontal: 8,
  },
  chipText: {
    fontSize:   fontSize.xs,
    color:      colors.textSec,
    fontWeight: fontWeight.medium,
  },
  rentRow: {
    flexDirection:  'row',
    alignItems:     'baseline',
    gap:            spacing.md,
  },
  rent: {
    fontSize:   fontSize.md,
    fontWeight: fontWeight.bold,
    color:      colors.primary,
  },
  deposit: {
    fontSize: fontSize.sm,
    color:    colors.textSec,
  },
  ownerStrip: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
    marginTop:     spacing.xs,
  },
  avatar: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.bold,
    color:      '#FFFFFF',
  },
  ownerName: {
    fontSize:   fontSize.sm,
    color:      colors.text,
    flex:       1,
  },
  ownerScore: {
    fontSize:   fontSize.sm,
    color:      colors.warning,
    fontWeight: fontWeight.semibold,
  },
});
