import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppButton } from '@/components/ui/button';
import { Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RouteSign } from '@/api/navigation/navigation';
import { getFreshnessInfo } from './revalidation-sign-marker';

interface RevalidationSignDetailsCardProps {
  sign: RouteSign;
  onClose: () => void;
  onRevalidate?: (sign: RouteSign) => void;
}

export function RevalidationSignDetailsCard({
  sign,
  onClose,
  onRevalidate,
}: RevalidationSignDetailsCardProps) {
  const theme = useTheme();
  const [cropError, setCropError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const { scorePercent, isStale, isModerate, isFresh } = getFreshnessInfo(sign);
  const displayScore = scorePercent ?? 75;

  const freshnessColor = isStale ? '#EF4444' : isModerate ? '#F59E0B' : '#10B981';
  const freshnessLabel = isStale
    ? 'Needs Re-evaluation'
    : isModerate
      ? 'Moderate Freshness'
      : 'Verified & Fresh';

  const handleAction = async () => {
    setIsSubmitting(true);

    // =========================================================================
    // TODO: Implement action API call (e.g. submit revalidation evidence,
    // upload field photos, or create re-evaluation task) once backend APIs are provided.
    // =========================================================================

    if (onRevalidate) {
      onRevalidate(sign);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedMessage('Revalidation request noted. API integration pending.');
      setTimeout(() => setSubmittedMessage(null), 3500);
    }, 600);
  };

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          shadowColor: '#09233C',
        },
      ]}
    >
      {/* Header Row: Title & Close Button */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <View style={styles.codeRow}>
            <Text style={[styles.signCode, { color: theme.primary }]}>
              {sign.signCode || 'SIGN'}
            </Text>
            {isStale ? (
              <View style={[styles.statusBadge, { backgroundColor: '#EF444420' }]}>
                <MaterialCommunityIcons color="#EF4444" name="alert-circle-outline" size={13} />
                <Text style={[styles.statusBadgeText, { color: '#EF4444' }]}>Re-evaluation Needed</Text>
              </View>
            ) : isFresh ? (
              <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}>
                <MaterialCommunityIcons color="#10B981" name="check-circle-outline" size={13} />
                <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>Active</Text>
              </View>
            ) : null}
          </View>
          <Text numberOfLines={2} style={[styles.signName, { color: theme.text }]}>
            {sign.name || sign.signCode}
          </Text>
          {sign.roadName || sign.displayAddress ? (
            <Text numberOfLines={1} style={[styles.addressText, { color: theme.grey }]}>
              {sign.displayAddress || sign.roadName}
            </Text>
          ) : null}
        </View>

        <AppButton
          accessibilityLabel="Close sign details"
          onPress={onClose}
          style={styles.closeButton}
          variant="ghost"
        >
          <MaterialCommunityIcons color={theme.grey} name="close" size={20} />
        </AppButton>
      </View>

      {/* Media & Freshness Section */}
      <View style={styles.bodyRow}>
        {/* Sign Thumbnail images */}
        <View style={styles.imageGroup}>
          {sign.imageUrl ? (
            <Image
              accessibilityLabel={sign.name}
              resizeMode="contain"
              source={{ uri: sign.imageUrl }}
              style={styles.repImage}
            />
          ) : null}
          {sign.actualCropUrl && !cropError ? (
            <Image
              accessibilityLabel="Field capture crop"
              onError={() => setCropError(true)}
              resizeMode="cover"
              source={{ uri: sign.actualCropUrl }}
              style={styles.cropImage}
            />
          ) : null}
        </View>

        {/* Freshness Score & Info */}
        <View style={styles.freshnessContainer}>
          <View style={styles.freshnessHeader}>
            <Text style={[styles.freshnessLabel, { color: theme.grey }]}>Freshness Score</Text>
            <Text style={[styles.freshnessValue, { color: freshnessColor }]}>
              {displayScore}%
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarTrack, { backgroundColor: `${theme.grey}25` }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(5, displayScore))}%`, backgroundColor: freshnessColor },
              ]}
            />
          </View>

          <Text style={[styles.freshnessSubtext, { color: freshnessColor }]}>
            {freshnessLabel}
          </Text>
        </View>
      </View>

      {/* Notification Toast if submitted */}
      {submittedMessage ? (
        <View style={styles.feedbackBanner}>
          <MaterialCommunityIcons color="#0671eb" name="information-outline" size={16} />
          <Text style={styles.feedbackText}>{submittedMessage}</Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <AppButton
          accessibilityLabel="Revalidate sign"
          disabled={isSubmitting}
          onPress={handleAction}
          style={[styles.actionButton, { backgroundColor: isStale ? '#EF4444' : theme.primary }]}
          variant="primary"
        >
          <MaterialCommunityIcons color="#FFFFFF" name="camera-retake-outline" size={18} />
          <Text style={styles.actionButtonText}>
            {isStale ? 'Revalidate This Sign' : 'Inspect Sign'}
          </Text>
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: Rounded.lg ?? 16,
    padding: Spacing.four,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: Spacing.two,
    gap: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  signCode: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  signName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  addressText: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: 4,
  },
  imageGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  repImage: {
    width: 44,
    height: 44,
  },
  cropImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  freshnessContainer: {
    flex: 1,
    gap: 4,
  },
  freshnessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freshnessLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  freshnessValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  freshnessSubtext: {
    fontSize: 11,
    fontWeight: '600',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: Spacing.two,
    borderRadius: 8,
    gap: Spacing.one,
  },
  feedbackText: {
    fontSize: 12,
    color: '#1E40AF',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: Spacing.one,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: Spacing.one,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
