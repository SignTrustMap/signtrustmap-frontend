import AntDesign from '@expo/vector-icons/AntDesign';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import { NavigationMapView } from '@/feature/navigation/components/navigation-map-view';
import {
  currentLocation,
  type MapCoordinate,
} from '@/feature/navigation/data/navigation-locations';
import {
  useGetSurveySubmissionStatus,
  useUpdateSurveySubmission,
  useSubmitSurveySubmission,
} from '@/feature/upload/hooks/use-survey-submission';
import { readDraftImage, useSaveSurveyDraft } from '@/feature/upload/hooks/use-save-survey-draft';
import { readSubmittedStatus } from '@/feature/upload/utils/submission-response';
import type { CoordinateSource, CreateSubmissionDto } from '@/types/survey-submission/surveySubmissionType';
import { useTheme } from '@/hooks/use-theme';
import { AppInput } from '@/components/ui/input';

import { getMapLibre } from '@/services/maplibre';

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

  const mapLibre = getMapLibre();
  if (!mapLibre) {
    throw new Error('Location lookup requires a native build.');
  }

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
  const { session } = useSession();
  const { submissionId } = useLocalSearchParams<{ submissionId?: string }>();
  const draftQuery = useGetSurveySubmissionStatus(submissionId);
  const saveDraft = useSaveSurveyDraft();
  const [imageUri, setImageUri] = useState<string>();
  const [imageName, setImageName] = useState<string>();
  const [imageMimeType, setImageMimeType] = useState<string>();
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const latitude = draftQuery.data?.submission.latitude;
  const longitude = draftQuery.data?.submission.longitude;
  const parsedLatitude = latitude != null ? Number(latitude) : Number.NaN;
  const parsedLongitude = longitude != null ? Number(longitude) : Number.NaN;
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
  const [coordinateSource, setCoordinateSource] = useState<CoordinateSource | undefined>(
    imageCoordinate ? 'IMAGE_EXIF' : undefined,
  );
  const [capturedAt, setCapturedAt] = useState('');
  const [note, setNote] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const { mutateAsync: updateSubmission } = useUpdateSurveySubmission();
  const { mutateAsync: submitSubmission } = useSubmitSurveySubmission();
  const submissionInProgress = useRef(false);
  const hydratedId = useRef<string | undefined>(undefined);
  const [locationMessage, setLocationMessage] = useState<string | undefined>(
    imageCoordinate ? undefined : 'Image GPS is unavailable. Use current location before submitting.',
  );

  useEffect(() => {
    const draft = draftQuery.data?.submission;
    if (!draft || !session || hydratedId.current === draft.id) return;
    let active = true;
    setIsDraftLoaded(false);
    setCapturedAt(draft.capturedAt ?? '');
    setNote(draft.note ?? '');
    const hasCoordinate = draft.latitude != null && draft.longitude != null;
    setSelectedCoordinate(hasCoordinate ? [draft.longitude!, draft.latitude!] : undefined);
    setCoordinateSource(hasCoordinate ? draft.coordinateSource : undefined);
    setLocationMessage(hasCoordinate ? undefined : 'Image GPS is unavailable. Use current location before submitting.');
    void readDraftImage(session.account.id, draft.id).then((local) => {
      if (!active) return;
      const remote = draftQuery.data?.mediaFiles?.find((file) => file.media_type === 'IMAGE')?.file_url;
      setImageUri(local?.uri ?? (remote && /^https?:\/\//i.test(remote) ? remote : undefined));
      setImageName(local?.fileName);
      setImageMimeType(local?.mimeType);
      hydratedId.current = draft.id;
      setIsDraftLoaded(true);
    }).catch(() => {
      if (active) setSubmitError('Unable to restore the draft image. Reopen this page to retry.');
    });
    return () => { active = false; };
  }, [draftQuery.data, session]);

  const handleUseCurrentLocation = async () => {
    if (isLocating || submissionInProgress.current) return;

    setIsLocating(true);
    setLocationMessage(undefined);

    try {
      const coordinate = await getCurrentSurveyCoordinate();

      setSelectedCoordinate(coordinate);
      setCoordinateSource('DEVICE_GPS');
      setFocusRequestId((requestId) => requestId + 1);
    } catch (error) {
      setLocationMessage(
        error instanceof Error
          ? error.message
          : 'Live GPS is unavailable. Please try again.',
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (submissionInProgress.current || isLocating) return;
    if (!submissionId || !isDraftLoaded || draftQuery.data?.submission.status !== 'DRAFT') {
      setSubmitError('Load an editable draft before submitting.');
      return;
    }
    if (!session?.accessToken) {
      setSubmitError('Your session has expired. Log in again and retry.');
      return;
    }
    const captureTimestamp = Date.parse(capturedAt.trim());
    if (!Number.isFinite(captureTimestamp)) {
      setSubmitError('Enter the date and time the photo was taken, including its time zone.');
      return;
    }
    if (!coordinateSource || !selectedCoordinate) {
      setSubmitError('Use an image with GPS metadata or select your current location.');
      return;
    }
    const request: CreateSubmissionDto = {
      submissionType: 'SINGLE_IMAGE',
      capturedAt: new Date(captureTimestamp).toISOString(),
      coordinateSource,
      latitude: selectedCoordinate[1],
      longitude: selectedCoordinate[0],
      note: note.trim(),
    };



    submissionInProgress.current = true;
    setIsSubmitting(true);
    setSubmitError(undefined);
    try {
      const { submissionType: _submissionType, ...updates } = request;
      await updateSubmission({ submissionId, request: updates });
      // A prior interrupted upload can be retried against this same draft.
      const hasImage = draftQuery.data?.mediaFiles?.some((file) => file.media_type === 'IMAGE')
        || draftQuery.data?.sessions.some((upload) => upload.media_type === 'IMAGE' && upload.status === 'COMPLETED');
      if (!hasImage) {
        if (!imageUri) throw new Error('This draft has no uploaded image available. Choose the image again.');
        await saveDraft({ uri: imageUri, fileName: imageName, mimeType: imageMimeType }, request, submissionId);
      }
      const submitted = await submitSubmission({ submissionId });
      const submissionStatus = readSubmittedStatus(submitted);
      router.replace({
        pathname: '/work/survey-finish',
        params: {
          submissionId,
          submissionStatus,
        },
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'The sign could not be submitted. Please retry.',
      );
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
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
              accessibilityLabel="Back to work"
              hitSlop={Spacing.one}
              onPress={() => router.replace({ pathname: '/work', params: { currentRole: 'surveyor' } })}
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

          {draftQuery.isPending ? <Text style={{ color: theme.text }}>Loading draft...</Text> : null}
          {draftQuery.isError ? <AppButton label="Retry loading draft" onPress={() => { void draftQuery.refetch(); }} /> : null}
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
            {imageUri ? (
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
                    android: 'image',
                    ios: 'photo',
                    web: 'image',
                  }}
                  size={40}
                  tintColor={theme.placeholder}
                />
                <Text style={[styles.placeholderLabel, { color: theme.placeholder }]}>
                  Image preview unavailable
                </Text>
              </>
            )}
          </View>

          {isDraftLoaded && !draftQuery.data?.mediaFiles?.some((file) => file.media_type === 'IMAGE') && !imageUri ? (
            <AppButton label="Choose draft image" onPress={() => router.replace({ pathname: '/work/new-survey', params: { draftId: submissionId } })} />
          ) : null}
          <View style={styles.section}>
            <AppInput
              label="Photo capture time"
              accessibilityLabel="Photo capture date and time with time zone"
              placeholder="YYYY-MM-DDTHH:mm:ss+07:00"
              value={capturedAt}
              onChangeText={setCapturedAt}
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.section}>
            <AppInput
              label="Image location (latitude, longitude)"
              accessibilityLabel="Image latitude and longitude, read only"
              editable={false}
              showSoftInputOnFocus={false}
              value={imageCoordinate
                ? `${imageCoordinate[1].toFixed(6)}, ${imageCoordinate[0].toFixed(6)}`
                : ''}
              placeholder="No image location available"
              leadingIcon={<AntDesign name="environment" size={18} color={theme.primary} />}
              containerStyle={styles.imageLocationInput}
            />
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
                <View style={StyleSheet.absoluteFill}>
                  <NavigationMapView
                    focusCoordinate={selectedCoordinate}
                    focusRequestId={focusRequestId}
                    showCurrentLocation
                    isNavigatingFeature
                  />
                </View>
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
              <AppButton
                accessibilityLabel="Zoom map preview"
                style={[
                  styles.mapZoomButton,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
                variant="ghost"
              >
                <AntDesign name="expand" size={20} color={theme.primary} />
              </AppButton>
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
              disabled={isLocating || isSubmitting}
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
            <AppInput
              label={'Note'}
              value={note}
              onChangeText={setNote}
              maxLength={2000}
              editable={!isSubmitting}
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
            disabled={isSubmitting || isLocating || !isDraftLoaded || draftQuery.data?.submission.status !== 'DRAFT'}
            label={isSubmitting ? 'Submitting...' : 'Submit'}
            onPress={handleSubmit}
            style={styles.submitButton}
          />
          {submitError ? (
            <Text accessibilityRole="alert" style={styles.submitError}>
              {submitError}
            </Text>
          ) : null}
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
  imageLocationInput: {
    paddingLeft: Spacing.two,
  },
  mapEmptyState: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  mapZoomButton: {
    position: 'absolute',
    right: Spacing.one,
    bottom: Spacing.one,
    width: 44,
    height: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 1,
    borderRadius: Rounded.md,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
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
  submitError: {
    color: '#C62828',
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 18,
    marginTop: Spacing.one,
  },
});
