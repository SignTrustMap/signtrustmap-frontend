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
import { extractGpxGpsData } from '@/feature/upload/utils/gpx';

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
  const { submissionId, gpxUri, gpxName } = useLocalSearchParams<{
    submissionId?: string;
    gpxUri?: string;
    gpxName?: string;
  }>();
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
  const displayCoordinate = selectedCoordinate ?? imageCoordinate;
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
    imageCoordinate ? undefined : 'Location metadata is unavailable. Use current location before submitting.',
  );

  useEffect(() => {
    if (!gpxUri) return;
    let active = true;
    void extractGpxGpsData(gpxUri).then((gpxData) => {
      if (active && gpxData?.firstPoint) {
        const coord: MapCoordinate = [gpxData.firstPoint.longitude, gpxData.firstPoint.latitude];
        setSelectedCoordinate(coord);
        setCoordinateSource('GPX_FILE');
        setLocationMessage(gpxName ? `Coordinates loaded from ${gpxName}` : undefined);
        setFocusRequestId((r) => r + 1);
        if (gpxData.startTime) {
          setCapturedAt((prev) => prev || gpxData.startTime || '');
        }
      }
    });
    return () => { active = false; };
  }, [gpxName, gpxUri]);

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
    setLocationMessage(hasCoordinate ? undefined : 'Location metadata is unavailable. Use current location before submitting.');
    void readDraftImage(session.account.id, draft.id).then(async (local) => {
      if (!active) return;
      const remote = draftQuery.data?.mediaFiles?.find((file) => file.media_type === 'IMAGE' || file.media_type === 'VIDEO')?.file_url;
      setImageUri(local?.uri ?? (remote && /^https?:\/\//i.test(remote) ? remote : undefined));
      setImageName(local?.fileName);
      setImageMimeType(local?.mimeType);

      const activeGpx = gpxUri || local?.gpxUri;
      if (activeGpx) {
        try {
          const gpxData = await extractGpxGpsData(activeGpx);
          if (gpxData?.firstPoint && active) {
            const coord: MapCoordinate = [gpxData.firstPoint.longitude, gpxData.firstPoint.latitude];
            setSelectedCoordinate(coord);
            setCoordinateSource('GPX_FILE');
            setLocationMessage(undefined);
            setFocusRequestId((r) => r + 1);
            if (gpxData.startTime && !draft.capturedAt) {
              setCapturedAt(gpxData.startTime);
            }
          }
        } catch (err) {
          console.warn('[Surveyor] Failed to extract GPX in details:', err);
        }
      }

      hydratedId.current = draft.id;
      setIsDraftLoaded(true);
    }).catch(() => {
      if (active) setSubmitError('Unable to restore the draft media. Reopen this page to retry.');
    });
    return () => { active = false; };
  }, [draftQuery.data, gpxUri, session]);

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
    const isVideoDraft = draftQuery.data?.submission.submissionType === 'VIDEO_GPX'
      || imageMimeType?.startsWith('video/')
      || Boolean(gpxUri);
    const request: CreateSubmissionDto = {
      submissionType: isVideoDraft ? 'VIDEO_GPX' : 'SINGLE_IMAGE',
      capturedAt: new Date(captureTimestamp).toISOString(),
      coordinateSource: coordinateSource ?? (isVideoDraft ? 'GPX_FILE' : 'IMAGE_EXIF'),
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
      const hasMedia = draftQuery.data?.mediaFiles?.some((file) => file.media_type === 'IMAGE' || file.media_type === 'VIDEO')
        || draftQuery.data?.sessions.some((upload) => (upload.media_type === 'IMAGE' || upload.media_type === 'VIDEO') && upload.status === 'COMPLETED');
      if (!hasMedia) {
        if (!imageUri) throw new Error('This draft has no uploaded media available. Choose the file again.');
        await saveDraft({ uri: imageUri, fileName: imageName, mimeType: imageMimeType, type: isVideoDraft ? 'video' : 'image' }, request, submissionId);
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
            {imageUri && !imageMimeType?.startsWith('video/') && !/\.(mp4|mov|mkv)$/i.test(imageUri) ? (
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
                    <Text style={[styles.imageFallback, { color: theme.placeholder }]}>
                      {imageMimeType?.startsWith('video/') || (imageUri && /\.(mp4|mov|mkv)$/i.test(imageUri)) ? 'VID' : 'IMG'}
                    </Text>
                  }
                  name={{
                    android: imageMimeType?.startsWith('video/') || (imageUri && /\.(mp4|mov|mkv)$/i.test(imageUri)) ? 'videocam' : 'image',
                    ios: imageMimeType?.startsWith('video/') || (imageUri && /\.(mp4|mov|mkv)$/i.test(imageUri)) ? 'video' : 'photo',
                    web: imageMimeType?.startsWith('video/') || (imageUri && /\.(mp4|mov|mkv)$/i.test(imageUri)) ? 'videocam' : 'image',
                  }}
                  size={40}
                  tintColor={theme.primary}
                />
                <Text style={[styles.placeholderLabel, { color: theme.textSecondary }]}>
                  {imageName ?? (imageMimeType?.startsWith('video/') || (imageUri && /\.(mp4|mov|mkv)$/i.test(imageUri)) ? 'Video survey recording' : 'Media preview unavailable')}
                </Text>
              </>
            )}
          </View>

          {isDraftLoaded && !draftQuery.data?.mediaFiles?.some((file) => file.media_type === 'IMAGE' || file.media_type === 'VIDEO') && !imageUri ? (
            <AppButton label="Choose draft media" onPress={() => router.replace({ pathname: '/work/new-survey', params: { draftId: submissionId } })} />
          ) : null}
          <View style={styles.section}>
            <AppInput
              label="Capture time"
              accessibilityLabel="Media capture date and time with time zone"
              placeholder="YYYY-MM-DDTHH:mm:ss+07:00"
              value={capturedAt}
              onChangeText={setCapturedAt}
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.section}>
            <AppInput
              label={coordinateSource === 'GPX_FILE' ? 'GPX location (latitude, longitude)' : 'Location (latitude, longitude)'}
              accessibilityLabel="Location latitude and longitude, read only"
              editable={false}
              showSoftInputOnFocus={false}
              value={displayCoordinate
                ? `${displayCoordinate[1].toFixed(6)}, ${displayCoordinate[0].toFixed(6)}`
                : ''}
              placeholder={coordinateSource === 'GPX_FILE' ? 'Extracting GPX location...' : 'No location available'}
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
