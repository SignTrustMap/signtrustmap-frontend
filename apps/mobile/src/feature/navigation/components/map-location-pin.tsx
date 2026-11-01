import type React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type MapLocationPinProps = {
  color?: string;
  size?: number;
  showShadow?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function MapLocationPin({
  color = '#EF4444',
  size = 38,
  showShadow = true,
  testID = 'map-location-pin',
  style,
}: MapLocationPinProps) {
  const shadowWidth = Math.max(8, Math.round(size * 0.26));
  const shadowHeight = Math.max(3, Math.round(size * 0.09));

  return (
    <View pointerEvents="none" style={[styles.container, style]} testID={testID}>
      <MaterialCommunityIcons
        color={color}
        name="map-marker"
        size={size}
        style={styles.icon}
      />
      {showShadow ? (
        <View
          style={[
            styles.shadow,
            {
              width: shadowWidth,
              height: shadowHeight,
              borderRadius: shadowWidth / 2,
              marginTop: -Math.round(size * 0.08),
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  shadow: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
