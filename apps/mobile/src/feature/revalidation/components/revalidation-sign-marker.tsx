import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { RouteSign } from '@/api/navigation/navigation';

interface RevalidationSignMarkerProps {
  sign: RouteSign;
  isSelected?: boolean;
}

export function getFreshnessInfo(sign: RouteSign) {
  const rawScore = sign.freshnessScore;
  const scorePercent =
    rawScore !== undefined
      ? rawScore <= 1
        ? Math.round(rawScore * 100)
        : Math.round(rawScore)
      : undefined;

  const isStale =
    sign.status === 'STALE' ||
    sign.status === 'RETIRED' ||
    (scorePercent !== undefined && scorePercent < 60);

  const isModerate = scorePercent !== undefined && scorePercent >= 60 && scorePercent < 80;
  const isFresh = scorePercent !== undefined && scorePercent >= 80;

  return {
    scorePercent,
    isStale,
    isModerate,
    isFresh,
  };
}

export function RevalidationSignMarker({ sign, isSelected = false }: RevalidationSignMarkerProps) {
  const [hasError, setHasError] = useState(false);
  const { scorePercent, isStale, isModerate, isFresh } = getFreshnessInfo(sign);

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      {/* Sign Icon Circle — matching navigation flow */}
      <View
        style={[
          styles.markerBubble,
          isStale && styles.markerBubbleStale,
          isModerate && styles.markerBubbleModerate,
          isSelected && styles.markerBubbleSelected,
        ]}
      >
        {sign.imageUrl && !hasError ? (
          <Image
            accessibilityLabel={sign.name || sign.signCode}
            source={{ uri: sign.imageUrl }}
            onError={() => setHasError(true)}
            resizeMode="contain"
            style={styles.signImage}
          />
        ) : (
          <MaterialCommunityIcons color="#09233C" name="traffic-light" size={20} />
        )}
      </View>

      {/* Freshness Indicator Badge on top-right corner */}
      {isStale ? (
        <View style={[styles.indicatorBadge, styles.badgeStale]}>
          <MaterialCommunityIcons color="#FFFFFF" name="alert" size={10} />
        </View>
      ) : isModerate ? (
        <View style={[styles.indicatorBadge, styles.badgeModerate]}>
          <Text style={styles.badgeText}>{scorePercent}%</Text>
        </View>
      ) : isFresh ? (
        <View style={[styles.indicatorBadge, styles.badgeFresh]}>
          <MaterialCommunityIcons color="#FFFFFF" name="check" size={8} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  containerSelected: {
    transform: [{ scale: 1.15 }],
  },
  markerBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0671eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 4,
  },
  markerBubbleStale: {
    borderColor: '#EF4444',
    borderWidth: 2.5,
  },
  markerBubbleModerate: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  markerBubbleSelected: {
    borderColor: '#2563EB',
    borderWidth: 3,
    backgroundColor: '#EFF6FF',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },
  signImage: {
    width: 28,
    height: 28,
  },
  indicatorBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 5,
  },
  badgeStale: {
    backgroundColor: '#EF4444',
  },
  badgeModerate: {
    backgroundColor: '#F59E0B',
  },
  badgeFresh: {
    backgroundColor: '#10B981',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
});
