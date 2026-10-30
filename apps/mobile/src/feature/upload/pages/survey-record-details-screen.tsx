import AntDesign from '@expo/vector-icons/AntDesign';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  parseFlexibleCapturedDate,
  validateCapturedDate,
  surveyRecordFormSchema,
  type SurveyRecordFormData,
} from '@/feature/upload/schemas/survey-record.schema';

export { parseFlexibleCapturedDate, validateCapturedDate };
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import { formatDate } from '@/utils/format-date';
import {
  ALLOW_LOCATION_ACCESS_MESSAGE,
  CAPTURE_TIME_FUTURE_MESSAGE,
  CAPTURE_TIME_TOO_OLD_MESSAGE,
  DRAFT_NO_UPLOADED_MEDIA_MESSAGE,
  DRAFT_NO_VIDEO_MESSAGE,
  ENABLE_LOCATION_SERVICE_MESSAGE,
  ENTER_MEDIA_DATETIME_MESSAGE,
  formatBatchItemMissingGpsMessage,
  formatBatchMissingGpsMessage,
  formatBatchRemainingMissingGpsMessage,
  formatLoadedCoordinatesFromGpxMessage,
  LIVE_GPS_UNAVAILABLE_MESSAGE,
  LOAD_EDITABLE_DRAFT_BEFORE_SUBMITTING_MESSAGE,
  LOCATION_NATIVE_BUILD_REQUIRED_MESSAGE,
  LOCATION_NOT_AVAILABLE_IN_BROWSER_MESSAGE,
  MISSING_GPS_FOR_SUBMISSION_MESSAGE,
  NO_GPS_PRESS_ZOOM_MESSAGE,
  SELECT_VALID_GPX_FILE_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  SINGLE_ITEM_MISSING_GPS_WARNING,
  UNABLE_TO_GET_LOCATION_FOR_END_POINT_MESSAGE,
  UNABLE_TO_RESTORE_DRAFT_MEDIA_MESSAGE,
  UNABLE_TO_SUBMIT_SURVEY_MESSAGE,
  USE_MEDIA_WITH_GPS_OR_LOCATION_MESSAGE,
  VIDEO_SIZE_EXCEEDED_MESSAGE,
} from '@/constants/message';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import { NavigationMapView } from '@/feature/navigation/components/navigation-map-view';
import {
  type MapCoordinate,
} from '@/types/navigationType';
import {
  useGetSurveySubmissionStatus,
  useUpdateSurveySubmission,
  useSubmitSurveySubmission,
} from '@/feature/upload/hooks/use-survey-submission';
import { useReverseGeocode } from '@/feature/upload/hooks/use-reverse-geocode';
import { readDraftImage, updateDraftCoordinates, useSaveSurveyDraft } from '@/feature/upload/hooks/use-save-survey-draft';
import { readSubmittedStatus } from '@/feature/upload/utils/submission-response';
import type { CoordinateSource, CreateSubmissionDto } from '@/types/surveySubmissionType';
import { useTheme } from '@/hooks/use-theme';
import { LocationPickerModal } from '@/feature/upload/components/location-picker-modal';
import { AppInput } from '@/components/input';
import { extractGpxGpsData } from '@/feature/upload/utils/gpx';
import { estimateEndPoint } from '@/feature/upload/utils/video-gps';
import { executeChunkedVideoUpload, type UploadProgressInfo } from '@/feature/upload/utils/chunk-upload-manager';
import { registerZeroCopyDraft, startSmartPollingSync } from '@/feature/upload/utils/crop-sync-manager';
import {
  MAX_SURVEY_VIDEO_SIZE_BYTES,
  getVideoFileSizeBytes,
} from '@/feature/upload/utils/video-processor';


import { getMapLibre } from '@/services/maplibre';

export function isValidCoordinate(coord?: MapCoordinate | null): coord is MapCoordinate {
  if (!coord) return false;
  const [lon, lat] = coord;
  return (
    typeof lon === 'number' &&
    typeof lat === 'number' &&
    Number.isFinite(lon) &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    !(lat === 0 && lon === 0)
  );
}

async function getCurrentSurveyCoordinate(): Promise<MapCoordinate> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      throw new Error(LOCATION_NOT_AVAILABLE_IN_BROWSER_MESSAGE);
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve([coords.longitude, coords.latitude]),
        (error) => {
          reject(
            new Error(
              error.code === error.PERMISSION_DENIED
                ? ALLOW_LOCATION_ACCESS_MESSAGE
                : ENABLE_LOCATION_SERVICE_MESSAGE,
            ),
          );
        },
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 },
      );
    });
  }

  const mapLibre = getMapLibre();
  if (!mapLibre) {
    throw new Error(LOCATION_NATIVE_BUILD_REQUIRED_MESSAGE);
  }

  const hasPermission = await mapLibre.LocationManager.requestPermissions();

  if (!hasPermission) {
    throw new Error(ALLOW_LOCATION_ACCESS_MESSAGE);
  }

  const position = await mapLibre.LocationManager.getCurrentPosition();

  if (!position) {
    throw new Error(ENABLE_LOCATION_SERVICE_MESSAGE);
  }

  return [position.coords.longitude, position.coords.latitude];
}

// validation functions are imported from survey-record.schema

export function SurveyRecordDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();
  const {
    submissionId,
    batchSubmissionIds,
    gpxUri,
    gpxName,
    startLat,
    startLon,
    duration,
    assetId,
  } = useLocalSearchParams<{
    submissionId?: string;
    batchSubmissionIds?: string;
    gpxUri?: string;
    gpxName?: string;
    startLat?: string;
    startLon?: string;
    duration?: string;
    assetId?: string;
  }>();

  const [activeSubmissionId, setActiveSubmissionId] = useState<string | undefined>(submissionId);

  useEffect(() => {
    if (submissionId && !activeSubmissionId) {
      setActiveSubmissionId(submissionId);
    }
  }, [submissionId, activeSubmissionId]);

  const currentDraftId = activeSubmissionId ?? submissionId;

  const batchIds = useMemo(() => {
    if (batchSubmissionIds) {
      const ids = batchSubmissionIds.split(',').map((s) => s.trim()).filter(Boolean);
      if (ids.length > 0) return ids;
    }
    return submissionId ? [submissionId] : [];
  }, [batchSubmissionIds, submissionId]);

  const currentBatchIndex = useMemo(() => {
    if (!currentDraftId) return 0;
    const idx = batchIds.indexOf(currentDraftId);
    return idx >= 0 ? idx : 0;
  }, [currentDraftId, batchIds]);

  const [batchDrafts, setBatchDrafts] = useState<{ id: string; uri?: string; fileName?: string }[]>([]);
  const [batchCoords, setBatchCoords] = useState<Record<string, MapCoordinate | undefined>>({});

  useEffect(() => {
    if (!session || batchIds.length <= 1) return;
    let active = true;
    Promise.all(
      batchIds.map(async (id) => {
        const local = await readDraftImage(session.account.id, id);
        const hasLocalGps =
          typeof local?.startLon === 'number' &&
          typeof local?.startLat === 'number' &&
          isValidCoordinate([local.startLon, local.startLat]);
        return {
          id,
          uri: local?.uri,
          fileName: local?.fileName,
          coord: hasLocalGps ? ([local.startLon!, local.startLat!] as MapCoordinate) : undefined,
        };
      }),
    ).then((drafts) => {
      if (active) {
        setBatchDrafts(drafts);
        setBatchCoords((prev) => {
          const next = { ...prev };
          drafts.forEach((d) => {
            if (d.coord && !next[d.id]) {
              next[d.id] = d.coord;
            }
          });
          return next;
        });
      }
    });
    return () => {
      active = false;
    };
  }, [batchIds, session]);

  const draftQuery = useGetSurveySubmissionStatus(currentDraftId);
  const saveDraft = useSaveSurveyDraft();
  const [imageUri, setImageUri] = useState<string>();
  const [imageName, setImageName] = useState<string>();
  const [imageMimeType, setImageMimeType] = useState<string>();
  const [savedGpxUri, setSavedGpxUri] = useState<string>();
  const [savedGpxName, setSavedGpxName] = useState<string>();
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const isSubmissionMatchingCurrent = draftQuery.data?.submission?.id === currentDraftId;
  const currentSubmission = isSubmissionMatchingCurrent ? draftQuery.data?.submission : undefined;
  const latitude = currentSubmission?.latitude;
  const longitude = currentSubmission?.longitude;
  const parsedLatitude = latitude != null ? Number(latitude) : Number.NaN;
  const parsedLongitude = longitude != null ? Number(longitude) : Number.NaN;
  const imageCoordinate: MapCoordinate | undefined =
    isValidCoordinate([parsedLongitude, parsedLatitude])
      ? [parsedLongitude, parsedLatitude]
      : undefined;

  const isInitialDraft = currentDraftId === submissionId;
  const parsedStartLat = isInitialDraft && startLat ? Number(startLat) : parsedLatitude;
  const parsedStartLon = isInitialDraft && startLon ? Number(startLon) : parsedLongitude;
  const initialStartCoord: MapCoordinate | undefined =
    isValidCoordinate([parsedStartLon, parsedStartLat])
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
  const [gpxCoordinates, setGpxCoordinates] = useState<MapCoordinate[]>([]);

  const [selectedCoordinate, setSelectedCoordinate] = useState<MapCoordinate | undefined>(
    initialStartCoord,
  );
  const effectiveStartCoord = startCoordinate ?? selectedCoordinate ?? imageCoordinate;

  useEffect(() => {
    if (!currentDraftId) return;
    // CRITICAL: Do NOT sync or save coordinates if the draft hasn't been hydrated for currentDraftId yet!
    // Stale state from the previous batch item must never leak to this draft.
    if (hydratedId.current !== currentDraftId) return;

    if (isValidCoordinate(effectiveStartCoord)) {
      const coordToSave = effectiveStartCoord;
      setBatchCoords((prev) => {
        if (
          prev[currentDraftId]?.[0] === coordToSave[0] &&
          prev[currentDraftId]?.[1] === coordToSave[1]
        ) {
          return prev;
        }
        return { ...prev, [currentDraftId]: coordToSave };
      });
      if (session) {
        void updateDraftCoordinates(session.account.id, currentDraftId, {
          latitude: coordToSave[1],
          longitude: coordToSave[0],
        });
      }
    } else {
      setBatchCoords((prev) => {
        if (prev[currentDraftId] === undefined) return prev;
        const next = { ...prev };
        delete next[currentDraftId];
        return next;
      });
    }
  }, [currentDraftId, effectiveStartCoord, session]);

  const currentItemHasGps = isValidCoordinate(effectiveStartCoord);

  const missingGpsBatchIndices = useMemo(() => {
    const missing: number[] = [];
    batchIds.forEach((id, index) => {
      const coord = id === currentDraftId ? effectiveStartCoord : batchCoords[id];
      if (!isValidCoordinate(coord)) {
        missing.push(index);
      }
    });
    return missing;
  }, [batchIds, currentDraftId, effectiveStartCoord, batchCoords]);

  const allMediaSatisfyConditions = batchIds.length > 0 && missingGpsBatchIndices.length === 0;

  const displayCoordinate = effectiveStartCoord;
  const startLocationQuery = useReverseGeocode(
    effectiveStartCoord ? { latitude: effectiveStartCoord[1], longitude: effectiveStartCoord[0] } : null,
  );
  const [focusRequestId, setFocusRequestId] = useState(1);
  const [coordinateSource, setCoordinateSource] = useState<CoordinateSource | undefined>(
    imageCoordinate ? 'IMAGE_EXIF' : undefined,
  );
  const {
    control,
    handleSubmit: handleFormSubmit,
    setValue,
    watch,
    getValues,
    reset: resetForm,
    formState: { errors: formErrors, isValid: isFormValid, isDirty: isFormDirty },
  } = useForm<SurveyRecordFormData>({
    resolver: zodResolver(surveyRecordFormSchema),
    mode: 'onChange',
    defaultValues: {
      capturedAt: '',
      note: '',
    },
  });

  const capturedAt = watch('capturedAt');
  const note = watch('note');

  const setCapturedAt = (val: string) => {
    setValue('capturedAt', val, { shouldValidate: true, shouldDirty: true });
  };
  const setNote = (val: string) => {
    setValue('note', val, { shouldValidate: true, shouldDirty: true });
  };
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
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | undefined>(
    imageCoordinate ? undefined : NO_GPS_PRESS_ZOOM_MESSAGE,
  );

  const handleLocationConfirm = (coord: MapCoordinate) => {
    setSelectedCoordinate(coord);
    setStartCoordinate(coord);
    setCoordinateSource('MANUAL');
    setIsModified(true);
    setLocationMessage(undefined);
    setSubmitError(undefined);
    setFocusRequestId((prev) => prev + 1);
    setIsLocationPickerOpen(false);
    if (currentDraftId && session) {
      void updateDraftCoordinates(session.account.id, currentDraftId, {
        latitude: coord[1],
        longitude: coord[0],
      });
    }
  };

  const handleSelectBatchIndex = async (newIndex: number) => {
    if (newIndex < 0 || newIndex >= batchIds.length || isSubmitting) return;
    const targetId = batchIds[newIndex];
    if (targetId === currentDraftId) return;

    // Auto-save changes on current draft before switching
    if (currentDraftId && session && (isModified || isFormDirty)) {
      try {
        const effectiveStart = startCoordinate ?? selectedCoordinate;
        const currentVals = getValues();
        const dateValidation = validateCapturedDate(currentVals.capturedAt);
        const formattedCapturedAt = dateValidation.isValid && dateValidation.timestamp
          ? new Date(dateValidation.timestamp).toISOString()
          : undefined;

        await updateSubmission({
          submissionId: currentDraftId,
          request: {
            note: currentVals.note.trim(),
            capturedAt: formattedCapturedAt,
            ...(effectiveStart
              ? {
                latitude: effectiveStart[1],
                longitude: effectiveStart[0],
                coordinateSource: coordinateSource ?? 'IMAGE_EXIF',
              }
              : {}),
          },
        });
        if (effectiveStart) {
          void updateDraftCoordinates(session.account.id, currentDraftId, {
            latitude: effectiveStart[1],
            longitude: effectiveStart[0],
          });
        }
      } catch (err) {
        console.warn('[Surveyor] Auto-saving changes before batch switch failed:', err);
      }
    }

    hydratedId.current = undefined;
    setIsDraftLoaded(false);
    setIsModified(false);
    setSubmitError(undefined);
    setLocationMessage(undefined);

    // Pre-populate with target draft's known coordinates (if any) or clear stale values
    const targetCoord = batchCoords[targetId];
    setStartCoordinate(targetCoord);
    setSelectedCoordinate(targetCoord);
    setEndCoordinate(targetCoord ? estimateEndPoint(targetCoord, durationSec) : undefined);
    setCoordinateSource(targetCoord ? 'IMAGE_EXIF' : undefined);
    resetForm({ capturedAt: '', note: '' });

    setActiveSubmissionId(targetId);
  };

  const remoteGpx = draftQuery.data?.mediaFiles?.find(
    (f: any) => (f.mediaType || f.media_type) === 'GPX',
  );
  const remoteGpxUrl = remoteGpx ? (remoteGpx.fileUrl || remoteGpx.file_url) : undefined;
  const activeGpxUri = gpxUri || savedGpxUri;
  const activeGpxName = gpxName || savedGpxName;
  const displayGpxName = activeGpxName
    || (activeGpxUri ? activeGpxUri.split('/').pop()?.split('?')[0] : undefined)
    || (remoteGpxUrl ? (remoteGpxUrl.split('/').pop()?.split('?')[0] ?? 'Attached GPX track') : '');

  const handleOpenRouteMap = () => {
    router.push({
      pathname: '/work/new-survey/route-map',
      params: {
        gpxUri: activeGpxUri,
        startLat: effectiveStartCoord ? String(effectiveStartCoord[1]) : undefined,
        startLon: effectiveStartCoord ? String(effectiveStartCoord[0]) : undefined,
        endLat: endCoordinate ? String(endCoordinate[1]) : undefined,
        endLon: endCoordinate ? String(endCoordinate[0]) : undefined,
        title: savedGpxName ?? gpxName ?? 'Lộ trình khảo sát',
        duration: String(durationSec),
      },
    });
  };

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

  const captureDateValidation = useMemo(
    () => validateCapturedDate(capturedAt),
    [capturedAt],
  );

  const captureDateError =
    formErrors.capturedAt?.message ??
    (!captureDateValidation.isValid && capturedAt.trim().length > 0
      ? captureDateValidation.error
      : undefined);

  const canSubmit = Boolean(
    isDraftLoaded &&
    isEditable &&
    !isSubmitting &&
    !isLocating &&
    !isLocatingEnd &&
    currentItemHasGps &&
    allMediaSatisfyConditions &&
    captureDateValidation.isValid &&
    isFormValid,
  );

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
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['application/gpx+xml', 'application/octet-stream', '*/*'],
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const name = file.name ?? '';
        if (!name.toLowerCase().endsWith('.gpx')) {
          setSubmitError(SELECT_VALID_GPX_FILE_MESSAGE);
          return;
        }
        setSavedGpxUri(file.uri);
        setSavedGpxName(name);
        setIsModified(true);
        setSubmitError(undefined);

        const gpxData = await extractGpxGpsData(file.uri);
        if (gpxData?.coordinates?.length) {
          setGpxCoordinates(gpxData.coordinates);
        }
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
          setLocationMessage(formatLoadedCoordinatesFromGpxMessage(name));
          setFocusRequestId((r) => r + 1);
          if (gpxData.startTime && !capturedAt) {
            setCapturedAt(formatDate(gpxData.startTime));
          }
        }
      }
    } catch (err) {
      console.warn('[Surveyor] Không thể lấy tọa đồ ở màn hình khảo sát:', err);
    }
  };

  useEffect(() => {
    if (!gpxUri) return;
    let active = true;
    void extractGpxGpsData(gpxUri).then((gpxData) => {
      if (active && gpxData?.coordinates?.length) {
        setGpxCoordinates(gpxData.coordinates);
      }
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
        setLocationMessage(gpxName ? formatLoadedCoordinatesFromGpxMessage(gpxName) : undefined);
        setFocusRequestId((r) => r + 1);
        if (gpxData.startTime) {
          setCapturedAt(formatDate(gpxData.startTime));
        }
      }
    });
    return () => { active = false; };
  }, [durationSec, gpxName, gpxUri]);

  useEffect(() => {
    const draft = draftQuery.data?.submission;
    if (!draft || !session || draft.id !== currentDraftId || hydratedId.current === draft.id) return;
    let active = true;
    void readDraftImage(session.account.id, draft.id).then(async (local) => {
      if (!active) return;
      setIsDraftLoaded(false);
      const formattedCapturedTime = draft.capturedAt
        ? formatDate(draft.capturedAt)
        : formatDate(new Date());
      resetForm({
        capturedAt: formattedCapturedTime,
        note: draft.note ?? '',
      });
      const lat = draft.latitude ?? local?.startLat;
      const lon = draft.longitude ?? local?.startLon;
      const hasCoordinate = lat != null && lon != null && isValidCoordinate([lon, lat]);
      if (hasCoordinate) {
        const coord: MapCoordinate = [lon!, lat!];
        setSelectedCoordinate(coord);
        setStartCoordinate(coord);
        setEndCoordinate(estimateEndPoint(coord, durationSec));
      } else {
        setSelectedCoordinate(undefined);
        setStartCoordinate(undefined);
        setEndCoordinate(undefined);
      }
      setCoordinateSource(hasCoordinate ? (draft.coordinateSource ?? 'IMAGE_EXIF') : undefined);
      setLocationMessage(hasCoordinate ? undefined : NO_GPS_PRESS_ZOOM_MESSAGE);
      const remoteItem = draftQuery.data?.mediaFiles?.find((file: any) => {
        const type = (file.mediaType || file.media_type || '').toUpperCase();
        return type === 'IMAGE' || type === 'VIDEO';
      });
      const remoteKey = remoteItem ? (remoteItem.fileUrl || remoteItem.file_url) : undefined;
      const remoteResolved = remoteKey ? resolveS3Url(remoteKey) : undefined;
      setImageUri(local?.uri ?? remoteResolved);
      setImageName(local?.fileName);
      setImageMimeType(local?.mimeType);
      if (local?.gpxUri) setSavedGpxUri(local.gpxUri);
      if (local?.gpxName) setSavedGpxName(local.gpxName);

      const activeGpx = (draft.id === submissionId ? gpxUri : undefined) || local?.gpxUri;
      if (activeGpx) {
        try {
          const gpxData = await extractGpxGpsData(activeGpx);
          if (active && gpxData?.coordinates?.length) {
            setGpxCoordinates(gpxData.coordinates);
          }
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
              setCapturedAt(formatDate(gpxData.startTime));
            }
          }
        } catch (err) {
          console.warn('[Surveyor] Failed to extract GPX in details:', err);
        }
      }

      hydratedId.current = draft.id;
      setInitialBaseline({
        note: draft.note ?? '',
        capturedAt: formattedCapturedTime,
        longitude: hasCoordinate ? draft.longitude! : undefined,
        latitude: hasCoordinate ? draft.latitude! : undefined,
        gpxUri: local?.gpxUri ?? (draft.id === submissionId ? gpxUri : undefined),
      });
      setIsDraftLoaded(true);
      setIsModified(false);
    }).catch(() => {
      if (active) {
        setIsDraftLoaded(true);
        setSubmitError(UNABLE_TO_RESTORE_DRAFT_MEDIA_MESSAGE);
      }
    });
    return () => { active = false; };
  }, [draftQuery.data, durationSec, gpxUri, session, currentDraftId, submissionId]);

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
          : LIVE_GPS_UNAVAILABLE_MESSAGE,
      );
    } finally {
      setIsLocating(false);
    }
  };
  const onValidSubmit = async (formData: SurveyRecordFormData) => {
    if (submissionInProgress.current || isLocating || isLocatingEnd) return;
    if (!currentDraftId || !isDraftLoaded || !isEditable) {
      setSubmitError(LOAD_EDITABLE_DRAFT_BEFORE_SUBMITTING_MESSAGE);
      return;
    }
    if (!session?.accessToken) {
      setSubmitError(SESSION_EXPIRED_MESSAGE);
      return;
    }
    const dateValidation = validateCapturedDate(formData.capturedAt);
    if (!dateValidation.isValid) {
      setSubmitError(dateValidation.error ?? ENTER_MEDIA_DATETIME_MESSAGE);
      return;
    }
    const captureTimestamp = dateValidation.timestamp!;

    const effectiveStart = startCoordinate ?? selectedCoordinate;
    if (!effectiveStart || !isValidCoordinate(effectiveStart)) {
      setSubmitError(USE_MEDIA_WITH_GPS_OR_LOCATION_MESSAGE);
      return;
    }

    if (!allMediaSatisfyConditions) {
      setSubmitError(
        batchIds.length > 1
          ? formatBatchMissingGpsMessage(batchIds.length)
          : MISSING_GPS_FOR_SUBMISSION_MESSAGE,
      );
      return;
    }

    const isVideoDraft = !isImageSubmission;

    submissionInProgress.current = true;
    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      const formattedCapturedAt = new Date(captureTimestamp).toISOString();

      console.log('[Surveyor] handleSubmit started:', {
        submissionId: currentDraftId,
        isVideoDraft,
        imageUri,
        durationSec,
        startCoordinate: effectiveStart,
        endCoordinate,
        capturedAt: formattedCapturedAt,
      });

      if (isVideoDraft) {
        if (!imageUri) {
          throw new Error(DRAFT_NO_VIDEO_MESSAGE);
        }

        const videoSize = await getVideoFileSizeBytes(imageUri).catch(() => 0);
        if (videoSize > MAX_SURVEY_VIDEO_SIZE_BYTES) {
          throw new Error(VIDEO_SIZE_EXCEEDED_MESSAGE);
        }

        const effectiveEnd = endCoordinate ?? estimateEndPoint(effectiveStart, durationSec);


        console.log('[Surveyor] Starting executeChunkedVideoUpload...');
        // 1. Chunked video upload (1-minute temporal chunks down-res 640p + companion GPX)
        await executeChunkedVideoUpload({
          submissionId: currentDraftId,
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
        await registerZeroCopyDraft(currentDraftId, imageUri, assetId);

        // 3. Start Layer 1 Foreground Smart Polling
        startSmartPollingSync(currentDraftId, imageUri, session.accessToken);

        // 4. Update submission metadata with GPX_FILE and coordinates
        console.log('[Surveyor] Updating submission metadata with GPX_FILE coordinates...');
        await updateSubmission({
          submissionId: currentDraftId,
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
        await updateSubmission({ submissionId: currentDraftId, request: updates });

        const mediaFiles = (draftQuery.data?.mediaFiles ?? []) as any[];
        const sessions = (draftQuery.data?.sessions ?? []) as any[];
        const hasMainMedia = mediaFiles.some((file) => {
          const type = (file.mediaType || file.media_type || '').toUpperCase();
          return type === 'IMAGE';
        })
          || sessions.some((upload) => {
            const type = (upload.mediaType || upload.media_type || '').toUpperCase();
            return type === 'IMAGE' && upload.status === 'COMPLETED';
          });

        if (!hasMainMedia) {
          if (!imageUri) throw new Error(DRAFT_NO_UPLOADED_MEDIA_MESSAGE);
          await saveDraft(
            { uri: imageUri, fileName: imageName, mimeType: imageMimeType, type: 'image' },
            request,
            currentDraftId,
          );
        }

        // If batch has other items, ensure their coordinates are updated on backend
        if (batchIds.length > 1) {
          for (const otherId of batchIds) {
            if (otherId === currentDraftId) continue;
            const otherCoord = batchCoords[otherId];
            if (otherCoord) {
              await updateSubmission({
                submissionId: otherId,
                request: {
                  latitude: otherCoord[1],
                  longitude: otherCoord[0],
                  coordinateSource: 'IMAGE_EXIF',
                },
              });
            }
          }
        }
      }

      // 5. Submit to finalize all drafts in batch
      console.log('[Surveyor] Finalizing submission(s) via submitSubmission...');
      let lastStatus = 'QUEUED';
      for (const id of batchIds) {
        const submitted = await submitSubmission({ submissionId: id });
        lastStatus = readSubmittedStatus(submitted) ?? lastStatus;
      }
      console.log('[Surveyor] Submissions finalized:', { batchCount: batchIds.length, lastStatus });

      router.replace({
        pathname: '/work/submission-complete',
        params: {
          type: 'upload_submission',
          submissionId: currentDraftId,
          batchSubmissionIds: batchIds.join(','),
          submissionStatus: lastStatus,
        },
      });
    } catch (error) {
      console.error('[Surveyor] handleSubmit ERROR:', error);
      setSubmitError(
        error instanceof Error ? error.message : UNABLE_TO_SUBMIT_SURVEY_MESSAGE,
      );
      setIsModified(true);
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
      setUploadProgress(undefined);
    }
  };

  const onInvalidSubmit = (errors: FieldErrors<SurveyRecordFormData>) => {
    if (errors.capturedAt?.message) {
      setSubmitError(errors.capturedAt.message);
    } else if (errors.note?.message) {
      setSubmitError(errors.note.message);
    }
  };

  const handleSubmit = handleFormSubmit(onValidSubmit, onInvalidSubmit);

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
              accessibilityLabel="Quay lại"
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
            <Text style={[styles.title, { color: theme.text }]}>Ghi nhận khảo sát mới</Text>
          </View>

          {draftQuery.isPending ? <Text style={{ color: theme.text }}>Đang tải bản nháp...</Text> : null}
          {draftQuery.isError ? <AppButton label="Thử lại tải bản nháp" onPress={() => { void draftQuery.refetch(); }} /> : null}

          {batchIds.length > 1 ? (
            <View
              style={[
                styles.batchCard,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.batchHeaderRow}>
                <View style={styles.batchTitleWrap}>
                  <MaterialCommunityIcons name="image-multiple" size={18} color={theme.primary} />
                  <Text style={[styles.batchTitle, { color: theme.text }]}>
                    Bộ ảnh ({currentBatchIndex + 1}/{batchIds.length})
                  </Text>
                </View>
                <View style={styles.batchNavButtons}>
                  <Pressable
                    accessibilityLabel="Ảnh trước"
                    disabled={currentBatchIndex <= 0 || isSubmitting}
                    onPress={() => void handleSelectBatchIndex(currentBatchIndex - 1)}
                    style={[
                      styles.batchNavBtn,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                        opacity: currentBatchIndex <= 0 || isSubmitting ? 0.4 : 1,
                      },
                    ]}
                  >
                    <SymbolView
                      fallback={<Text style={{ color: theme.text, fontSize: 14 }}>{'<'}</Text>}
                      name={{ android: 'chevron_left', ios: 'chevron.left', web: 'chevron_left' }}
                      size={16}
                      tintColor={theme.text}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Ảnh kế tiếp"
                    disabled={currentBatchIndex >= batchIds.length - 1 || isSubmitting}
                    onPress={() => void handleSelectBatchIndex(currentBatchIndex + 1)}
                    style={[
                      styles.batchNavBtn,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                        opacity: currentBatchIndex >= batchIds.length - 1 || isSubmitting ? 0.4 : 1,
                      },
                    ]}
                  >
                    <SymbolView
                      fallback={<Text style={{ color: theme.text, fontSize: 14 }}>{'>'}</Text>}
                      name={{ android: 'chevron_right', ios: 'chevron.right', web: 'chevron_right' }}
                      size={16}
                      tintColor={theme.text}
                    />
                  </Pressable>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.batchThumbnailScroll}
              >
                {batchIds.map((id, index) => {
                  const isSelected = index === currentBatchIndex;
                  const itemDraft = batchDrafts.find((d) => d.id === id);
                  const thumbUri = itemDraft?.uri || (isSelected ? imageUri : undefined);
                  const itemCoord = id === currentDraftId ? effectiveStartCoord : batchCoords[id];
                  const hasGps = isValidCoordinate(itemCoord);

                  return (
                    <Pressable
                      key={id}
                      accessibilityLabel={`Chọn ảnh ${index + 1}`}
                      disabled={isSubmitting}
                      onPress={() => void handleSelectBatchIndex(index)}
                      style={[
                        styles.batchThumbWrap,
                        {
                          borderColor: isSelected ? theme.primary : theme.border,
                          borderWidth: isSelected ? 2 : 1,
                          backgroundColor: theme.background,
                        },
                      ]}
                    >
                      {thumbUri ? (
                        <Image
                          contentFit="cover"
                          source={{ uri: thumbUri }}
                          style={styles.batchThumbImage}
                        />
                      ) : (
                        <View style={styles.batchThumbPlaceholder}>
                          <MaterialCommunityIcons
                            name="image"
                            size={18}
                            color={isSelected ? theme.primary : theme.placeholder}
                          />
                        </View>
                      )}
                      {/* GPS status chip on top right of thumbnail */}
                      <View
                        style={[
                          styles.batchThumbGpsStatus,
                          {
                            backgroundColor: hasGps ? '#10B981' : '#F59E0B',
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={hasGps ? 'check' : 'alert'}
                          size={10}
                          color="#FFFFFF"
                        />
                      </View>
                      <View
                        style={[
                          styles.batchThumbBadge,
                          {
                            backgroundColor: isSelected ? theme.primary : 'rgba(0,0,0,0.6)',
                          },
                        ]}
                      >
                        <Text style={styles.batchThumbBadgeText}>{index + 1}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <View
            accessibilityLabel={imageUri ? 'Phương tiện khảo sát đã chọn' : 'Chưa chọn phương tiện khảo sát'}
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
                accessibilityLabel="Ảnh khảo sát đã chọn"
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
                  {imageName ?? (imageMimeType?.startsWith('video/') || (imageUri && /\.(mp4|mov|mkv)$/i.test(imageUri)) ? 'Bản ghi khảo sát Video' : 'Không có bản xem trước')}
                </Text>
              </>
            )}
          </View>

          {isDraftLoaded && !draftQuery.data?.mediaFiles?.some((file: any) => {
            const type = (file.mediaType || file.media_type || '').toUpperCase();
            return type === 'IMAGE' || type === 'VIDEO';
          }) && !imageUri ? (
            <AppButton label="Chọn phương tiện bản nháp" onPress={() => router.replace({ pathname: '/work/new-survey', params: { draftId: currentDraftId } })} />
          ) : null}
          <View style={styles.section}>
            <Controller
              control={control}
              name="capturedAt"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="Thời gian ghi nhận (ngày/tháng/năm)"
                  accessibilityLabel="Thời gian ghi nhận phương tiện theo định dạng ngày/tháng/năm"
                  placeholder="DD/MM/YYYY"
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    setSubmitError(undefined);
                  }}
                  autoCapitalize="none"
                  editable={!isSubmitting}
                  error={captureDateError}
                />
              )}
            />
          </View>

          {/* Location / Telemetry Section */}
          {!isImageSubmission ? (
            <>
              {/* Start Point (S) */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.subSectionTitle, { color: theme.text }]}>
                    Điểm bắt đầu (S)
                  </Text>
                  <AppButton
                    accessibilityLabel="Sử dụng vị trí hiện tại cho điểm bắt đầu"
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
                      {isLocating ? 'Đang định vị...' : 'Lấy vị trí'}
                    </Text>
                  </AppButton>
                </View>
                <AppInput
                  label="Vị trí bắt đầu (vĩ độ, kinh độ)"
                  accessibilityLabel="Vị trí bắt đầu vĩ độ và kinh độ"
                  editable={false}
                  showSoftInputOnFocus={false}
                  value={effectiveStartCoord
                    ? `${effectiveStartCoord[1].toFixed(6)}, ${effectiveStartCoord[0].toFixed(6)}`
                    : 'Chưa có vị trí bắt đầu'}
                  placeholder="Chưa có vị trí bắt đầu"
                  leadingIcon={<MaterialCommunityIcons name="map-marker" size={20} color="#16A34A" />}
                  containerStyle={styles.imageLocationInput}
                />
                {effectiveStartCoord ? (
                  <View style={[styles.addressResolvedCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <View style={styles.addressResolvedHeader}>
                      <MaterialCommunityIcons name="map-marker-radius" size={16} color="#16A34A" />
                      <Text style={[styles.addressResolvedTitle, { color: theme.textSecondary }]}>
                        {startLocationQuery.isLoading ? 'Đang tra cứu vị trí bắt đầu...' : 'Địa chỉ điểm bắt đầu'}
                      </Text>
                      {startLocationQuery.isLoading ? (
                        <ActivityIndicator size="small" color="#16A34A" style={{ marginLeft: 6 }} />
                      ) : null}
                    </View>
                    <Text style={[styles.addressResolvedText, { color: theme.text }]}>
                      {startLocationQuery.data?.displayAddress || (startLocationQuery.isLoading ? 'Đang tra cứu dịch vụ không gian...' : 'Không thể xác định địa chỉ vị trí')}
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
                    Điểm kết thúc (D)
                  </Text>

                </View>
                <AppInput
                  label="Vị trí kết thúc (vĩ độ, kinh độ)"
                  accessibilityLabel="Vị trí kết thúc vĩ độ và kinh độ"
                  editable={false}
                  showSoftInputOnFocus={false}
                  value={endCoordinate
                    ? `${endCoordinate[1].toFixed(6)}, ${endCoordinate[0].toFixed(6)}`
                    : 'Ước tính từ thời lượng video...'}
                  placeholder="Đang ước tính vị trí kết thúc..."
                  leadingIcon={<MaterialCommunityIcons name="flag-checkered" size={20} color="#DC2626" />}
                  containerStyle={styles.imageLocationInput}
                />
                {endCoordinate ? (
                  <View style={[styles.addressResolvedCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <View style={styles.addressResolvedHeader}>
                      <MaterialCommunityIcons name="flag-checkered" size={16} color="#DC2626" />
                      <Text style={[styles.addressResolvedTitle, { color: theme.textSecondary }]}>
                        {endLocationQuery.isLoading ? 'Đang tra cứu vị trí kết thúc...' : 'Địa chỉ điểm kết thúc'}
                      </Text>
                      {endLocationQuery.isLoading ? (
                        <ActivityIndicator size="small" color="#DC2626" style={{ marginLeft: 6 }} />
                      ) : null}
                    </View>
                    <Text style={[styles.addressResolvedText, { color: theme.text }]}>
                      {endLocationQuery.data?.displayAddress || (endLocationQuery.isLoading ? 'Đang tra cứu dịch vụ không gian...' : 'Không thể xác định địa chỉ vị trí')}
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
                      Nâng cao: Đính kèm tệp GPX ngoài
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
                      Hệ thống tự động trích xuất GPS và tạo lộ trình GPX tương ứng. Chỉ đính kèm tệp GPX ngoài nếu bạn muốn sử dụng lộ trình từ thiết bị GPS chuyên dụng.
                    </Text>
                    <AppInput
                      label="Tệp GPX"
                      accessibilityLabel="Tệp lộ trình GPX đính kèm"
                      editable={false}
                      showSoftInputOnFocus={false}
                      value={displayGpxName || 'Tự động trích xuất từ GPS video'}
                      placeholder="Chưa đính kèm tệp GPX"
                      leadingIcon={<AntDesign name="file-text" size={18} color={theme.primary} />}
                      containerStyle={styles.imageLocationInput}
                    />
                    {!isSubmitting ? (
                      <View style={styles.gpxActionsRow}>
                        <AppButton
                          label={displayGpxName ? 'Chọn tệp GPX khác' : 'Chọn tệp GPX (.gpx)'}
                          variant="surface"
                          onPress={handlePickGpx}
                          style={styles.attachGpxButton}
                        />
                        {displayGpxName ? (
                          <AppButton
                            label="Dùng GPS tự động"
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
                label="Tọa độ (vĩ độ, kinh độ)"
                accessibilityLabel="Vĩ độ và kinh độ vị trí"
                editable={false}
                showSoftInputOnFocus={false}
                value={displayCoordinate
                  ? `${displayCoordinate[1].toFixed(6)}, ${displayCoordinate[0].toFixed(6)}`
                  : ''}
                placeholder="Chưa có dữ liệu vị trí"
                leadingIcon={<AntDesign name="environment" size={18} color={theme.primary} />}
                containerStyle={styles.imageLocationInput}
              />
              {effectiveStartCoord ? (
                <AppInput
                  label="Địa chỉ thực tế"
                  editable={false}
                  value={startLocationQuery.data?.displayAddress || ''}
                  leadingIcon={<AntDesign name="environment" size={18} color={theme.primary} />}
                  containerStyle={styles.imageLocationInput}
                />
              ) : null}
            </View>
          )}

          {/* Map Preview */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Bản đồ xem trước</Text>
            <View
              accessibilityLabel={
                effectiveStartCoord
                  ? `Vị trí khảo sát tại ${effectiveStartCoord[1]}, ${effectiveStartCoord[0]}`
                  : 'Chưa chọn vị trí khảo sát'
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
                    locationPin={isImageSubmission ? effectiveStartCoord : undefined}
                    showFocusPin={isImageSubmission}
                    routeStart={!isImageSubmission ? effectiveStartCoord : undefined}
                    isCustomStart={!isImageSubmission}
                    destination={
                      !isImageSubmission && endCoordinate
                        ? {
                          coordinate: endCoordinate,
                          id: 'survey-end',
                          title: 'Điểm kết thúc',
                          subtitle: 'Lộ trình khảo sát',
                          category: 'recent',
                        }
                        : undefined
                    }
                    routeCoordinates={
                      !isImageSubmission && effectiveStartCoord && endCoordinate
                        ? (gpxCoordinates.length > 0 ? gpxCoordinates : [effectiveStartCoord, endCoordinate])
                        : undefined
                    }
                    showCurrentLocation
                    isNavigatingFeature
                  />
                  {!isImageSubmission ? (
                    <AppButton
                      accessibilityLabel="Mở toàn màn hình xem lộ trình"
                      onPress={handleOpenRouteMap}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : null}
                </View>
              ) : (
                <AppButton
                  variant='ghost'
                  onPress={() => {
                    if (!isImageSubmission && (activeGpxUri || effectiveStartCoord)) {
                      handleOpenRouteMap();
                    } else {
                      setIsLocationPickerOpen(true);
                    }
                  }}
                  style={styles.mapEmptyState}
                >
                  <SymbolView
                    fallback={
                      <Text style={[styles.pinFallback, { color: theme.placeholder }]}>PIN</Text>
                    }
                    name={{ android: 'location_off', ios: 'location.slash', web: 'location_off' }}
                    size={28}
                    tintColor={theme.placeholder}
                  />
                  <Text style={[styles.mapEmptyText, { color: theme.placeholder }]}>
                    Chưa có tọa độ GPS. Nhấn nút phóng to để chọn vị trí.
                  </Text>
                </AppButton>
              )}
              <AppButton
                accessibilityLabel="Phóng to bản đồ xem trước"
                onPress={() => {
                  if (!isImageSubmission && (activeGpxUri || effectiveStartCoord)) {
                    handleOpenRouteMap();
                  } else {
                    setIsLocationPickerOpen(true);
                  }
                }}
                style={[
                  styles.mapZoomButton,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
                variant="ghost"
              >
                <AntDesign name="expand" size={20} color={theme.primary} />
              </AppButton>
            </View>
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
            <Controller
              control={control}
              name="note"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label={'Ghi chú'}
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    setSubmitError(undefined);
                  }}
                  maxLength={2000}
                  editable={!isSubmitting}
                  accessibilityLabel="Ghi chú khảo sát"
                  multiline
                  placeholder="Nhập thông tin chi tiết bổ sung..."
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
                  error={formErrors.note?.message}
                />
              )}
            />
          </View>

          {/* Warning banner when media lacks GPS */}
          {!allMediaSatisfyConditions ? (
            <View
              style={[
                styles.gpsWarningCard,
                {
                  backgroundColor: '#FEF3C7',
                  borderColor: '#F59E0B',
                },
              ]}
            >
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#D97706" />
              <Text style={[styles.gpsWarningText, { color: '#92400E' }]}>
                {batchIds.length > 1
                  ? missingGpsBatchIndices.includes(currentBatchIndex)
                    ? formatBatchItemMissingGpsMessage(currentBatchIndex + 1, batchIds.length)
                    : formatBatchRemainingMissingGpsMessage(
                      missingGpsBatchIndices.length,
                      missingGpsBatchIndices.map((i) => i + 1).join(', '),
                    )
                  : SINGLE_ITEM_MISSING_GPS_WARNING}
              </Text>
            </View>
          ) : null}
          <AppButton
            disabled={!canSubmit}
            label={
              isSubmitting
                ? 'Đang gửi...'
                : batchIds.length > 1
                  ? !allMediaSatisfyConditions
                    ? `Chưa đủ toạ độ GPS (${batchIds.length - missingGpsBatchIndices.length}/${batchIds.length})`
                    : `Gửi tất cả hồ sơ (${batchIds.length} ảnh)`
                  : !currentItemHasGps
                    ? 'Chưa có toạ độ GPS'
                    : 'Gửi hồ sơ'
            }
            onPress={handleSubmit}
            style={[styles.submitButton, !canSubmit ? { opacity: 0.55 } : null]}
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
            <Text style={[styles.progressModalTitle, { color: theme.text }]}>Đang tải lên Video khảo sát</Text>
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
                {uploadProgress?.currentChunk ? `Phần ${uploadProgress.currentChunk}/${uploadProgress.totalChunks}` : 'Đang khởi tạo'}
              </Text>
              <Text style={[styles.progressMetaText, { color: theme.primary, fontWeight: '700' }]}>
                {`${uploadProgress?.percent ?? 0}%`}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Location Picker Modal */}
      <LocationPickerModal
        initialCoordinate={effectiveStartCoord}
        onClose={() => setIsLocationPickerOpen(false)}
        onConfirm={handleLocationConfirm}
        visible={isLocationPickerOpen}
      />
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
  secondarySubmitButton: {
    alignSelf: 'stretch',
    marginBottom: Spacing.two,
    borderWidth: 1,
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
  batchCard: {
    borderWidth: 1,
    borderRadius: Rounded.lg,
    padding: Spacing.two,
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  batchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batchTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batchTitle: {
    fontFamily: Fonts.title,
    fontSize: 14,
    fontWeight: '700',
  },
  batchNavButtons: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  batchNavBtn: {
    width: 32,
    height: 32,
    borderRadius: Rounded.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchThumbnailScroll: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: 2,
  },
  batchThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: Rounded.md,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchThumbImage: {
    width: '100%',
    height: '100%',
  },
  batchThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchThumbBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  batchThumbBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  batchThumbGpsStatus: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  gpsWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Rounded.md,
    padding: Spacing.two,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  gpsWarningText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  captureTimeErrorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
    fontWeight: '500',
  },
});
