import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  const [cropError, setCropError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Smooth entrance animation
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideAnim.setValue(60);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 22,
        mass: 0.8,
        stiffness: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [sign.id, slideAnim, opacityAnim]);

  const { scorePercent, isStale, isModerate, isFresh } = getFreshnessInfo(sign);
  const displayScore = scorePercent ?? 75;

  // Determine Semantic Status Info
  const normalizedStatus = (sign.status || '').toUpperCase();
  const isExplicitActive = normalizedStatus === 'ACTIVE';
  const isExplicitRetired = normalizedStatus === 'RETIRED';
  const isExplicitModerated = normalizedStatus === 'MODERATED_OVERRIDE';

  let statusConfig: {
    label: string;
    bg: string;
    border: string;
    text: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
  };

  if (isExplicitRetired) {
    statusConfig = {
      label: 'Retired Sign',
      bg: '#F3F4F6',
      border: '#E5E7EB',
      text: '#4B5563',
      icon: 'archive-cancel-outline',
    };
  } else if (isExplicitModerated) {
    statusConfig = {
      label: 'Moderated Override',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      text: '#7C3AED',
      icon: 'shield-account',
    };
  } else if (isStale || normalizedStatus === 'STALE') {
    statusConfig = {
      label: 'Stale · Re-evaluation Needed',
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#DC2626',
      icon: 'alert-circle',
    };
  } else if (isModerate) {
    statusConfig = {
      label: 'Moderate Freshness',
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#D97706',
      icon: 'clock-alert-outline',
    };
  } else {
    statusConfig = {
      label: isExplicitActive ? 'Active & Verified' : 'Active Sign',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      text: '#059669',
      icon: 'check-decagram',
    };
  }

  const freshnessColor = isStale ? '#EF4444' : isModerate ? '#F59E0B' : '#10B981';

  const hasSubmittedCrop = Boolean(
    sign.actualCropUrl &&
    sign.actualCropUrl !== sign.imageUrl &&
    !cropError,
  );

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
      setSubmittedMessage('Revalidation request registered. API integration pending.');
      setTimeout(() => setSubmittedMessage(null), 3500);
    }, 600);
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          bottom: Math.max(16, insets.bottom + 8),
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Drag handle pill */}
      <View style={styles.dragHandleWrap}>
        <View style={styles.dragHandle} />
      </View>

      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerMain}>
          {/* Sign Name + Status Badge */}
          <View style={styles.titleWithStatusRow}>
            <Text numberOfLines={1} style={[styles.signTitle, { color: theme.text }]}>
              {sign.name || sign.signCode || 'Traffic Sign'}
            </Text>

            {/* Status Badge right next to Sign Name */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bg, borderColor: statusConfig.border },
              ]}
            >
              <MaterialCommunityIcons
                color={statusConfig.text}
                name={statusConfig.icon}
                size={12}
              />
              <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Location / Road Name */}
          <View style={styles.locationRow}>
            <MaterialCommunityIcons color={theme.placeholder} name="map-marker-outline" size={13} />
            <Text numberOfLines={1} style={[styles.locationText, { color: theme.placeholder }]}>
              {sign.signCode && sign.signCode !== sign.name ? `${sign.signCode} · ` : ''}
              {sign.displayAddress || sign.roadName || `${sign.coordinate[1].toFixed(5)}° N, ${sign.coordinate[0].toFixed(5)}° E`}
            </Text>
          </View>
        </View>

        {/* Close Button */}
        <Pressable
          accessibilityLabel="Close sign details"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onClose}
          style={styles.closeButton}
        >
          <MaterialCommunityIcons color={theme.grey} name="close-circle-outline" size={24} />
        </Pressable>
      </View>

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================= */}
        {/* DUAL COMPARISON GRID: Map Standard Sign VS Submitted Field Photo  */}
        {/* ================================================================= */}
        <View style={styles.comparisonGrid}>
          {/* Card 1: Map Sign Image (Standard) */}
          <View
            style={[
              styles.imageCard,
              {
                backgroundColor: theme.backgroundSelected,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Clear Header Label */}
            <View style={styles.imageCardHeader}>
              <View style={[styles.labelPill, { backgroundColor: `${theme.primary}16` }]}>
                <MaterialCommunityIcons color={theme.primary} name="map-legend" size={13} />
                <Text style={[styles.labelText, { color: theme.primary }]}>Map Sign</Text>
              </View>
              <Text style={[styles.imageTagSub, { color: theme.grey }]}>Standard</Text>
            </View>

            {/* Image Preview Box */}
            <View style={styles.imageBox}>
              {sign.imageUrl ? (
                <Image
                  accessibilityLabel={`Standard graphic for ${sign.name}`}
                  contentFit="contain"
                  source={{ uri: sign.imageUrl }}
                  style={styles.mapStandardImage}
                  transition={200}
                />
              ) : (
                <View style={styles.noImageBox}>
                  <MaterialCommunityIcons color={theme.grey} name="traffic-light" size={22} />
                  <Text style={[styles.noImageText, { color: theme.grey }]}>No graphic</Text>
                </View>
              )}
            </View>

            <Text numberOfLines={1} style={[styles.imageFooterNote, { color: theme.grey }]}>
              Official standard graphic
            </Text>
          </View>

          {/* Card 2: Submitted Sign Image (Field Capture) */}
          <View
            style={[
              styles.imageCard,
              {
                backgroundColor: theme.backgroundSelected,
                borderColor: hasSubmittedCrop ? '#93C5FD' : theme.border,
              },
            ]}
          >
            {/* Clear Header Label */}
            <View style={styles.imageCardHeader}>
              <View
                style={[
                  styles.labelPill,
                  {
                    backgroundColor: hasSubmittedCrop ? 'rgba(37, 99, 235, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  color={hasSubmittedCrop ? '#2563EB' : theme.grey}
                  name="camera-outline"
                  size={12}
                />
                <Text
                  style={[
                    styles.labelText,
                    { color: hasSubmittedCrop ? '#2563EB' : theme.grey },
                  ]}
                >
                  Submitted Sign
                </Text>
              </View>
              <Text style={[styles.imageTagSub, { color: theme.grey }]}>Field Crop</Text>
            </View>

            {/* Image Preview Box */}
            <View style={styles.imageBox}>
              {hasSubmittedCrop ? (
                <Image
                  accessibilityLabel={`Submitted camera crop for ${sign.name}`}
                  contentFit="cover"
                  onError={() => setCropError(true)}
                  source={{ uri: sign.actualCropUrl }}
                  style={styles.fieldCropImage}
                  transition={200}
                />
              ) : (
                <View style={styles.placeholderBox}>
                  <MaterialCommunityIcons
                    color={theme.placeholder}
                    name="camera-off-outline"
                    size={22}
                  />
                  <Text style={[styles.placeholderText, { color: theme.placeholder }]}>
                    No field photo
                  </Text>
                  <Text style={[styles.placeholderSub, { color: theme.placeholder }]}>
                    Needs on-site capture
                  </Text>
                </View>
              )}
            </View>

            <Text numberOfLines={1} style={[styles.imageFooterNote, { color: theme.grey }]}>
              {hasSubmittedCrop ? 'Latest camera crop' : 'Awaiting surveyor photo'}
            </Text>
          </View>
        </View>

        {/* ================================================================= */}
        {/* FRESHNESS & AUDIT INFO BAR                                        */}
        {/* ================================================================= */}
        <View
          style={[
            styles.freshnessCard,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.freshnessTopRow}>
            <View style={styles.freshnessMetricLabel}>
              <MaterialCommunityIcons color={freshnessColor} name="shield-refresh-outline" size={17} />
              <Text style={[styles.freshnessTitle, { color: theme.text }]}>Freshness Quality</Text>
            </View>
            <View style={styles.scorePill}>
              <Text style={[styles.scoreValue, { color: freshnessColor }]}>
                {displayScore}%
              </Text>
            </View>
          </View>

          {/* Progress bar meter */}
          <View style={[styles.meterTrack, { backgroundColor: `${theme.grey}25` }]}>
            <View
              style={[
                styles.meterFill,
                {
                  backgroundColor: freshnessColor,
                  width: `${Math.min(100, Math.max(6, displayScore))}%`,
                },
              ]}
            />
          </View>

          <View style={styles.freshnessDetailRow}>

            {sign.lastVerifiedAt ? (
              <Text style={[styles.lastVerifiedDate, { color: theme.grey }]}>
                Last checked: {sign.lastVerifiedAt.split('T')[0]}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Feedback message banner if triggered */}
        {submittedMessage ? (
          <View style={styles.feedbackBanner}>
            <MaterialCommunityIcons color="#0671eb" name="information" size={18} />
            <Text style={styles.feedbackText}>{submittedMessage}</Text>
          </View>
        ) : null}

        {/* ================================================================= */}
        {/* ACTION BUTTONS                                                    */}
        {/* ================================================================= */}
        <View style={styles.actionRow}>
          <AppButton
            accessibilityLabel="Revalidate sign on-site"
            disabled={isSubmitting}
            onPress={handleAction}
            style={[
              styles.primaryActionBtn,
              { backgroundColor: isStale ? '#EF4444' : theme.primary },
            ]}
            variant="primary"
          >
            <MaterialCommunityIcons color="#FFFFFF" name="camera-retake-outline" size={19} />
            <Text style={styles.primaryActionText}>
              {isStale ? 'Revalidate This Sign' : 'Inspect & Update Sign'}
            </Text>
          </AppButton>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    maxHeight: '56%',
    borderRadius: 20,
    borderWidth: 1.2,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 20,
    overflow: 'hidden',
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 2,
  },
  dragHandle: {
    width: 32,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.two,
  },
  headerMain: {
    flex: 1,
    paddingRight: Spacing.two,
    gap: 2,
  },
  titleWithStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    gap: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  signTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  closeButton: {
    padding: 2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  imageCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 7,
    gap: 5,
  },
  imageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  imageTagSub: {
    fontSize: 9,
    fontWeight: '600',
  },
  imageBox: {
    height: 72,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapStandardImage: {
    width: 48,
    height: 48,
  },
  fieldCropImage: {
    width: '100%',
    height: '100%',
  },
  noImageBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  noImageText: {
    fontSize: 10,
    fontWeight: '600',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    gap: 1,
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  placeholderSub: {
    fontSize: 8,
    textAlign: 'center',
  },
  imageFooterNote: {
    fontSize: 9,
    textAlign: 'center',
  },
  freshnessCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.two,
    gap: 6,
  },
  freshnessTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freshnessMetricLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  freshnessTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  meterTrack: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
    width: '100%',
  },
  meterFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  freshnessDetailRow: {
    gap: 2,
  },
  freshnessDesc: {
    fontSize: 11,
    fontWeight: '600',
  },
  lastVerifiedDate: {
    fontSize: 11,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  feedbackText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
