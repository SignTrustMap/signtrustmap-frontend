import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RouteSign } from '@/api/navigation/navigation';
import { getFreshnessInfo } from './revalidation-sign-marker';
import { formatDate } from '@/utils/format-date';
import { useGetTaskEvidences } from '../hooks/use-revalidation';
import { resolveS3Url } from '@/api/reviews/review-workflow';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RevalidationSignDetailsCardProps {
  sign: RouteSign;
  taskId?: string;
  onClose: () => void;
  onRevalidate?: (sign: RouteSign) => void;
  onCardHeightChange?: (height: number) => void;
}

export function RevalidationSignDetailsCard({
  sign,
  taskId: propTaskId,
  onClose,
  onRevalidate,
  onCardHeightChange,
}: RevalidationSignDetailsCardProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [isExpanded, setIsExpanded] = useState(true);
  const [cropError, setCropError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);

  const lat = sign.coordinate?.[1] ?? (sign as any)?.latitude;
  const lng = sign.coordinate?.[0] ?? (sign as any)?.longitude;

  const handleCopyCoordinates = async () => {
    try {
      if (lat !== undefined && lng !== undefined) {
        await Clipboard.setStringAsync(`${lat}, ${lng}`);
        setCopiedCoords(true);
        setTimeout(() => setCopiedCoords(false), 2000);
      }
    } catch (err) {
      console.warn('[RevalidationSignDetailsCard] Failed to copy coordinates:', err);
    }
  };

  const resolvedTaskId =
    propTaskId || sign.taskId || (sign.id.startsWith('reval-') ? sign.id : undefined);
  const { data: evidences = [], isLoading: isLoadingEvidences } =
    useGetTaskEvidences(resolvedTaskId);
  const evidenceCount = evidences.length;
  const latestEvidence = evidenceCount > 0 ? evidences[0] : null;

  const rawCrop = sign.actualCropUrl || latestEvidence?.mediaUrl;
  const displaySubmittedCrop = rawCrop ? resolveS3Url(rawCrop) : undefined;
  const hasSubmittedCrop = Boolean(displaySubmittedCrop && !cropError);

  // Entrance slide animation
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsExpanded(true);
    slideAnim.setValue(50);
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
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [sign.id, slideAnim, opacityAnim]);

  const { scorePercent, isStale, isModerate, isFresh } = getFreshnessInfo(sign);
  const displayScore = scorePercent ?? 75;

  // Toggle expand / collapse
  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  // Drag handle pan responder to expand / collapse
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -20 && !isExpanded) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsExpanded(true);
        } else if (gestureState.dy > 20 && isExpanded) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsExpanded(false);
        }
      },
    }),
  ).current;

  // Semantic Status
  const normalizedStatus = (sign.status || '').toUpperCase();
  const isExplicitRetired = normalizedStatus === 'RETIRED';

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
  } else if (isFresh || displayScore >= 80) {
    statusConfig = {
      label: 'Active & Verified',
      bg: '#ECFDF5',
      border: '#6EE7B7',
      text: '#047857',
      icon: 'check-decagram',
    };
  } else if (isModerate || displayScore >= 50) {
    statusConfig = {
      label: 'Moderate Freshness',
      bg: '#FFF7ED',
      border: '#FDBA74',
      text: '#C2410C',
      icon: 'clock-alert-outline',
    };
  } else {
    statusConfig = {
      label: 'Needs Re-evaluation',
      bg: '#FFF1F2',
      border: '#FDA4AF',
      text: '#BE123C',
      icon: 'alert-circle',
    };
  }

  const freshnessColor =
    displayScore >= 80 && !isExplicitRetired
      ? '#047857'
      : displayScore >= 50 && !isExplicitRetired
        ? '#C2410C'
        : '#B91C1C';

  // Clear Action CTA wording
  const primaryCtaText = 'Inspect';

  const handleAction = () => {
    if (onRevalidate) {
      onRevalidate(sign);
    }
  };

  return (
    <Animated.View
      onLayout={(e) => onCardHeightChange?.(e.nativeEvent.layout.height)}
      onStartShouldSetResponder={() => true}
      onTouchEnd={(e) => e.stopPropagation()}
      style={[
        styles.sheetContainer,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          bottom: Math.max(14, insets.bottom + 8),
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Draggable Top Handle */}
      <View {...panResponder.panHandlers} style={styles.dragHandleBar}>
        <View style={styles.dragPill} />
      </View>

      {/* ================================================================= */}
      {/* COLLAPSED STATE (Compact peek row)                                 */}
      {/* ================================================================= */}
      {!isExpanded ? (
        <Pressable
          accessibilityLabel="Expand sign details"
          accessibilityRole="button"
          onPress={toggleExpanded}
          style={styles.collapsedRow}
        >
          {/* Sign Icon in 40x40 circle */}
          <View style={[styles.compactIconBox, { backgroundColor: theme.background }]}>
            {sign.imageUrl ? (
              <Image
                contentFit="contain"
                source={{ uri: sign.imageUrl }}
                style={styles.compactSignImg}
              />
            ) : (
              <MaterialCommunityIcons color="#0671EB" name="traffic-light" size={22} />
            )}
          </View>

          {/* Title + Location + Freshness */}
          <View style={styles.collapsedInfo}>
            <View style={styles.collapsedTitleRow}>
              <Text numberOfLines={1} style={[styles.compactSignName, { color: theme.text }]}>
                {sign.name || sign.signCode || 'Traffic Sign'}
              </Text>
            </View>

            <Text numberOfLines={1} style={[styles.compactLocation, { color: theme.grey }]}>
              {sign.displayAddress || sign.roadName || 'No Location Available'}
            </Text>

            <View style={styles.compactMetaRow}>
              <View style={[styles.freshnessMiniDot, { backgroundColor: freshnessColor }]} />
              <Text style={[styles.compactFreshnessText, { color: theme.grey }]}>
                Freshness: <Text style={{ color: freshnessColor, fontWeight: '700' }}>{displayScore}%</Text>
              </Text>
            </View>
          </View>

          {/* Quick CTA to Expand */}
          <View style={styles.inspectButton}>
            <Text style={styles.inspectButtonText}>Inspect</Text>
            <MaterialCommunityIcons color="#0671EB" name="chevron-right" size={16} />
          </View>
        </Pressable>
      ) : null}

      {/* ================================================================= */}
      {/* EXPANDED STATE (Full verification information)                    */}
      {/* ================================================================= */}
      {isExpanded ? (
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.expandedContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row: Icon, Title, Status, Close */}
          <View style={styles.expandedHeader}>


            <View style={styles.expandedTitleCol}>
              <View style={styles.titleWithBadge}>
                <Text numberOfLines={1} style={[styles.expandedTitleText, { color: theme.text }]}>
                  {sign.name || sign.signCode || 'Traffic Sign'}
                </Text>
                <View
                  style={[
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                      borderWidth: 1,
                      backgroundColor: statusConfig.bg,
                      borderColor: statusConfig.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    color={statusConfig.text}
                    name={statusConfig.icon}
                    size={11}
                  />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: statusConfig.text }}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>

              <View style={styles.expandedLocationRow}>
                <MaterialCommunityIcons
                  color={theme.placeholder}
                  name="map-marker-outline"
                  size={12}
                />
                <Text numberOfLines={1} style={[styles.expandedLocationText, { color: theme.placeholder }]}>
                  {sign.displayAddress || sign.roadName || 'No location data.'}
                </Text>
              </View>
            </View>

            {/* Action Buttons: Collapse and Close */}
            <View style={styles.headerActionBtns}>
              <AppButton
                accessibilityLabel="Collapse sign details"
                accessibilityRole="button"
                hitSlop={8}
                onPress={toggleExpanded}
                style={[styles.collapseToggle, {
                  paddingHorizontal: Spacing.one
                }]}
                variant='ghost'
              >
                <MaterialCommunityIcons color={theme.grey} name="chevron-down" size={20} />
              </AppButton>

              <AppButton
                accessibilityLabel="Close sign details"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onClose}
                style={[styles.collapseToggle, {
                  paddingHorizontal: Spacing.one
                }]}
                variant='ghost'
              >
                <MaterialCommunityIcons color={theme.grey} name="close" size={18} />
              </AppButton>
            </View>
          </View>

          {/* =============================================================== */}
          {/* COMPACT EVIDENCE SECTION                                        */}
          {/* =============================================================== */}

          <Text style={[styles.evidenceSectionTitle, { color: theme.text }]}>
            EVIDENCE COMPARISON
          </Text>
          <View style={[styles.evidenceSection, { borderColor: "#666" }]}>
            {/* Compact Comparison Grid */}
            <View style={[styles.evidenceGrid, { paddingVertical: 0 }]}>
              {/* Box 1: Official Standard Sign */}
              <View style={[styles.evidenceBox, { borderColor: 'transparent' }]}>
                <Text style={[styles.evidenceBoxLabel, { color: theme.text }]}>
                  OFFICIAL SIGN
                </Text>
                <View style={styles.evidenceImageFrame}>
                  {sign.imageUrl ? (
                    <Image
                      contentFit="contain"
                      source={{ uri: sign.imageUrl }}
                      style={styles.standardImg}
                    />
                  ) : (
                    <MaterialCommunityIcons color={theme.grey} name="traffic-light" size={20} />
                  )}
                </View>
              </View>

              {/* Divider  */}
              <View style={styles.horizontalDivider} />

              {/* Box 2: Latest Submitted Crop */}
              <View
                style={[
                  styles.evidenceBox,
                  { borderColor: 'transparent' },
                ]}
              >
                <View style={styles.submittedLabelRow}>
                  <Text style={[styles.evidenceBoxLabel, { color: '#0671EB' }]}>
                    SIGN SUBMISSION
                  </Text>
                </View>
                <View style={styles.evidenceImageFrame}>
                  {hasSubmittedCrop ? (
                    <Image
                      contentFit="cover"
                      onError={() => setCropError(true)}
                      source={{ uri: displaySubmittedCrop }}
                      style={styles.cropImg}
                    />
                  ) : (
                    <View style={styles.noCropBox}>
                      <MaterialCommunityIcons
                        color={theme.placeholder}
                        name="camera-off-outline"
                        size={18}
                      />
                      <Text style={[styles.noCropText, { color: theme.placeholder }]}>
                        No surveyor photo
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* =============================================================== */}
          {/* SURVEYOR REVIEWS & COMMUNITY SUBMISSIONS SECTION                */}
          {/* =============================================================== */}
          <View style={[styles.reviewsSection, { backgroundColor: 'transparent' }]}>
            <View style={styles.reviewsLeftRow}>
              <View
                style={[
                  {
                    backgroundColor: evidenceCount > 0 ? '#EFF6FF' : '#F8FAFC',
                    borderColor: evidenceCount > 0 ? '#BFDBFE' : '#E2E8F0',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  color={evidenceCount > 0 ? '#0671EB' : theme.placeholder}
                  name={evidenceCount > 0 ? 'account-group-outline' : 'message-text-clock-outline'}
                  size={16}
                />
              </View>

              <View style={styles.reviewsTextCol}>
                <View style={styles.reviewsHeadlineRow}>
                  <Text style={[styles.reviewsHeadlineText, { color: theme.text }]}>
                    {isLoadingEvidences
                      ? 'Checking reviews...'
                      : evidenceCount > 0
                        ? `${evidenceCount} surveyor review${evidenceCount > 1 ? 's' : ''} have posted about this sign`
                        : 'No surveyor reviews yet'}
                  </Text>
                </View>

                <Text numberOfLines={1} style={[styles.reviewsSubtext, { color: theme.placeholder }]}>
                  {isLoadingEvidences
                    ? 'Loading community submissions...'
                    : evidenceCount > 0
                      ? latestEvidence?.capturedAt
                        ? `Latest review submitted on ${formatDate(latestEvidence.capturedAt)}`
                        : 'On-site evidence awaiting peer confirmation'
                      : 'Be the first surveyor to inspect this location and earn bounty'}
                </Text>

              </View>
            </View>
            <View style={{ marginTop: Spacing.two }}>
              <Text style={{
                fontSize: 12,
                color: theme.placeholder
              }}>
                Note: You will not receive credits for signs that have already been reviewed correctly.
              </Text>
            </View>
          </View>

          {/* =============================================================== */}
          {/* DEV ONLY: COPY COORDINATES                                       */}
          {/* =============================================================== */}
          <Pressable
            accessibilityLabel="Copy coordinates to clipboard"
            hitSlop={4}
            onPress={handleCopyCoordinates}
            style={styles.devCopyCoordsBtn}
          >
            <MaterialCommunityIcons
              color={copiedCoords ? '#16A34A' : '#64748B'}
              name={copiedCoords ? 'check-circle-outline' : 'content-copy'}
              size={12}
            />
            <Text style={[styles.devCopyCoordsText, copiedCoords && { color: '#16A34A' }]}>
              {copiedCoords
                ? 'Copied to clipboard!'
                : `Copy Lat/Lng (${lat !== undefined ? Number(lat).toFixed(4) : '?'}, ${lng !== undefined ? Number(lng).toFixed(4) : '?'})`}
            </Text>
          </Pressable>

          {/* =============================================================== */}
          {/* FRESHNESS INFORMATION & AUDIT DATE                              */}
          {/* =============================================================== */}
          <View style={styles.freshnessInfoRow}>
            <View style={styles.freshnessCol}>
              <View style={styles.freshnessMeterHeader}>
                <Text style={[styles.freshnessLabel, { color: theme.text }]}>
                  Freshness Quality
                </Text>
                <Text style={[styles.freshnessScoreValue, { color: freshnessColor }]}>
                  {displayScore}%
                </Text>
              </View>
              {/* Progress Bar */}
              <View style={[styles.meterTrack, { backgroundColor: '#E2E8F0' }]}>
                {displayScore > 0 ? (
                  <View
                    testID="freshness-meter-fill"
                    style={[
                      styles.meterFill,
                      {
                        backgroundColor: freshnessColor,
                        width: `${Math.min(100, Math.max(0, displayScore))}%`,
                      },
                    ]}
                  />
                ) : null}
              </View>
            </View>

            {sign.lastVerifiedAt ? (
              <View style={styles.lastCheckedCol}>
                <Text style={[styles.lastCheckedLabel, { color: theme.grey }]}>Last checked</Text>
                <Text style={[styles.lastCheckedValue, { color: theme.text }]}>
                  {formatDate(sign.lastVerifiedAt)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Feedback message banner if triggered */}
          {submittedMessage ? (
            <View style={styles.feedbackBanner}>
              <MaterialCommunityIcons color="#0671EB" name="information" size={16} />
              <Text style={styles.feedbackText}>{submittedMessage}</Text>
            </View>
          ) : null}

          {/* =============================================================== */}
          {/* PRIMARY ACTION CTA                                               */}
          {/* =============================================================== */}
          <View style={styles.ctaRow}>
            <AppButton
              accessibilityLabel={primaryCtaText}
              disabled={isSubmitting}
              onPress={handleAction}
              style={[
                styles.primaryCtaBtn,
                { backgroundColor: isStale ? '#0671EB' : '#0671EB' },
              ]}
              variant="primary"
            >
              <MaterialCommunityIcons
                color="#FFFFFF"
                name={isStale ? 'camera-retake-outline' : 'shield-check-outline'}
                size={18}
              />
              <Text style={styles.primaryCtaText}>{primaryCtaText}</Text>
            </AppButton>
          </View>
        </ScrollView>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    maxHeight: '74%',
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 20,
    overflow: 'hidden',
  },
  dragHandleBar: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragPill: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  // Collapsed Peek
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    gap: 12,
  },
  compactIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  compactSignImg: {
    width: 26,
    height: 26,
  },
  collapsedInfo: {
    flex: 1,
    gap: 2,
  },
  collapsedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactSignName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  collapsedStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  collapsedStatusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  compactLocation: {
    fontSize: 12,
  },
  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  freshnessMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactFreshnessText: {
    fontSize: 11,
  },
  inspectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 113, 235, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 2,
  },
  inspectButtonText: {
    color: '#0671EB',
    fontSize: 12,
    fontWeight: '700',
  },
  // Expanded Content
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expandedIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expandedSignImg: {
    width: 28,
    height: 28,
  },
  expandedTitleCol: {
    flex: 1,
    gap: 2,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  expandedTitleText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    gap: 3,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  expandedLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  expandedLocationText: {
    fontSize: 11,
  },
  headerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  collapseToggle: {
    padding: 4,
  },
  // Evidence Section
  evidenceSection: {
    borderRadius: 12,
    padding: 10,
    paddingVertical: 0,
    gap: 8,
    borderWidth: 1,
  },
  evidenceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evidenceSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    gap: 3,
  },
  comparisonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  evidenceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  horizontalDivider: {
    height: '100%',
    width: 1,
    backgroundColor: '#000',
  },
  evidenceBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    padding: 6,
    gap: 4,
    alignItems: 'center',
  },

  evidenceBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  submittedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  evidenceImageFrame: {
    height: 60,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    overflow: 'hidden',
  },
  standardImg: {
    width: 44,
    height: 44,
  },
  cropImg: {
    width: '50%',
    height: '100%',
  },
  noCropBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  noCropText: {
    fontSize: 9,
    fontWeight: '600',
  },
  devCopyCoordsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  devCopyCoordsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  // Freshness Row
  freshnessInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: 16,
  },
  freshnessCol: {
    flex: 1,
    gap: 4,
  },
  freshnessMeterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freshnessLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  freshnessScoreValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  meterTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
    width: '100%',
  },
  meterFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  lastCheckedCol: {
    alignItems: 'flex-end',
    gap: 1,
  },
  lastCheckedLabel: {
    fontSize: 10,
  },
  lastCheckedValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  feedbackText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '500',
    flex: 1,
  },
  ctaRow: {
    marginTop: 2,
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#0671EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  // Reviews Section
  reviewsSection: {
    borderRadius: 12,
    padding: 10,
    paddingHorizontal: 0,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  reviewsLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewsIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsTextCol: {
    flex: 1,
    gap: 2,
  },
  reviewsHeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewsHeadlineText: {
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 2,
  },
  verifiedCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  reviewsSubtext: {
    fontSize: 11,
    fontWeight: '500',
  },
  evidenceThumbnailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  evidenceThumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbTypePill: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbTypePillText: {
    fontSize: 8,
    fontWeight: '700',
  },
});
