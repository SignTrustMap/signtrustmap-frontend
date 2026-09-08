import AntDesign from '@expo/vector-icons/AntDesign';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, View, useAnimatedValue } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SurveyScanModalProps = {
  imageUri: string;
  onComplete: () => void;
  onCancel: () => void;
};

const SCAN_DURATION_MS = 1700;
const PREVIEW_HEIGHT = 220;
const ARROW_WIDTH = 32;

export function SurveyScanModal({ imageUri, onComplete, onCancel }: SurveyScanModalProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useAnimatedValue(0);
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const [percentage, setPercentage] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    const listener = progress.addListener(({ value }) => {
      setPercentage(Math.round(value * 100));
    });
    return () => {
      animation.current?.stop();
      progress.removeListener(listener);
    };
  }, [progress]);

  const startScan = () => {
    if (animation.current) return;

    // This is a timed preview transition, independent of the final upload request.
    animation.current = Animated.timing(progress, {
      toValue: 1,
      duration: SCAN_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.current.start(({ finished }) => {
      if (finished) onComplete();
    });
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible
      statusBarTranslucent
      onShow={startScan}
      onRequestClose={() => {
        animation.current?.stop();
        onCancel();
      }}
    >
      <SafeAreaView style={styles.backdrop}>
        <Animated.View accessibilityViewIsModal style={[
          styles.panel,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          !reduceMotion && {
            transform: [{
              scale: progress.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: [1, 1.02, 1, 1.02, 1],
                easing: Easing.inOut(Easing.cubic),
              }),
            }],
          },
        ]}>
          <View style={styles.preview}>
            <Image
              accessibilityLabel="Selected survey image"
              contentFit="contain"
              source={{ uri: imageUri }}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.imageShade} />
            {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map((corner) => (
              <View
                key={corner}
                pointerEvents="none"
                style={[styles.corner, styles[corner as 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight']]}
              />
            ))}
            {!reduceMotion ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.scanLine,
                  {
                    transform: [{
                      translateY: progress.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [18, PREVIEW_HEIGHT - 18, 18],
                        easing: Easing.inOut(Easing.cubic),
                      }),
                    }],
                  },
                ]}
              >
                <View style={styles.glowOuter} />
                <View style={styles.glowMiddle} />
                <View style={styles.glowInner} />
                <View style={styles.glowCore} />
              </Animated.View>
            ) : null}
          </View>
          <View
            accessibilityLabel="Scanning image"
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: percentage }}
            style={[
              styles.trackFrame,
              {
                backgroundColor: theme.backgroundSelected,
                borderTopColor: `${theme.primary}40`,
                borderLeftColor: `${theme.primary}26`,
                borderRightColor: `${theme.primary}26`,
                borderBottomColor: theme.onPrimary,
                shadowColor: theme.primary,
              },
            ]}
          >
            <View
              onLayout={({ nativeEvent }) => setTrackWidth(nativeEvent.layout.width)}
              style={[styles.track, { backgroundColor: `${theme.primary}30` }]}
            >
            <View pointerEvents="none" style={[styles.trackInset, { borderColor: `${theme.primary}26` }]} />
            <Animated.View style={[
              styles.fill,
              {
                backgroundColor: theme.primary,
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [ARROW_WIDTH, Math.max(ARROW_WIDTH, trackWidth)],
                }),
              },
            ]}>
              {Array.from({ length: Math.ceil(trackWidth / 28) + 2 }, (_, index) => (
                <View
                  key={index}
                  pointerEvents="none"
                  style={[
                    styles.stripe,
                    { left: index * 28 - 12, backgroundColor: `${theme.onPrimary}24` },
                  ]}
                />
              ))}
              <View pointerEvents="none" style={[styles.fillSheen, { backgroundColor: `${theme.onPrimary}20` }]} />
              <View pointerEvents="none" style={[styles.fillHighlight, { backgroundColor: `${theme.onPrimary}99` }]} />
              <View pointerEvents="none" style={[styles.fillEdge, { borderColor: `${theme.onPrimary}30` }]} />
            </Animated.View>
            <Animated.View
              accessible={false}
              pointerEvents="none"
              style={[
                styles.arrow,
                {
                  transform: [{
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.max(0, trackWidth - ARROW_WIDTH)],
                    }),
                  }],
                },
              ]}
            >
              <AntDesign name="arrow-right" size={18} color={theme.onPrimary} />
            </Animated.View>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    backgroundColor: 'rgba(5, 12, 24, 0.64)',
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    padding: Spacing.three,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 16,
  },
  preview: { height: PREVIEW_HEIGHT, overflow: 'hidden', borderRadius: Rounded.lg, backgroundColor: '#0A1422' },
  imageShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5, 12, 24, 0.12)' },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: 'rgba(208, 246, 255, 0.8)' },
  topLeft: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 5 },
  topRight: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 5 },
  bottomLeft: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 5 },
  bottomRight: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 5 },
  scanLine: { position: 'absolute', top: 0, left: 12, right: 12, height: 2 },
  glowOuter: { position: 'absolute', top: -14, left: 0, right: 0, height: 30, backgroundColor: 'rgba(51, 196, 255, 0.07)', borderRadius: 15 },
  glowMiddle: { position: 'absolute', top: -8, left: 0, right: 0, height: 18, backgroundColor: 'rgba(51, 196, 255, 0.14)', borderRadius: 9 },
  glowInner: { position: 'absolute', top: -3, left: 0, right: 0, height: 8, backgroundColor: 'rgba(84, 216, 255, 0.32)', borderRadius: 4 },
  glowCore: { height: 2, backgroundColor: '#C4F6FF', shadowColor: '#33C4FF', shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  trackFrame: {
    padding: 5,
    borderWidth: 1,
    borderRadius: Rounded.round,
    marginTop: Spacing.three,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  track: { height: 28, borderRadius: Rounded.round, overflow: 'hidden' },
  trackInset: { ...StyleSheet.absoluteFill, borderTopWidth: 3, borderLeftWidth: 1, borderRightWidth: 1, borderRadius: Rounded.round },
  fill: { height: '100%', borderRadius: Rounded.round, overflow: 'hidden' },
  stripe: { position: 'absolute', top: -4, bottom: -4, width: 14, transform: [{ skewX: '-22deg' }] },
  fillSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '48%' },
  fillHighlight: { position: 'absolute', top: 4, left: 9, right: 9, height: 3, borderRadius: Rounded.round },
  fillEdge: { ...StyleSheet.absoluteFill, borderWidth: 1, borderRadius: Rounded.round },
  arrow: { position: 'absolute', top: 0, left: 0, bottom: 0, width: ARROW_WIDTH, alignItems: 'center', justifyContent: 'center' },
});
