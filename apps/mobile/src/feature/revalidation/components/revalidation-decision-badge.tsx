import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface RevalidationDecisionBadgeProps {
  handleAgree: () => void;
  handleDecline: () => void;
  handleSkip: () => void;
  handleReport: () => void;
  onOpenCatalog?: () => void;
  onOpenHelp?: () => void;
  disabled?: boolean;
  testID?: string;
}

export interface RevalidationSwipeBadgesProps {
  agreeOpacity: Animated.AnimatedInterpolation<number | string>;
  declineOpacity: Animated.AnimatedInterpolation<number | string>;
  skipOpacity: Animated.AnimatedInterpolation<number | string>;
  reportOpacity: Animated.AnimatedInterpolation<number | string>;
}

/**
 * RevalidationSwipeBadges: Animated overlay labels shown when swiping the evidence card
 * Right: ĐỒNG Ý | Left: TỪ CHỐI | Up: BỎ QUA | Down: BÁO CÁO
 */
export const RevalidationSwipeBadges = memo(function RevalidationSwipeBadges({
  agreeOpacity,
  declineOpacity,
  skipOpacity,
  reportOpacity,
}: RevalidationSwipeBadgesProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Right Swipe: Agree with Surveyor */}
      <Animated.View
        style={[styles.swipeBadge, styles.agreeBadge, { opacity: agreeOpacity }]}
      >
        <Text style={styles.swipeBadgeText}>ĐỒNG Ý</Text>
      </Animated.View>

      {/* Left Swipe: Decline / Disagree with Surveyor */}
      <Animated.View
        style={[styles.swipeBadge, styles.declineBadge, { opacity: declineOpacity }]}
      >
        <Text style={styles.swipeBadgeText}>TỪ CHỐI</Text>
      </Animated.View>

      {/* Up Swipe: Skip this evidence */}
      <Animated.View
        style={[styles.swipeBadge, styles.skipBadge, { opacity: skipOpacity }]}
      >
        <Text style={styles.swipeBadgeText}>BỎ QUA</Text>
      </Animated.View>

      {/* Down Swipe: Report invalid / bad evidence */}
      <Animated.View
        style={[styles.swipeBadge, styles.reportBadge, { opacity: reportOpacity }]}
      >
        <Text style={styles.swipeBadgeText}>BÁO CÁO</Text>
      </Animated.View>
    </View>
  );
});

/**
 * RevalidationDecisionBadge: Dedicated component for revalidation action buttons.
 * Dispatches reviewer intent (Agree, Decline, Skip, Report) to corresponding handler props.
 */
export const RevalidationDecisionBadge = memo(function RevalidationDecisionBadge({
  handleAgree,
  handleDecline,
  handleSkip,
  handleReport,
  onOpenCatalog,
  onOpenHelp,
  disabled = false,
  testID = 'revalidation-decision-badge',
}: RevalidationDecisionBadgeProps) {
  const theme = useTheme();

  return (
    <View style={styles.actionsFooter} testID={testID}>
      {/* Side Action FABs: Catalog & Help */}
      <View style={styles.fabColumn}>
        {onOpenCatalog ? (
          <Pressable
            accessibilityLabel="Xem danh mục biển báo"
            accessibilityRole="button"
            disabled={disabled}
            onPress={onOpenCatalog}
            style={({ pressed }) => [
              styles.fabButton,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              pressed && styles.circleButtonPressed,
              disabled && styles.buttonDisabled,
            ]}
          >
            <MaterialCommunityIcons color={theme.text} name="book-open-outline" size={20} />
          </Pressable>
        ) : null}

        {onOpenHelp ? (
          <Pressable
            accessibilityLabel="Hướng dẫn thao tác quẹt"
            accessibilityRole="button"
            disabled={disabled}
            onPress={onOpenHelp}
            style={({ pressed }) => [
              styles.fabButton,
              { backgroundColor: theme.primary, borderColor: theme.border },
              pressed && styles.circleButtonPressed,
              disabled && styles.buttonDisabled,
            ]}
          >
            <MaterialCommunityIcons color={theme.surface} name="help" size={22} />
          </Pressable>
        ) : null}
      </View>

      {/* Diamond Action Buttons Container */}
      <View style={styles.diamondContainer}>
        {/* Top Button: Skip (Bỏ qua) */}
        <View style={[styles.diamondItem, styles.diamondTop]}>
          <Pressable
            accessibilityLabel="Bỏ qua minh chứng này"
            accessibilityRole="button"
            disabled={disabled}
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.diamondButton,
              styles.neutralDiamondButton,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              pressed && styles.circleButtonPressed,
              disabled && styles.buttonDisabled,
            ]}
          >
            <MaterialCommunityIcons color={theme.text} name="arrow-up" size={24} />
          </Pressable>
          <Text style={[styles.diamondLabel, { color: theme.text }]}>Bỏ qua</Text>
        </View>

        {/* Left Button: Decline (Từ chối) */}
        <View style={[styles.diamondItem, styles.diamondLeft]}>
          <Pressable
            accessibilityLabel="Từ chối kết luận của điều tra viên"
            accessibilityRole="button"
            disabled={disabled}
            onPress={handleDecline}
            style={({ pressed }) => [
              styles.diamondButton,
              styles.declineButton,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              pressed && styles.circleButtonPressed,
              disabled && styles.buttonDisabled,
            ]}
          >
            <MaterialCommunityIcons color={Colors.danger} name="close" size={28} />
          </Pressable>
          <Text style={[styles.diamondLabel, { color: theme.text }]}>Từ chối</Text>
        </View>

        {/* Right Button: Agree (Đồng ý với điều tra viên) */}
        <View style={[styles.diamondItem, styles.diamondRight]}>
          <Pressable
            accessibilityLabel="Đồng ý với kết luận của điều tra viên"
            accessibilityRole="button"
            disabled={disabled}
            onPress={handleAgree}
            style={({ pressed }) => [
              styles.diamondButton,
              styles.agreeButton,
              { backgroundColor: theme.primary, borderColor: theme.border },
              pressed && styles.circleButtonPressed,
              disabled && styles.buttonDisabled,
            ]}
          >
            <MaterialCommunityIcons color="#FFFFFF" name="check-bold" size={26} />
          </Pressable>
          <Text style={[styles.diamondLabel, { color: theme.text }]}>Đồng ý</Text>
        </View>

        {/* Bottom Button: Report (Báo cáo sự cố) */}
        <View style={[styles.diamondItem, styles.diamondBottom]}>
          <Pressable
            accessibilityLabel="Báo cáo minh chứng này"
            accessibilityRole="button"
            disabled={disabled}
            onPress={handleReport}
            style={({ pressed }) => [
              styles.diamondButton,
              styles.neutralDiamondButton,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              pressed && styles.circleButtonPressed,
              disabled && styles.buttonDisabled,
            ]}
          >
            <MaterialCommunityIcons color={theme.textSecondary} name="flag-outline" size={22} />
          </Pressable>
          <Text style={[styles.diamondLabel, { color: theme.text }]}>Báo cáo</Text>
        </View>
      </View>
    </View>
  );
});

// Alias for flexibility in naming
export const RevalidationDecisionActions = RevalidationDecisionBadge;

const styles = StyleSheet.create({
  actionsFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.two,
    paddingBottom: Spacing.one,
    position: 'relative',
    width: '100%',
  },
  fabColumn: {
    bottom: 8,
    flexDirection: 'column',
    gap: 8,
    left: 8,
    position: 'absolute',
    zIndex: 10,
  },
  fabButton: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    elevation: 3,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 44,
  },
  diamondContainer: {
    width: 168,
    height: 196,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  diamondItem: {
    position: 'absolute',
    width: 54,
    alignItems: 'center',
  },
  diamondTop: {
    top: 0,
    left: 57,
  },
  diamondLeft: {
    left: 0,
    top: 57,
  },
  diamondRight: {
    right: 0,
    top: 57,
  },
  diamondBottom: {
    top: 114,
    left: 57,
  },
  diamondButton: {
    alignItems: 'center',
    borderRadius: 27,
    borderWidth: 1.5,
    elevation: 3,
    height: 54,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    width: 54,
  },
  agreeButton: {
    shadowColor: '#16A34A',
    shadowOpacity: 0.3,
  },
  declineButton: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  neutralDiamondButton: {
    opacity: 0.95,
  },
  circleButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  diamondLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 4,
    textAlign: 'center',
    width: 76,
  },
  swipeBadge: {
    alignItems: 'center',
    borderRadius: Rounded.md,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'absolute',
    zIndex: 30,
  },
  agreeBadge: {
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    right: 24,
    top: 24,
    transform: [{ rotate: '15deg' }],
  },
  declineBadge: {
    backgroundColor: Colors.danger,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    left: 24,
    top: 24,
    transform: [{ rotate: '-15deg' }],
  },
  skipBadge: {
    backgroundColor: '#64748B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    top: 20,
    alignSelf: 'center',
  },
  reportBadge: {
    backgroundColor: '#EA580C',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    bottom: 20,
    alignSelf: 'center',
  },
  swipeBadgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.title,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
