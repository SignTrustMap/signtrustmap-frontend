import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = Rounded.sm,
  style,
}: SkeletonProps) {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: `${theme.grey}30`,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

export type SkeletonListItemProps = {
  showThumbnail?: boolean;
  thumbnailSize?: number;
  thumbnailBorderRadius?: number;
  lines?: number;
  variant?: 'card' | 'row';
  style?: StyleProp<ViewStyle>;
};

export function SkeletonListItem({
  showThumbnail = true,
  thumbnailSize = 52,
  thumbnailBorderRadius = Rounded.md,
  lines = 2,
  variant = 'card',
  style,
}: SkeletonListItemProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        variant === 'card'
          ? [
              styles.cardContainer,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]
          : styles.rowContainer,
        style,
      ]}
    >
      {showThumbnail ? (
        <Skeleton
          borderRadius={thumbnailBorderRadius}
          height={thumbnailSize}
          width={thumbnailSize}
        />
      ) : null}

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Skeleton height={15} width="60%" />
          <Skeleton height={14} width="22%" borderRadius={Rounded.round} />
        </View>

        <Skeleton height={12} width="40%" style={{ marginTop: 2 }} />

        {lines > 2 ? (
          <Skeleton height={11} width="75%" style={{ marginTop: 2 }} />
        ) : null}

        <View style={styles.footerRow}>
          <Skeleton height={10} width="30%" />
        </View>
      </View>
    </View>
  );
}

export type ListSkeletonProps = {
  count?: number;
  variant?: 'card' | 'row';
  showThumbnail?: boolean;
  thumbnailSize?: number;
  thumbnailBorderRadius?: number;
  lines?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function ListSkeleton({
  count = 5,
  variant = 'card',
  showThumbnail = true,
  thumbnailSize = 52,
  thumbnailBorderRadius = Rounded.md,
  lines = 2,
  gap = Spacing.two,
  style,
  itemStyle,
  accessibilityLabel = 'Đang tải dữ liệu danh sách…',
}: ListSkeletonProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessible={true}
      style={[{ gap }, style]}
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonListItem
          key={`skeleton-item-${index}`}
          lines={lines}
          showThumbnail={showThumbnail}
          style={itemStyle}
          thumbnailBorderRadius={thumbnailBorderRadius}
          thumbnailSize={thumbnailSize}
          variant={variant}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Rounded.lg,
    borderWidth: 1,
    gap: Spacing.two,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
});
