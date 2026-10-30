import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { RouteSign } from '@/api/navigation/navigation';

interface RevalidationSignMarkerProps {
  sign: RouteSign;
  isSelected?: boolean;
  isDimmed?: boolean;
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
    sign.status === 'RETIRED' ||
    (scorePercent !== undefined && scorePercent < 50) ||
    (scorePercent === undefined && (sign.status === 'STALE' || Boolean(sign.taskId)));

  const isModerate = !isStale && scorePercent !== undefined && scorePercent >= 50 && scorePercent < 80;
  const isFresh = !isStale && scorePercent !== undefined && scorePercent >= 80;

  return {
    scorePercent,
    isStale,
    isModerate,
    isFresh,
  };
}

export function RevalidationSignMarker({
  sign,
  isSelected = false,
  isDimmed = false,
}: RevalidationSignMarkerProps) {
  const [hasError, setHasError] = useState(false);
  const { isStale, isModerate, isFresh } = getFreshnessInfo(sign);

  return (
    <View
      style={[
        styles.container,
        isSelected && styles.containerSelected,
        isDimmed && styles.containerDimmed,
      ]}
    >
      {/* Outer Blue Focus Ring when selected */}
      {isSelected ? <View style={styles.selectedHalo} /> : null}

      {/* Main Sign Icon Bubble */}
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
            onError={() => setHasError(true)}
            resizeMode="contain"
            source={{ uri: sign.imageUrl }}
            style={styles.signImage}
          />
        ) : (
          <MaterialCommunityIcons color="#09233C" name="traffic-light" size={18} />
        )}
      </View>

      {/* Subtle State Indicators on Top-Right Corner */}
      {isStale ? (
        <View style={[styles.indicatorBadge, styles.badgeStale]}>
          <Text style={styles.badgeExclamation}>!</Text>
        </View>
      ) : isModerate ? (
        <View style={[styles.indicatorDot, styles.dotModerate]} />
      ) : isFresh ? (
        <View style={[styles.indicatorDot, styles.dotFresh]} />
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
    transform: [{ scale: 1.18 }],
    zIndex: 10,
  },
  containerDimmed: {
    opacity: 0.55,
    transform: [{ scale: 0.92 }],
  },
  selectedHalo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#0671EB',
    backgroundColor: 'rgba(6, 113, 235, 0.16)',
  },
  markerBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  markerBubbleStale: {
    borderColor: '#E11D48',
  },
  markerBubbleModerate: {
    borderColor: '#EA580C',
  },
  markerBubbleSelected: {
    borderColor: '#0671EB',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  signImage: {
    width: 24,
    height: 24,
  },
  indicatorBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  badgeStale: {
    backgroundColor: '#E11D48',
  },
  badgeExclamation: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 9,
    textAlign: 'center',
  },
  indicatorDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  dotModerate: {
    backgroundColor: '#EA580C',
  },
  dotFresh: {
    backgroundColor: '#059669',
  },
});
