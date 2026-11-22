import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format-date';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import type { ReviewCandidate } from '@/types/reviewsType';
import { AppButton } from '@/components/button';

export interface ReviewHistoryRecord {
  candidate: ReviewCandidate;
  candidateId: string;
  declineNote?: string | null;
  declineReason?: string | null;
  reviewedAt: string;
  vote: number; // 1 = approved, 2 = declined, 3 = reported, 4 = skipped
}

export function isVoteEditable(record: ReviewHistoryRecord, referenceDate = new Date()): boolean {
  if (!record.reviewedAt) return false;

  const reviewDate = new Date(record.reviewedAt);
  if (Number.isNaN(reviewDate.getTime())) return false;

  // 1. Time limit: Must be same day as referenceDate
  const isToday =
    reviewDate.getFullYear() === referenceDate.getFullYear() &&
    reviewDate.getMonth() === referenceDate.getMonth() &&
    reviewDate.getDate() === referenceDate.getDate();

  if (!isToday) return false;

  // 2. Candidate must NOT be published / finalized (status must be PENDING or unset)
  const status = record.candidate?.status?.toUpperCase();
  if (status && status !== 'PENDING' && status !== 'IN_REVIEW') {
    return false;
  }

  return true;
}

export function getVoteLabel(vote: number): { label: string; color: string; symbol: string } {
  switch (vote) {
    case 1:
      return { label: 'Phê duyệt', color: Colors.primary, symbol: '✓' };
    case 2:
      return { label: 'Từ chối', color: Colors.danger, symbol: '×' };
    case 3:
      return { label: 'Báo cáo', color: Colors.warning, symbol: '!' };
    case 4:
      return { label: 'Bỏ qua', color: Colors.grey, symbol: '↷' };
    default:
      return { label: 'Đã thẩm định', color: Colors.primary, symbol: '✓' };
  }
}

export interface ReviewHistoryItemCardProps {
  record: ReviewHistoryRecord;
  onEdit?: (record: ReviewHistoryRecord) => void;
  referenceDate?: Date;
}

export function ReviewHistoryItemCard({
  record,
  onEdit,
  referenceDate = new Date(),
}: ReviewHistoryItemCardProps) {
  const theme = useTheme();
  const candidate = record.candidate;
  const canEdit = isVoteEditable(record, referenceDate);
  const voteInfo = getVoteLabel(record.vote);

  const signTitle =
    candidate?.predictedSignType?.nameVi ||
    candidate?.predictedSignType?.signCode ||
    'Biển báo giao thông';

  const signLocation =
    candidate?.locationContext?.displayLocation ||
    candidate?.locationContext?.nearbyRoad ||
    (candidate?.latitude != null && candidate?.longitude != null
      ? `${candidate.latitude.toFixed(5)}, ${candidate.longitude.toFixed(5)}`
      : 'Vị trí khảo sát');

  const imageUrl = resolveS3Url(candidate?.signCropUrl || candidate?.bestFrameUrl);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
      testID={`review-history-item-${record.candidateId}`}
    >
      <View style={styles.contentRow}>
        {/* Left: Sign image */}
        <View style={[styles.imageContainer, { backgroundColor: theme.background }]}>
          {imageUrl ? (
            <Image
              contentFit="contain"
              source={{ uri: imageUrl }}
              style={styles.image}
              testID="review-history-item-image"
            />
          ) : (
            <MaterialCommunityIcons color={theme.placeholder} name="traffic-light" size={28} />
          )}
        </View>

        {/* Center: Info */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
              {signTitle}
            </Text>
          </View>

          <Text numberOfLines={1} style={[styles.location, { color: theme.textSecondary }]}>
            {signLocation}
          </Text>

          <View style={styles.metadataRow}>
            <Text style={[styles.timeText, { color: theme.placeholder }]}>
              {formatDate(record.reviewedAt)}
            </Text>
            <View style={[styles.voteBadge, { backgroundColor: `${voteInfo.color}18` }]}>
              <Text style={[styles.voteBadgeText, { color: voteInfo.color }]}>
                {voteInfo.symbol} {voteInfo.label}
              </Text>
            </View>
          </View>

          {record.declineReason ? (
            <Text numberOfLines={1} style={[styles.declineNote, { color: Colors.danger }]}>
              Lý do: {record.declineReason}
              {record.declineNote ? ` - ${record.declineNote}` : ''}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Footer: Status badge & Action */}
      <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
        <View style={styles.statusContainer}>
          {canEdit ? (
            <View style={[styles.statusBadge, { backgroundColor: '#16A34A18' }]}>
              <MaterialCommunityIcons color="#16A34A" name="clock-edit-outline" size={14} />
              <Text style={[styles.statusText, { color: '#16A34A' }]}>Có thể sửa (Hôm nay)</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: `${Colors.grey}18` }]}>
              <MaterialCommunityIcons color={Colors.grey} name="lock-outline" size={14} />
              <Text style={[styles.statusText, { color: Colors.grey }]}>
                {record.candidate?.status && record.candidate.status !== 'PENDING'
                  ? 'Đã công bố'
                  : 'Đã khóa'}
              </Text>
            </View>
          )}
        </View>

        {canEdit && onEdit ? (
          <AppButton
            accessibilityHint="Chạm để chỉnh sửa lại kết quả thẩm định cho biển báo này"
            accessibilityLabel={`Sửa lại kết quả cho ${signTitle}`}
            label="Sửa vote"
            onPress={() => onEdit(record)}
            style={styles.editButton}
            testID={`btn-edit-vote-${record.candidateId}`}
            variant="surface"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Rounded.md,
    borderWidth: 1,
    marginBottom: Spacing.two,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    padding: Spacing.two,
    gap: Spacing.two,
    alignItems: 'center',
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: Rounded.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 14,
    fontWeight: '700',
  },
  location: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: 2,
  },
  timeText: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  voteBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Rounded.round,
  },
  voteBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
  },
  declineNote: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderTopWidth: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.round,
  },
  statusText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
  },
  editButton: {
    minHeight: 28,
    height: 28,
    paddingHorizontal: Spacing.two,
    paddingVertical: 0,
    borderRadius: Rounded.round,
  },
});
