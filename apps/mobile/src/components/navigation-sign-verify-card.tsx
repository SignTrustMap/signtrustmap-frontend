import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RouteSign } from '@/api/navigation/navigation';

export type SignVerifyResult = 'present' | 'absent';

export type NavigationSignVerifyCardProps = {
  /** The sign the user is approaching. Pass null/undefined to hide the card. */
  sign: RouteSign | null | undefined;
  distanceMeters: number;
  /** Called when the user taps one of the two buttons. */
  onVerify: (sign: RouteSign, result: SignVerifyResult) => void;
  /** Called when the card is dismissed without a response (e.g. user drove past). */
  onDismiss: () => void;
};


/**
 * A small, non-blocking floating card anchored to the bottom-right of the screen.
 * It slides in when a sign is nearby and prompts the user to confirm whether it is
 * physically present on the street. Designed to minimise visual interference with the
 * map and the maneuver banner while driving.
 */
export function NavigationSignVerifyCard({
  sign,
  distanceMeters,
  onVerify,
  onDismiss,
}: NavigationSignVerifyCardProps) {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [lastSignId, setLastSignId] = useState(sign?.id);
  const [visible, setVisible] = useState(Boolean(sign));
  const [responded, setResponded] = useState(false);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (sign?.id !== lastSignId) {
    setLastSignId(sign?.id);
    setResponded(false);
    setVisible(Boolean(sign));
  }

  // Show card when sign appears
  useEffect(() => {
    if (!sign) {
      hideCard(false);
      return;
    }
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        mass: 0.7,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 20 s if driver doesn't respond
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    autoDismissRef.current = setTimeout(() => {
      hideCard(true);
    }, 20_000);

    return () => {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sign?.id]);

  function hideCard(callDismiss: boolean) {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 120,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      if (callDismiss) onDismiss();
    });
  }

  function handleVerify(result: SignVerifyResult) {
    if (!sign || responded) return;
    setResponded(true);
    onVerify(sign, result);
    // Short delay so the user sees their tap register, then slide away
    setTimeout(() => hideCard(false), 480);
  }

  if (!visible) return null;

  const signTitle = sign?.name || sign?.signCode || 'Traffic Sign';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundElement,
            shadowColor: '#09233C',
          },
        ]}
      >
        {/* Dismiss × */}
        <Pressable
          accessibilityLabel="Dismiss sign verification"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => hideCard(true)}
          style={styles.closeBtn}
        >
          <Text style={[styles.closeBtnText, { color: theme.placeholder }]}>✕</Text>
        </Pressable>

        {/* Sign image + info */}
        <View style={styles.signRow}>
          <View style={[styles.signImageWrap, { backgroundColor: theme.backgroundSelected }]}>
            {sign?.imageUrl ? (
              <Image
                contentFit="contain"
                source={{ uri: sign.imageUrl }}
                style={styles.signImage}
              />
            ) : null}
          </View>
          <View style={styles.signInfo}>
            <Text style={[styles.promptLabel, { color: theme.placeholder }]}>
              SIGN AHEAD · {distanceMeters}M
            </Text>
            <Text numberOfLines={2} style={[styles.signName, { color: theme.text }]}>
              {signTitle}
            </Text>
          </View>
        </View>

        {/* Confirm question */}
        <Text style={[styles.question, { color: theme.textSecondary }]}>
          Is this sign on the street?
        </Text>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            accessibilityLabel="Yes, the sign is on the street"
            accessibilityRole="button"
            activeOpacity={0.78}
            disabled={responded}
            onPress={() => handleVerify('present')}
            style={[
              styles.actionBtn,
              styles.actionBtnYes,
              { opacity: responded ? 0.5 : 1 },
            ]}
          >
            <Text style={styles.actionBtnIcon}>✅</Text>
            <Text style={[styles.actionBtnLabel, styles.actionBtnLabelYes]}>Yes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="No, the sign is not on the street"
            accessibilityRole="button"
            activeOpacity={0.78}
            disabled={responded}
            onPress={() => handleVerify('absent')}
            style={[
              styles.actionBtn,
              styles.actionBtnNo,
              { borderColor: theme.danger, opacity: responded ? 0.5 : 1 },
            ]}
          >
            <Text style={styles.actionBtnIcon}>❌</Text>
            <Text style={[styles.actionBtnLabel, { color: theme.danger }]}>No</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    // sits above the collapsed destination sheet (~280) plus a comfortable gap
    bottom: 340,
    right: Spacing.three,
    zIndex: 50,
    width: 210,
  },
  card: {
    borderRadius: Rounded.xlg,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
    gap: Spacing.one,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.two,
    zIndex: 1,
    padding: 2,
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  signRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingRight: Spacing.three, // avoid ✕ overlap
  },
  signImageWrap: {
    width: 44,
    height: 44,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  signImage: {
    width: 36,
    height: 36,
  },
  signInfo: {
    flex: 1,
    minWidth: 0,
  },
  promptLabel: {
    fontFamily: Fonts.body,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  signName: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  question: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Rounded.md,
    borderWidth: 1.5,
  },
  actionBtnYes: {
    backgroundColor: '#E6F7EE',
    borderColor: '#2ECC71',
  },
  actionBtnNo: {
    backgroundColor: 'transparent',
  },
  actionBtnIcon: {
    fontSize: 13,
  },
  actionBtnLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnLabelYes: {
    color: '#219150',
  },
});
