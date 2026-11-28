import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import type { RouteSign } from '@/api/navigation/navigation';
import { styles } from '../styles/navigation-map-screen.styles';

export interface UpcomingSignItem extends RouteSign {
  distanceMeters: number;
}

export interface NavigationUpcomingSignsProps {
  signs: UpcomingSignItem[];
}

function UpcomingSignRow({ sign }: { sign: UpcomingSignItem }) {
  const theme = useTheme();

  // Gather candidate URLs in priority order:
  // 1. actualCropUrl: actual camera crop photo of the sign (highest fidelity)
  // 2. imageUrl: representative QCĐN 41 sign icon / vector
  // 3. actualFrameUrl / actualFrameURl / frameUrl: full scene / dashcam photo
  const candidateUrls = useMemo(() => {
    const urls: string[] = [];
    if (sign.actualCropUrl) urls.push(sign.actualCropUrl);
    if (sign.imageUrl && !urls.includes(sign.imageUrl)) urls.push(sign.imageUrl);
    if (sign.actualFrameUrl && !urls.includes(sign.actualFrameUrl)) urls.push(sign.actualFrameUrl);
    if (sign.actualFrameURl && !urls.includes(sign.actualFrameURl)) urls.push(sign.actualFrameURl);
    if (sign.frameUrl && !urls.includes(sign.frameUrl)) urls.push(sign.frameUrl);
    const anySign = sign as any;
    if (anySign.scenePhotoUrl && !urls.includes(anySign.scenePhotoUrl)) urls.push(anySign.scenePhotoUrl);
    return urls.filter((u) => Boolean(u && typeof u === 'string' && u.trim().length > 0));
  }, [sign]);

  const [urlIndex, setUrlIndex] = useState(0);
  const [hasAllFailed, setHasAllFailed] = useState(false);

  const activeUri = !hasAllFailed && urlIndex < candidateUrls.length ? candidateUrls[urlIndex] : null;

  const handleImageError = () => {
    if (urlIndex + 1 < candidateUrls.length) {
      setUrlIndex((prev) => prev + 1);
    } else {
      setHasAllFailed(true);
    }
  };

  return (
    <View style={styles.upcomingSignRow}>
      {activeUri ? (
        <ExpoImage
          accessibilityLabel={sign.name ?? 'Biển báo'}
          contentFit="contain"
          source={{ uri: activeUri }}
          onError={handleImageError}
          style={styles.upcomingSignImage}
        />
      ) : (
        <View
          style={[
            styles.upcomingSignImage,
            {
              backgroundColor: theme.backgroundElement,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: theme.border,
            },
          ]}
        >
          <MaterialCommunityIcons color="#007b8b" name="traffic-light" size={20} />
        </View>
      )}
      <View style={styles.upcomingSignInfo}>
        <Text numberOfLines={1} style={[styles.upcomingSignName, { color: theme.text }]}>
          {sign.name ?? 'Biển báo'}
        </Text>
        <Text style={[styles.upcomingSignDist, { color: theme.text, fontWeight: '700' }]}>
          {sign.distanceMeters < 1000
            ? `${Math.round(sign.distanceMeters)} m`
            : `${(sign.distanceMeters / 1000).toFixed(1)} km`}
        </Text>
      </View>
    </View>
  );
}

export function NavigationUpcomingSigns({ signs }: NavigationUpcomingSignsProps) {
  const theme = useTheme();

  if (!signs || signs.length === 0) return null;

  return (
    <SafeAreaView edges={['top']} pointerEvents="none" style={styles.upcomingSignsOverlay}>
      <View
        style={[
          styles.upcomingSignsPanel,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.upcomingSignsPanelLabel, { color: theme.grey }]}>Phía trước</Text>
        {signs.map((sign) => (
          <UpcomingSignRow key={sign.id} sign={sign} />
        ))}
      </View>
    </SafeAreaView>
  );
}
