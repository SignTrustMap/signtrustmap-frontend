import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { NavigationMapView } from '@/feature/navigation/components/navigation-map-view';
import {
  currentLocation,
  type MapCoordinate,
} from '@/feature/navigation/data/navigation-locations';
import { useTheme } from '@/hooks/use-theme';

type MapLibreModule = typeof import('@maplibre/maplibre-react-native');

async function getCurrentSurveyCoordinate(): Promise<MapCoordinate> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      throw new Error('Location is not available in this browser.');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve([coords.longitude, coords.latitude]),
        (error) => {
          reject(
            new Error(
              error.code === error.PERMISSION_DENIED
                ? 'Allow location access to use your current position.'
                : 'Turn on location services and try again.',
            ),
          );
        },
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 },
      );
    });
  }

  // Guarded require keeps stale development builds from crashing this screen.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mapLibre = require('@maplibre/maplibre-react-native') as MapLibreModule;
  const hasPermission = await mapLibre.LocationManager.requestPermissions();

  if (!hasPermission) {
    throw new Error('Allow location access to use your current position.');
  }

  const position = await mapLibre.LocationManager.getCurrentPosition();

  if (!position) {
    throw new Error('Turn on location services and try again.');
  }

  return [position.coords.longitude, position.coords.latitude];
}

export function SurveyRecordDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { imageType, imageUri, latitude, longitude } = useLocalSearchParams<{
    imageType?: string;
    imageUri?: string;
    latitude?: string;
    longitude?: string;
  }>();
  const parsedLatitude = latitude ? Number(latitude) : Number.NaN;
  const parsedLongitude = longitude ? Number(longitude) : Number.NaN;
  const imageCoordinate: MapCoordinate | undefined =
    Number.isFinite(parsedLatitude) &&
      Number.isFinite(parsedLongitude) &&
      Math.abs(parsedLatitude) <= 90 &&
      Math.abs(parsedLongitude) <= 180
      ? [parsedLongitude, parsedLatitude]
      : undefined;
  const [selectedCoordinate, setSelectedCoordinate] = useState<MapCoordinate | undefined>(
    imageCoordinate ?? currentLocation.coordinate,
  );
  const [focusRequestId, setFocusRequestId] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | undefined>(
    imageCoordinate ? undefined : 'Image GPS is unavailable. Using the demo current location.',
  );

  const handleUseCurrentLocation = async () => {
    if (isLocating) return;

    setIsLocating(true);
    setLocationMessage(undefined);

    try {
      const coordinate = await getCurrentSurveyCoordinate();

      setSelectedCoordinate(coordinate);
      setFocusRequestId((requestId) => requestId + 1);
    } catch (error) {
      setSelectedCoordinate(currentLocation.coordinate);
      setFocusRequestId((requestId) => requestId + 1);
      setLocationMessage(
        error instanceof Error
          ? `${error.message} Using the demo current location.`
          : 'Live GPS is unavailable. Using the demo current location.',
      );
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <AppButton
              accessibilityLabel="Back to media selection"
              hitSlop={Spacing.one}
              onPress={() => router.back()}
              pressedOpacity={0.7}
              style={styles.backButton}
              variant="ghost"
            >
              <SymbolView
                fallback={<Text style={[styles.backFallback, { color: theme.text }]}>{'<'}</Text>}
                name={{ android: 'arrow_back', ios: 'chevron.left', web: 'arrow_back' }}
                size={22}
                tintColor={theme.text}
              />
            </AppButton>
            <Text style={[styles.title, { color: theme.text }]}>New Survey Record</Text>
          </View>

          <View
            accessibilityLabel={imageUri ? 'Selected survey media' : 'No survey media selected'}
            style={[
              styles.imageFrame,
              {
                backgroundColor: theme.neutral,
                borderColor: theme.border,
              },
            ]}
          >
            {imageUri && imageType !== 'video' ? (
              <Image
                accessibilityLabel="Selected survey image"
                contentFit="cover"
                source={{ uri: imageUri }}
                style={styles.image}
              />
            ) : (
              <>
                <SymbolView
                  fallback={
                    <Text style={[styles.imageFallback, { color: theme.placeholder }]}>IMG</Text>
                  }
                  name={{
                    android: imageType === 'video' ? 'video_library' : 'image',
                    ios: imageType === 'video' ? 'video' : 'photo',
                    web: imageType === 'video' ? 'video_library' : 'image',
                  }}
                  size={40}
                  tintColor={theme.placeholder}
                />
                <Text style={[styles.placeholderLabel, { color: theme.placeholder }]}>
                  {imageType === 'video' ? 'Selected survey video' : 'No image selected'}
                </Text>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Map Preview</Text>
            <View
              accessibilityLabel={
                selectedCoordinate
                  ? `Selected survey location at ${selectedCoordinate[1]}, ${selectedCoordinate[0]}`
                  : 'No survey location selected'
              }
              style={[
                styles.mapPlaceholder,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              {selectedCoordinate ? (
                <NavigationMapView
                  focusCoordinate={selectedCoordinate}
                  focusRequestId={focusRequestId}
                  showCurrentLocation
                  isNavigatingFeature
                />
              ) : (
                <View style={styles.mapEmptyState}>
                  <SymbolView
                    fallback={
                      <Text style={[styles.pinFallback, { color: theme.placeholder }]}>PIN</Text>
                    }
                    name={{ android: 'location_off', ios: 'location.slash', web: 'location_off' }}
                    size={28}
                    tintColor={theme.placeholder}
                  />
                  <Text style={[styles.mapEmptyText, { color: theme.placeholder }]}>
                    No GPS metadata found in this image
                  </Text>
                </View>
              )}
            </View>
            {selectedCoordinate ? (
              <Text style={[styles.coordinateText, { color: theme.textSecondary }]}>
                {selectedCoordinate[1].toFixed(6)}, {selectedCoordinate[0].toFixed(6)}
              </Text>
            ) : null}
            <AppButton
              accessibilityLabel={
                isLocating ? 'Getting current location' : 'Use current location for this survey'
              }
              disabled={isLocating}
              onPress={handleUseCurrentLocation}
              style={styles.locationButton}
            >
              <SymbolView
                name={{ android: 'my_location', ios: 'location.fill', web: 'my_location' }}
                size={16}
                tintColor={theme.onPrimary}
              />
              <Text style={[styles.locationButtonText, { color: theme.onPrimary }]}>
                {isLocating ? 'Getting location...' : 'Use current location'}
              </Text>
            </AppButton>
            {locationMessage ? (
              <Text
                accessibilityRole="alert"
                style={[styles.locationMessage, { color: theme.textSecondary }]}
              >
                {locationMessage}
              </Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Note</Text>
            <TextInput
              accessibilityLabel="Survey note"
              multiline
              placeholder="Enter additional details..."
              placeholderTextColor={theme.placeholder}
              style={[
                styles.noteInput,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              textAlignVertical="top"
            />
          </View>

          <AppButton
            label="Submit"
            onPress={() => router.replace('/work/survey-finish')}
            style={styles.submitButton} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  backButton: {
    width: 40,
    height: 40,
    minHeight: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  backFallback: {
    fontFamily: Fonts.body,
    fontSize: 24,
    fontWeight: 700,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.title,
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 32,
  },
  imageFrame: {
    height: 176,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Rounded.lg,
    marginBottom: Spacing.four,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 900,
  },
  placeholderLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 600,
  },
  section: {
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 18,
  },
  mapPlaceholder: {
    height: 164,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Rounded.lg,
  },
  mapEmptyState: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  mapEmptyText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 18,
    textAlign: 'center',
  },
  coordinateText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 17,
  },
  pinFallback: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: 900,
  },
  locationButton: {
    minHeight: 42,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.half,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  locationButtonText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 18,
  },
  locationMessage: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 17,
  },
  noteInput: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    alignSelf: 'stretch',
  },
});
