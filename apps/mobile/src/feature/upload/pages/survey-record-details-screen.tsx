import AntDesign from '@expo/vector-icons/AntDesign';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useReverseGeocode } from '@/feature/upload/hooks/use-reverse-geocode';
import { readDraftImage, useSaveSurveyDraft } from '@/feature/upload/hooks/use-save-survey-draft';
import { readSubmittedStatus } from '@/feature/upload/utils/submission-response';
import type { CoordinateSource, CreateSubmissionDto } from '@/types/survey-submission/surveySubmissionType';
import { useTheme } from '@/hooks/use-theme';
import { AppInput } from '@/components/ui/input';
import { extractGpxGpsData } from '@/feature/upload/utils/gpx';
import { estimateEndPoint } from '@/feature/upload/utils/video-gps';
import { executeChunkedVideoUpload, type UploadProgressInfo } from '@/feature/upload/utils/chunk-upload-manager';
import { registerZeroCopyDraft, startSmartPollingSync } from '@/feature/upload/utils/crop-sync-manager';

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
  const { submissionId, gpxUri, gpxName, startLat, startLon, duration, assetId } = useLocalSearchParams<{
    submissionId?: string;
    gpxUri?: string;
    gpxName?: string;
    startLat?: string;
    startLon?: string;
    duration?: string;
    assetId?: string;
  }>();
  const draftQuery = useGetSurveySubmissionStatus(submissionId);
  const saveDraft = useSaveSurveyDraft();
  const [imageUri, setImageUri] = useState<string>();
  const [imageName, setImageName] = useState<string>();
  const [imageMimeType, setImageMimeType] = useState<string>();
  const [savedGpxUri, setSavedGpxUri] = useState<string>();
  const [savedGpxName, setSavedGpxName] = useState<string>();
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

  const parsedStartLat = startLat ? Number(startLat) : parsedLatitude;
  const parsedStartLon = startLon ? Number(startLon) : parsedLongitude;
  const initialStartCoord: MapCoordinate | undefined =
    Number.isFinite(parsedStartLat) && Number.isFinite(parsedStartLon)
      ? [parsedStartLon, parsedStartLat]
      : imageCoordinate;

  const durationSec = duration ? Math.max(1, Number(duration)) : 60;
  const [startCoordinate, setStartCoordinate] = useState<MapCoordinate | undefined>(initialStartCoord);
  const [endCoordinate, setEndCoordinate] = useState<MapCoordinate | undefined>(() => {
    if (initialStartCoord) {
      return estimateEndPoint(initialStartCoord, durationSec);
    }
    return undefined;
  });
  const [isLocatingEnd, setIsLocatingEnd] = useState(false);
  const [isGpxAccordionOpen, setIsGpxAccordionOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo | undefined>(undefined);

  const [selectedCoordinate, setSelectedCoordinate] = useState<MapCoordinate | undefined>(
    initialStartCoord ?? currentLocation.coordinate,
  );
  const effectiveStartCoord = startCoordinate ?? selectedCoordinate ?? imageCoordinate;
  const displayCoordinate = effectiveStartCoord;
  const startLocationQuery = useReverseGeocode(
    effectiveStartCoord ? { latitude: effectiveStartCoord[1], longitude: effectiveStartCoord[0] } : null,
  );
  const [focusRequestId, setFocusRequestId] = useState(1);
  const [coordinateSource, setCoordinateSource] = useState<CoordinateSource | undefined>(
    imageCoordinate ? 'IMAGE_EXIF' : undefined,
  );
  const [capturedAt, setCapturedAt] = useState('');
  const [note, setNote] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const { mutateAsync: updateSubmission } = useUpdateSurveySubmission();
  const { mutateAsync: submitSubmission } = useSubmitSurveySubmission();
  const submissionInProgress = useRef(false);
  const hydratedId = useRef<string | undefined>(undefined);
  const [initialBaseline, setInitialBaseline] = useState<{
    note: string;
    capturedAt: string;
    longitude?: number;
    latitude?: number;
    gpxUri?: string;
  }>();
  const [locationMessage, setLocationMessage] = useState<string | undefined>(
    imageCoordinate ? undefined : 'Location metadata is unavailable. Use current location before submitting.',
  );

  const remoteGpx = draftQuery.data?.mediaFiles?.find((f) => f.media_type === 'GPX');
  const activeGpxUri = gpxUri || savedGpxUri;
  const activeGpxName = gpxName || savedGpxName;
  const displayGpxName = activeGpxName
    || (activeGpxUri ? activeGpxUri.split('/').pop()?.split('?')[0] : undefined)
    || (remoteGpx ? (remoteGpx.file_url?.split('/').pop()?.split('?')[0] ?? 'Attached GPX track') : '');

  const isDirty = isModified
    || (Boolean(initialBaseline) && (
      note !== initialBaseline!.note
      || capturedAt !== initialBaseline!.capturedAt
      || (selectedCoordinate?.[0] !== initialBaseline!.longitude || selectedCoordinate?.[1] !== initialBaseline!.latitude)
      || (activeGpxUri !== initialBaseline!.gpxUri)
    ));
  const submissionStatus = draftQuery.data?.submission.status;
  const isEditable =
    isDirty ||
    submissionStatus === 'DRAFT' ||
    submissionStatus === 'PENDING_CORRECTION' ||
    submissionStatus === 'FAILED';

  // GPX fields are only relevant for video-based (VIDEO_GPX) submissions.
  // For plain image submissions we hide the GPX section entirely.
  const isImageSubmission =
    draftQuery.data?.submission.submissionType === 'SINGLE_IMAGE'
    || (
      draftQuery.data?.submission.submissionType !== 'VIDEO_GPX'
      && !imageMimeType?.startsWith('video/')
      && !(imageUri && /\.(mp4|mov|mkv)$/i.test(imageUri))
      && !activeGpxUri
      && !duration
    );

  const endLocationQuery = useReverseGeocode(
    !isImageSubmission && endCoordinate ? { latitude: endCoordinate[1], longitude: endCoordinate[0] } : null,
  );

  const handlePickGpx = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['application/gpx+xml', 'application/octet-stream', '*/*'],
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const name = file.name ?? '';
        if (!name.toLowerCase().endsWith('.gpx')) {
          setSubmitError('Please select a valid GPX file (.gpx).');
          return;
        }
        setSavedGpxUri(file.uri);
        setSavedGpxName(name);
        setIsModified(true);
        setSubmitError(undefined);

        const gpxData = await extractGpxGpsData(file.uri);
        if (gpxData?.firstPoint) {
          const coord: MapCoordinate = [gpxData.firstPoint.longitude, gpxData.firstPoint.latitude];
          setSelectedCoordinate(coord);
          setStartCoordinate(coord);
          if (gpxData.lastPoint) {
            setEndCoordinate([gpxData.lastPoint.longitude, gpxData.lastPoint.latitude]);
          } else {
            setEndCoordinate(estimateEndPoint(coord, durationSec));
          }
          setCoordinateSource('GPX_FILE');
          setLocationMessage(`Coordinates loaded from ${name}`);
          setFocusRequestId((r) => r + 1);
          if (gpxData.startTime && !capturedAt) {
            setCapturedAt(gpxData.startTime);
          }
        }
      }
    } catch (err) {
      console.warn('[Surveyor] Unable to pick GPX in details screen:', err);
    }
  };

  useEffect(() => {
    if (!gpxUri) return;
    let active = true;
    void extractGpxGpsData(gpxUri).then((gpxData) => {
      if (active && gpxData?.firstPoint) {
        const coord: MapCoordinate = [gpxData.firstPoint.longitude, gpxData.firstPoint.latitude];
        setSelectedCoordinate(coord);
        setStartCoordinate(coord);
        if (gpxData.lastPoint) {
          setEndCoordinate([gpxData.lastPoint.longitude, gpxData.lastPoint.latitude]);
        } else {
          setEndCoordinate(estimateEndPoint(coord, durationSec));
        }
        setCoordinateSource('GPX_FILE');
        setLocationMessage(gpxName ? `Coordinates loaded from ${gpxName}` : undefined);
        setFocusRequestId((r) => r + 1);
        if (gpxData.startTime) {
          setCapturedAt((prev) => prev || gpxData.startTime || '');
        }
      }
    });
    return () => { active = false; };
  }, [durationSec, gpxName, gpxUri]);

  useEffect(() => {
    const draft = draftQuery.data?.submission;
    if (!draft || !session || hydratedId.current === draft.id) return;
    let active = true;
    void readDraftImage(session.account.id, draft.id).then(async (local) => {
      if (!active) return;
      setIsDraftLoaded(false);
      setCapturedAt(draft.capturedAt ?? '');
      setNote(draft.note ?? '');
      const hasCoordinate = draft.latitude != null && draft.longitude != null;
      if (hasCoordinate) {
        const coord: MapCoordinate = [draft.longitude!, draft.latitude!];
        setSelectedCoordinate(coord);
        setStartCoordinate((prev) => prev ?? coord);
        setEndCoordinate((prev) => prev ?? estimateEndPoint(coord, durationSec));
      }
      setCoordinateSource(hasCoordinate ? draft.coordinateSource : undefined);
      setLocationMessage(hasCoordinate ? undefined : 'Location metadata is unavailable. Use current location before submitting.');
      const remote = draftQuery.data?.mediaFiles?.find((file) => file.media_type === 'IMAGE' || file.media_type === 'VIDEO')?.file_url;
      setImageUri(local?.uri ?? (remote && /^https?:\/\//i.test(remote) ? remote : undefined));
      setImageName(local?.fileName);
      setImageMimeType(local?.mimeType);
      if (local?.gpxUri) setSavedGpxUri(local.gpxUri);
      if (local?.gpxName) setSavedGpxName(local.gpxName);

      const activeGpx = gpxUri || local?.gpxUri;
      if (activeGpx) {
        try {
          const gpxData = await extractGpxGpsData(activeGpx);
          if (gpxData?.firstPoint && active) {
            const coord: MapCoordinate = [gpxData.firstPoint.longitude, gpxData.firstPoint.latitude];
            setSelectedCoordinate(coord);
            setStartCoordinate(coord);
            if (gpxData.lastPoint) {
              setEndCoordinate([gpxData.lastPoint.longitude, gpxData.lastPoint.latitude]);
            } else {
              setEndCoordinate(estimateEndPoint(coord, durationSec));
            }
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
      setInitialBaseline({
        note: draft.note ?? '',
        capturedAt: draft.capturedAt ?? '',
        longitude: hasCoordinate ? draft.longitude! : undefined,
        latitude: hasCoordinate ? draft.latitude! : undefined,
        gpxUri: local?.gpxUri ?? gpxUri,
      });
      setIsDraftLoaded(true);
      setIsModified(false);
    }).catch(() => {
      if (active) {
        setIsDraftLoaded(true);
        setSubmitError('Unable to restore the draft media. Reopen this page to retry.');
      }
    });
    return () => { active = false; };
  }, [draftQuery.data, durationSec, gpxUri, session]);

  const handleUseCurrentLocation = async () => {
    if (isLocating || submissionInProgress.current) return;

    setIsLocating(true);
    setLocationMessage(undefined);

    try {
      const coordinate = await getCurrentSurveyCoordinate();
      setSelectedCoordinate(coordinate);
      setStartCoordinate(coordinate);
      if (!endCoordinate) {
        setEndCoordinate(estimateEndPoint(coordinate, durationSec));
      }
      setCoordinateSource(!isImageSubmission ? 'GPX_FILE' : 'DEVICE_GPS');
      setIsModified(true);
      setSubmitError(undefined);
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

  const handleUseCurrentLocationForEnd = async () => {
    if (isLocatingEnd || submissionInProgress.current) return;
    setIsLocatingEnd(true);
    try {
      const coord = await getCurrentSurveyCoordinate();
      setEndCoordinate(coord);
      setIsModified(true);
      setSubmitError(undefined);
    } catch (err) {
      setLocationMessage(err instanceof Error ? err.message : 'Unable to get location for end point.');
    } finally {
      setIsLocatingEnd(false);
    }
  };

  const handleSubmit = async () => {
    if (submissionInProgress.current || isLocating || isLocatingEnd) return;
    if (!submissionId || !isDraftLoaded || !isEditable) {
      setSubmitError('Load an editable draft before submitting.');
      return;
    }
    if (!session?.accessToken) {
      setSubmitError('Your session has expired. Log in again and retry.');
      return;
    }
    const captureTimestamp = Date.parse(capturedAt.trim());
    if (!Number.isFinite(captureTimestamp)) {
      setSubmitError('Enter the date and time the media was recorded, including its time zone.');
      return;
    }

    const effectiveStart = startCoordinate ?? selectedCoordinate;
    if (!effectiveStart) {
      setSubmitError('Use media with GPS metadata or select your current location.');
      return;
    }

    const isVideoDraft = !isImageSubmission;

    submissionInProgress.current = true;
    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      const formattedCapturedAt = new Date(captureTimestamp).toISOString();

      console.log('[Surveyor] handleSubmit started:', {
        submissionId,
        isVideoDraft,
        imageUri,
        durationSec,
        startCoordinate: effectiveStart,
        endCoordinate,
        capturedAt: formattedCapturedAt,
      });

      if (isVideoDraft) {
        if (!imageUri) {
          throw new Error('This draft has no video media available. Choose the file again.');
        }

        const effectiveEnd = endCoordinate ?? estimateEndPoint(effectiveStart, durationSec);

        console.log('[Surveyor] Starting executeChunkedVideoUpload...');
        // 1. Chunked video upload (1-minute temporal chunks down-res 640p + companion GPX)
        await executeChunkedVideoUpload({
          submissionId,
          videoUri: imageUri,
          videoFileName: imageName,
          durationSeconds: durationSec,
          startCoordinate: effectiveStart,
          endCoordinate: effectiveEnd,
          capturedAt: formattedCapturedAt,
          accessToken: session.accessToken,
          manualGpxUri: activeGpxUri,
          manualGpxName: activeGpxName,
          onProgress: (info) => {
            console.log('[Surveyor] Upload progress:', info);
            setUploadProgress(info);
          },
        });
        console.log('[Surveyor] executeChunkedVideoUpload finished.');

        // 2. Register zero-copy draft for high-res 4K RoI cropping
        await registerZeroCopyDraft(submissionId, imageUri, assetId);

        // 3. Start Layer 1 Foreground Smart Polling
        startSmartPollingSync(submissionId, imageUri, session.accessToken);

        // 4. Update submission metadata with GPX_FILE and coordinates
        console.log('[Surveyor] Updating submission metadata with GPX_FILE coordinates...');
        await updateSubmission({
          submissionId,
          request: {
            capturedAt: formattedCapturedAt,
            coordinateSource: 'GPX_FILE',
            latitude: effectiveStart[1],
            longitude: effectiveStart[0],
            note: note.trim(),
          },
        });
        console.log('[Surveyor] Submission metadata updated successfully.');
      } else {
        // Single Image Upload Flow
        const request: CreateSubmissionDto = {
          submissionType: 'SINGLE_IMAGE',
          capturedAt: formattedCapturedAt,
          coordinateSource: coordinateSource ?? 'IMAGE_EXIF',
          latitude: effectiveStart[1],
          longitude: effectiveStart[0],
          note: note.trim(),
        };
        const { submissionType: _submissionType, ...updates } = request;
        await updateSubmission({ submissionId, request: updates });

        const mediaFiles = draftQuery.data?.mediaFiles ?? [];
        const sessions = draftQuery.data?.sessions ?? [];
        const hasMainMedia = mediaFiles.some((file) => file.media_type === 'IMAGE')
          || sessions.some((upload) => upload.media_type === 'IMAGE' && upload.status === 'COMPLETED');

        if (!hasMainMedia) {
          if (!imageUri) throw new Error('This draft has no uploaded media available. Choose the file again.');
          await saveDraft(
            { uri: imageUri, fileName: imageName, mimeType: imageMimeType, type: 'image' },
            request,
            submissionId,
          );
        }
      }

      // 5. Submit to finalize
      console.log('[Surveyor] Finalizing submission via submitSubmission...');
      const submitted = await submitSubmission({ submissionId });
      const submissionStatus = readSubmittedStatus(submitted);
      console.log('[Surveyor] Submission finalized:', { submissionId, submissionStatus });
      router.replace({
        pathname: '/work/survey-finish',
        params: {
          submissionId,
          submissionStatus,
        },
      });
    } catch (error) {
      console.error('[Surveyor] handleSubmit ERROR:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'The survey could not be submitted. Please retry.',
      );
      setIsModified(true);
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
      setUploadProgress(undefined);
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
              onChangeText={(text) => {
                setCapturedAt(text);
                setIsModified(true);
                setSubmitError(undefined);
              }}
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>

          {/* Location / Telemetry Section */}
          {!isImageSubmission ? (
            <>
              {/* Start Point (S) */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.subSectionTitle, { color: theme.text }]}>
                    Start Point (S)
                  </Text>
                  <AppButton
                    accessibilityLabel="Use current location for start point"
                    disabled={isLocating || isSubmitting}
                    onPress={handleUseCurrentLocation}
                    variant="ghost"
                    style={styles.locationSmallButton}
                  >
                    <SymbolView
                      name={{ android: 'my_location', ios: 'location.fill', web: 'my_location' }}
                      size={14}
                      tintColor={theme.primary}
                    />
                    <Text style={[styles.locationSmallButtonText, { color: theme.primary }]}>
                      {isLocating ? 'Locating...' : 'Get Location'}
                    </Text>
                  </AppButton>
                </View>
                <AppInput
                  label="Start Location (latitude, longitude)"
                  accessibilityLabel="Start Location latitude and longitude"
                  editable={false}
                  showSoftInputOnFocus={false}
                  value={effectiveStartCoord
                    ? `${effectiveStartCoord[1].toFixed(6)}, ${effectiveStartCoord[0].toFixed(6)}`
                    : 'No start location available'}
                  placeholder="No start location available"
                  leadingIcon={<MaterialCommunityIcons name="map-marker" size={20} color="#16A34A" />}
                  containerStyle={styles.imageLocationInput}
                />
                {effectiveStartCoord ? (
                  <View style={[styles.addressResolvedCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <View style={styles.addressResolvedHeader}>
                      <MaterialCommunityIcons name="map-marker-radius" size={16} color="#16A34A" />
                      <Text style={[styles.addressResolvedTitle, { color: theme.textSecondary }]}>
                        {startLocationQuery.isLoading ? 'Resolving start location...' : 'Start Location Address'}
                      </Text>
                      {startLocationQuery.isLoading ? (
                        <ActivityIndicator size="small" color="#16A34A" style={{ marginLeft: 6 }} />
                      ) : null}
                    </View>
                    <Text style={[styles.addressResolvedText, { color: theme.text }]}>
                      {startLocationQuery.data?.displayAddress || (startLocationQuery.isLoading ? 'Querying spatial service...' : 'Location address unavailable')}
                    </Text>
                    {startLocationQuery.data?.roadName ? (
                      <Text style={[styles.addressRoadText, { color: '#16A34A' }]}>
                        🛣️ {startLocationQuery.data.roadName}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>

              {/* End Point (D) */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.subSectionTitle, { color: theme.text }]}>
                    End Point (D)
                  </Text>
                  <AppButton
                    accessibilityLabel="Use current location for end point"
                    disabled={isLocatingEnd || isSubmitting}
                    onPress={handleUseCurrentLocationForEnd}
                    variant="ghost"
                    style={styles.locationSmallButton}
                  >
                    <SymbolView
                      name={{ android: 'my_location', ios: 'location.fill', web: 'my_location' }}
                      size={14}
                      tintColor={theme.primary}
                    />
                    <Text style={[styles.locationSmallButtonText, { color: theme.primary }]}>
                      {isLocatingEnd ? 'Locating...' : 'Get Location'}
                    </Text>
                  </AppButton>
                </View>
                <AppInput
                  label="End Location (latitude, longitude)"
                  accessibilityLabel="End Location latitude and longitude"
                  editable={false}
                  showSoftInputOnFocus={false}
                  value={endCoordinate
                    ? `${endCoordinate[1].toFixed(6)}, ${endCoordinate[0].toFixed(6)}`
                    : 'Estimated from video duration...'}
                  placeholder="Estimating end location..."
                  leadingIcon={<MaterialCommunityIcons name="flag-checkered" size={20} color="#DC2626" />}
                  containerStyle={styles.imageLocationInput}
                />
                {endCoordinate ? (
                  <View style={[styles.addressResolvedCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <View style={styles.addressResolvedHeader}>
                      <MaterialCommunityIcons name="flag-checkered" size={16} color="#DC2626" />
                      <Text style={[styles.addressResolvedTitle, { color: theme.textSecondary }]}>
                        {endLocationQuery.isLoading ? 'Resolving end location...' : 'End Location Address'}
                      </Text>
                      {endLocationQuery.isLoading ? (
                        <ActivityIndicator size="small" color="#DC2626" style={{ marginLeft: 6 }} />
                      ) : null}
                    </View>
                    <Text style={[styles.addressResolvedText, { color: theme.text }]}>
                      {endLocationQuery.data?.displayAddress || (endLocationQuery.isLoading ? 'Querying spatial service...' : 'Location address unavailable')}
                    </Text>
                    {endLocationQuery.data?.roadName ? (
                      <Text style={[styles.addressRoadText, { color: '#DC2626' }]}>
                        🛣️ {endLocationQuery.data.roadName}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>

              {/* Advanced GPX Accordion */}
              <View style={styles.section}>
                <Pressable
                  onPress={() => setIsGpxAccordionOpen(!isGpxAccordionOpen)}
                  style={[styles.accordionHeader, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                >
                  <View style={styles.accordionHeaderLeft}>
                    <AntDesign name="file-text" size={18} color={theme.primary} />
                    <Text style={[styles.accordionTitle, { color: theme.text }]}>
                      Advanced: Attach external GPX file
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={isGpxAccordionOpen ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={theme.textSecondary}
                  />
                </Pressable>

                {isGpxAccordionOpen ? (
                  <View style={[styles.accordionBody, { borderColor: theme.border, backgroundColor: theme.neutral }]}>
                    <Text style={[styles.accordionDesc, { color: theme.textSecondary }]}>
                      The system automatically extracts GPS and generates a companion GPX track. Only attach an external GPX file if you want to use a route from a dedicated GPS device.
                    </Text>
                    <AppInput
                      label="GPX file"
                      accessibilityLabel="Attached GPX track file"
                      editable={false}
                      showSoftInputOnFocus={false}
                      value={displayGpxName || 'Auto-extracted from video GPS'}
                      placeholder="No GPX file attached"
                      leadingIcon={<AntDesign name="file-text" size={18} color={theme.primary} />}
                      containerStyle={styles.imageLocationInput}
                    />
                    {!isSubmitting ? (
                      <View style={styles.gpxActionsRow}>
                        <AppButton
                          label={displayGpxName ? 'Choose different GPX file' : 'Choose GPX file (.gpx)'}
                          variant="surface"
                          onPress={handlePickGpx}
                          style={styles.attachGpxButton}
                        />
                        {displayGpxName ? (
                          <AppButton
                            label="Use auto GPS"
                            variant="ghost"
                            onPress={() => {
                              setSavedGpxUri(undefined);
                              setSavedGpxName(undefined);
                              setIsModified(true);
                            }}
                            style={styles.attachGpxButton}
                          />
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            /* Single Image Location Input */
            <View style={styles.section}>
              <AppInput
                label="Location (latitude, longitude)"
                accessibilityLabel="Location latitude and longitude, read only"
                editable={false}
                showSoftInputOnFocus={false}
                value={displayCoordinate
                  ? `${displayCoordinate[1].toFixed(6)}, ${displayCoordinate[0].toFixed(6)}`
                  : ''}
                placeholder="No location available"
                leadingIcon={<AntDesign name="environment" size={18} color={theme.primary} />}
                containerStyle={styles.imageLocationInput}
              />
              {effectiveStartCoord ? (
                <View style={[styles.addressResolvedCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <View style={styles.addressResolvedHeader}>
                    <MaterialCommunityIcons name="map-marker-radius" size={16} color={theme.primary} />
                    <Text style={[styles.addressResolvedTitle, { color: theme.textSecondary }]}>
                      {startLocationQuery.isLoading ? 'Resolving actual location...' : 'Actual Location (Address)'}
                    </Text>
                    {startLocationQuery.isLoading ? (
                      <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 6 }} />
                    ) : null}
                  </View>
                  <Text style={[styles.addressResolvedText, { color: theme.text }]}>
                    {startLocationQuery.data?.displayAddress || (startLocationQuery.isLoading ? 'Querying spatial service...' : 'Location address unavailable')}
                  </Text>
                  {startLocationQuery.data?.roadName ? (
                    <Text style={[styles.addressRoadText, { color: theme.primary }]}>
                      🛣️ {startLocationQuery.data.roadName}
                    </Text>
                  ) : null}
                </View>
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
            </View>
          )}

          {/* Map Preview */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Map Preview</Text>
            <View
              accessibilityLabel={
                effectiveStartCoord
                  ? `Selected survey location at ${effectiveStartCoord[1]}, ${effectiveStartCoord[0]}`
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
              {effectiveStartCoord ? (
                <View style={StyleSheet.absoluteFill}>
                  <NavigationMapView
                    focusCoordinate={effectiveStartCoord}
                    focusRequestId={focusRequestId}
                    routeStart={!isImageSubmission ? effectiveStartCoord : undefined}
                    destination={
                      !isImageSubmission && endCoordinate
                        ? {
                          coordinate: endCoordinate,
                          id: 'survey-end',
                          title: 'End Point',
                          subtitle: 'Survey Route',
                          category: 'recent',
                        }
                        : undefined
                    }
                    routeCoordinates={
                      !isImageSubmission && effectiveStartCoord && endCoordinate
                        ? [effectiveStartCoord, endCoordinate]
                        : undefined
                    }
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
                    No GPS metadata found in this media
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
            {effectiveStartCoord ? (
              <Text style={[styles.coordinateText, { color: theme.textSecondary }]}>
                {!isImageSubmission && endCoordinate
                  ? `S: ${effectiveStartCoord[1].toFixed(6)}, ${effectiveStartCoord[0].toFixed(6)} → D: ${endCoordinate[1].toFixed(6)}, ${endCoordinate[0].toFixed(6)}`
                  : `${effectiveStartCoord[1].toFixed(6)}, ${effectiveStartCoord[0].toFixed(6)}`}
              </Text>
            ) : null}
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
              onChangeText={(text) => {
                setNote(text);
                setIsModified(true);
                setSubmitError(undefined);
              }}
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
            disabled={isSubmitting || isLocating || isLocatingEnd || !isDraftLoaded || !isEditable}
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

      {/* Chunk Upload Progress Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={Boolean(uploadProgress)}
      >
        <View style={styles.progressModalOverlay}>
          <View style={[styles.progressModalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ActivityIndicator color={theme.primary} size="large" />
            <Text style={[styles.progressModalTitle, { color: theme.text }]}>Uploading Survey Video</Text>
            <Text style={[styles.progressModalStatus, { color: theme.textSecondary }]}>
              {uploadProgress?.statusText}
            </Text>
            <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: theme.primary, width: `${uploadProgress?.percent ?? 0}%` },
                ]}
              />
            </View>
            <View style={styles.progressMetaRow}>
              <Text style={[styles.progressMetaText, { color: theme.textSecondary }]}>
                {uploadProgress?.currentChunk ? `Part ${uploadProgress.currentChunk}/${uploadProgress.totalChunks}` : 'Initializing'}
              </Text>
              <Text style={[styles.progressMetaText, { color: theme.primary, fontWeight: '700' }]}>
                {`${uploadProgress?.percent ?? 0}%`}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
  attachGpxButton: {
    marginTop: Spacing.two,
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
  subSectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.half,
  },
  locationSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    minHeight: 32,
  },
  locationSmallButtonText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.two,
    borderWidth: 1,
    borderRadius: Rounded.md,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flex: 1,
  },
  accordionTitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 600,
  },
  accordionBody: {
    padding: Spacing.two,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: Rounded.md,
    borderBottomRightRadius: Rounded.md,
    gap: Spacing.two,
  },
  accordionDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  gpxActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  progressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 35, 60, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  progressModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Rounded.xlg,
    borderWidth: 1,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  progressModalTitle: {
    fontFamily: Fonts.title,
    fontSize: 18,
    fontWeight: 700,
    marginTop: Spacing.one,
  },
  progressModalStatus: {
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressMetaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.half,
  },
  progressMetaText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
  addressResolvedCard: {
    borderWidth: 1,
    borderRadius: Rounded.md,
    padding: Spacing.two,
    marginTop: Spacing.one,
    gap: 4,
  },
  addressResolvedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressResolvedTitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  addressResolvedText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  addressRoadText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
