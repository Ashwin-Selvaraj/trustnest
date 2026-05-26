/**
 * PhotoGallery — horizontal paging image gallery with dot indicators.
 */

import * as React from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet,
  useWindowDimensions, type StyleProp, type ViewStyle,
} from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhotoGalleryProps {
  images: string[];
  height?: number;
  onImagePress?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PhotoGallery({
  images,
  height = 220,
  onImagePress,
  style,
}: PhotoGalleryProps): React.ReactElement {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const handleScroll = React.useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const idx = Math.round(event.nativeEvent.contentOffset.x / width);
      setCurrentIndex(idx);
    },
    [width],
  );

  if (images.length === 0) {
    return (
      <View style={[styles.placeholder, { height }, style]}>
        <Text style={styles.placeholderEmoji}>📷</Text>
        <Text style={styles.placeholderText}>No photos</Text>
      </View>
    );
  }

  return (
    <View style={[{ height }, style]}>
      <FlatList
        data={images}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onImagePress?.(index)}
            style={{ width }}
          >
            <Image
              source={{ uri: item }}
              style={{ width, height }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      />

      {/* Count badge */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>
          {currentIndex + 1} / {images.length}
        </Text>
      </View>

      {/* Dot indicators */}
      {images.length > 1 && (
        <View style={styles.dotsRow}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#F3F4F6',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  countBadge: {
    position:          'absolute',
    top:               spacing.sm,
    right:             spacing.sm,
    backgroundColor:   'rgba(0,0,0,0.55)',
    borderRadius:      borderRadius.sm,
    paddingVertical:   3,
    paddingHorizontal: 8,
  },
  countText: {
    color:    '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsRow: {
    position:       'absolute',
    bottom:         spacing.sm,
    left:           0,
    right:          0,
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            5,
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotInactive: {
    backgroundColor: colors.border,
  },
});
