import { Image, StyleSheet, View } from 'react-native';

/**
 * Continuous 256-step linear gradient from brand primary teal (#007B8B) down to deep teal (#00444E).
 */
const PRIMARY_GRADIENT_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAEACAIAAAD9XIvPAAAA1klEQVR4nF3DBW4FQAgFwHe4unx3d3eXusulG0IosJMMcPzF/8OPv/8OfgE7+5Nv5QffyHe9lm96RV/1kr74i+fgEzAPzh6DD8DUvgcm9h0fy6Me0YMeyr0e0J3f3/q9TXANdMMroGMvgba94C0550050w069et0omt07FdHwSFQsQdAOdwHSnaPF2WXF2RH52lb52jLz9Kmn2n46XqwBqTsKk/aFSBhl3lclnSMFnWUFvxI3r+lOf8mG8wA13YauLJT/NJO8guZ4Ocyrs9ozD+N+icR+QeDjswB4BQ2HwAAAABJRU5ErkJggg==';

type PrimaryGradientBackdropProps = {
  /** Whether to render the full-screen primary gradient image behind the circles. */
  showGradient?: boolean;
  /** Optional prefix used for testIDs in unit tests. */
  testIDPrefix?: string;
};

/**
 * Full-screen primary gradient backdrop with ambient decorative circles,
 * matching the visual style of the authentication screens.
 */
export function PrimaryGradientBackdrop({
  showGradient = true,
  testIDPrefix = 'primary-backdrop',
}: PrimaryGradientBackdropProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID={`${testIDPrefix}-gradient-bg`}>
      {showGradient ? (
        <Image
          resizeMode="stretch"
          source={{ uri: PRIMARY_GRADIENT_BASE64 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.decorCircleLarge} testID={`${testIDPrefix}-decor-circle`} />
      <View style={styles.decorCircleMedium} />
      <View style={styles.decorCircleSmall} />
      <View style={styles.decorCircleFloat} />
      <View style={styles.decorCircleBottomRight} />
      <View style={styles.decorCircleDot} />
      <View style={styles.decorCircleDot2} />
      <View style={styles.decorRoadCurve} />
    </View>
  );
}

const styles = StyleSheet.create({
  decorCircleLarge: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircleMedium: {
    position: 'absolute',
    bottom: 40,
    left: -35,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  decorCircleSmall: {
    position: 'absolute',
    top: 72,
    right: 65,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  decorCircleFloat: {
    position: 'absolute',
    top: 150,
    left: 18,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  decorCircleBottomRight: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  decorCircleDot: {
    position: 'absolute',
    top: 86,
    left: 36,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  decorCircleDot2: {
    position: 'absolute',
    bottom: 130,
    right: 36,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  decorRoadCurve: {
    position: 'absolute',
    bottom: -70,
    left: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderStyle: 'dashed',
  },
});
