import AntDesign from '@expo/vector-icons/AntDesign';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  parseFlexibleCapturedDate,
  validateCapturedDate,
  surveyRecordFormSchema,
  type SurveyRecordFormData,
} from '@/feature/upload/schemas/survey-record.schema';

export { parseFlexibleCapturedDate, validateCapturedDate };
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import { formatDate } from '@/utils/format-date';
import {
  ALLOW_LOCATION_ACCESS_MESSAGE,
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
  UNABLE_TO_RESTORE_DRAFT_MEDIA_MESSAGE,
  UNABLE_TO_SUBMIT_SURVEY_MESSAGE,
  USE_MEDIA_WITH_GPS_OR_LOCATION_MESSAGE,
  VIDEO_SIZE_EXCEEDED_MESSAGE,
} from '@/constants/message';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import { NavigationMapView } from '@/feature/navigation/components/navigation-map-view';
import { type MapCoordinate } from '@/types/navigationType';
import {
  useCreateSurveySubmission,
  useInitializeSurveyUpload,
  useUploadSurveyChunk,
  useCompleteSurveyUpload,
  useGetSurveySubmissionStatus,
  useUpdateSurveySubmission,
  useSubmitSurveySubmission,
} from '@/feature/upload/hooks/use-survey-submission';
import { useReverseGeocode } from '@/feature/upload/hooks/use-reverse-geocode';
import {
  readDraftImage,
  updateDraftCoordinates,
} from '@/feature/upload/hooks/use-save-survey-draft';
import { prepareSurveyImage } from '@/feature/upload/utils/survey-image';
import { readSubmissionId, readSubmittedStatus } from '@/feature/upload/utils/submission-response';
import type { CoordinateSource, CreateSubmissionDto } from '@/types/surveySubmissionType';
import { useTheme } from '@/hooks/use-theme';
import { LocationPickerModal } from '@/feature/upload/components/location-picker-modal';
import { AppInput } from '@/components/input';
import { extractGpxGpsData } from '@/feature/upload/utils/gpx';
import { estimateEndPoint } from '@/feature/upload/utils/video-gps';
import {
  executeChunkedVideoUpload,
  type UploadProgressInfo,
} from '@/feature/upload/utils/chunk-upload-manager';
import {
  registerZeroCopyDraft,
  startSmartPollingSync,
} from '@/feature/upload/utils/crop-sync-manager';
import {
  MAX_SURVEY_VIDEO_SIZE_BYTES,
  getVideoFileSizeBytes,
} from '@/feature/upload/utils/video-processor';

import { getMapLibre } from '@/services/maplibre';
import { styles } from '@/feature/upload/styles/survey-record-details-screen.styles';
import {
  formatNoteWithDirection,
  getCardinalDirectionLabel,
  getCurrentSurveyCoordinate,
  isValidCoordinate,
  parseDateToDateObject,
  parseInitialCapturedDate,
} from '@/feature/upload/utils/survey-record-details.utils';

export { formatNoteWithDirection, getCardinalDirectionLabel, isValidCoordinate };

export function SurveyRecordDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const {
    submissionId,
    batchSubmissionIds,
    assetsJson,
    imageUri: paramImageUri,
    imageName: paramImageName,
    imageMimeType: paramImageMimeType,
    imageType: paramImageType,
    latitude: paramLatitude,
    longitude: paramLongitude,
    gpxUri,
    gpxName,
    startLat,
    startLon,
    duration,
    assetId,
    capturedAt: paramCapturedAt,
    heading: paramHeading,
  } = useLocalSearchParams<{
    submissionId?: string;
    batchSubmissionIds?: string;
    assetsJson?: string;
    imageUri?: string;
    imageName?: string;
    imageMimeType?: string;
    imageType?: string;
    latitude?: string;
    longitude?: string;
    gpxUri?: string;
    gpxName?: string;
    startLat?: string;
    startLon?: string;
    duration?: string;
    assetId?: string;
    capturedAt?: string;
    heading?: string;
  }>();

  type LocalBatchAsset = {
    uri: string;
    fileName?: string;
    mimeType?: string;
    type?: string;
    capturedAt?: string;
    gps?: { latitude: number; longitude: number; heading?: number } | null;
    duration?: number;
    assetId?: string;
  };

  const parsedAssets = useMemo<LocalBatchAsset[]>(() => {
    if (assetsJson) {
      try {
        const parsed = JSON.parse(assetsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (paramImageUri) {
      const lat = paramLatitude ? Number(paramLatitude) : startLat ? Number(startLat) : undefined;
      const lon = paramLongitude ? Number(paramLongitude) : startLon ? Number(startLon) : undefined;
      const heading = paramHeading ? Number(paramHeading) : undefined;
      return [
        {
          uri: paramImageUri,
          fileName: paramImageName,
          mimeType: paramImageMimeType,
          type: paramImageType,
          capturedAt: paramCapturedAt,
          gps:
            lat != null && lon != null
              ? { latitude: lat, longitude: lon, heading }
              : null,
          duration: duration ? Number(duration) : undefined,
          assetId,
        },
      ];
    }
    return [];
  }, [
    assetsJson,
    paramImageUri,
    paramImageName,
    paramImageMimeType,
    paramImageType,
    paramLatitude,
    paramLongitude,
    startLat,
    startLon,
    paramCapturedAt,
    paramHeading,
    duration,
    assetId,
  ]);

  const [activeSubmissionId, setActiveSubmissionId] = useState<string | undefined>(submissionId);

  useEffect(() => {
    if (submissionId && !activeSubmissionId) {
      setActiveSubmissionId(submissionId);
    }
  }, [submissionId, activeSubmissionId]);

  const currentDraftId = activeSubmissionId ?? submissionId;

  const batchIds = useMemo(() => {
    if (batchSubmissionIds) {
      const ids = batchSubmissionIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) return ids;
    }
    if (submissionId) return [submissionId];
    if (parsedAssets.length > 0) {
      return parsedAssets.map((_, i) => `local-${i}`);
    }
    return [];
  }, [batchSubmissionIds, submissionId, parsedAssets]);

  const [activeBatchIndex, setActiveBatchIndex] = useState(0);

  const currentBatchIndex = useMemo(() => {
    if (currentDraftId && batchIds.length > 0) {
      const idx = batchIds.indexOf(currentDraftId);
      if (idx >= 0) return idx;
    }
    return activeBatchIndex >= 0 && activeBatchIndex < batchIds.length ? activeBatchIndex : 0;
  }, [currentDraftId, batchIds, activeBatchIndex]);

  const [batchDrafts, setBatchDrafts] = useState<{ id: string; uri?: string; fileName?: string }[]>(
    () => {
      if (parsedAssets.length > 0) {
        return parsedAssets.map((asset, idx) => ({
          id: batchIds[idx] ?? `local-${idx}`,
          uri: asset.uri,
          fileName: asset.fileName,
        }));
      }
      return [];
    },
  );

  const parsedStartLatInit = startLat
    ? Number(startLat)
    : paramLatitude
      ? Number(paramLatitude)
      : Number.NaN;
  const parsedStartLonInit = startLon
    ? Number(startLon)
    : paramLongitude
      ? Number(paramLongitude)
      : Number.NaN;
  const initialCoordFallback: MapCoordinate | undefined = isValidCoordinate([
    parsedStartLonInit,
    parsedStartLatInit,
  ])
    ? [parsedStartLonInit, parsedStartLatInit]
    : undefined;

  const [batchCoords, setBatchCoords] = useState<Record<string, MapCoordinate | undefined>>(() => {
    const initial: Record<string, MapCoordinate | undefined> = {};
    if (parsedAssets.length > 0) {
      parsedAssets.forEach((asset, idx) => {
        const id = batchIds[idx] ?? `local-${idx}`;
        if (asset.gps && isValidCoordinate([asset.gps.longitude, asset.gps.latitude])) {
          initial[id] = [asset.gps.longitude, asset.gps.latitude];
        } else if (idx === 0 && initialCoordFallback) {
          initial[id] = initialCoordFallback;
        }
      });
    } else if (submissionId && initialCoordFallback) {
      initial[submissionId] = initialCoordFallback;
    }
    return initial;
  });

  const [batchNotes, setBatchNotes] = useState<Record<string, string>>({});
  const [batchCapturedAts, setBatchCapturedAts] = useState<Record<string, string>>({});

  // Sign direction (traffic direction) state in degrees [0..359] or undefined if not set.
  // Default is the heading extracted from photo GPS/EXIF if available; otherwise left undefined (chưa chọn / để trống).
  const initialDefaultHeading = useMemo<number | undefined>(() => {
    const assetHeading = parsedAssets[0]?.gps?.heading;
    if (assetHeading != null && Number.isFinite(assetHeading)) {
      return Math.round(((assetHeading % 360) + 360) % 360);
    }
    if (paramHeading != null && !isNaN(Number(paramHeading)) && paramHeading.trim() !== '') {
      return Math.round(((Number(paramHeading) % 360) + 360) % 360);
    }
    return undefined;
  }, [parsedAssets, paramHeading]);

  const [batchDirections, setBatchDirections] = useState<Record<string, number | undefined>>(() => {
    const initial: Record<string, number | undefined> = {};
    parsedAssets.forEach((asset, idx) => {
      const id = batchIds[idx] ?? `local-${idx}`;
      const h = asset.gps?.heading;
      initial[id] = h != null && Number.isFinite(h) ? Math.round(((h % 360) + 360) % 360) : undefined;
    });
    return initial;
  });

  const [singleSignDirection, setSingleSignDirection] = useState<number | undefined>(initialDefaultHeading);

  // Synchronize directions whenever parsedAssets or paramHeading arrives with heading data
  useEffect(() => {
    if (parsedAssets.length > 0) {
      setBatchDirections((prev) => {
        let changed = false;
        const next = { ...prev };
        parsedAssets.forEach((asset, idx) => {
          const id = batchIds[idx] ?? `local-${idx}`;
          const h = asset.gps?.heading;
          if (h != null && Number.isFinite(h) && next[id] === undefined) {
            next[id] = Math.round(((h % 360) + 360) % 360);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
    if (initialDefaultHeading !== undefined) {
      setSingleSignDirection((prev) => (prev === undefined ? initialDefaultHeading : prev));
    }
  }, [parsedAssets, batchIds, initialDefaultHeading]);

  const activeSignDirection = useMemo<number | undefined>(() => {
    const currentId = batchIds[currentBatchIndex];
    if (currentId && batchDirections[currentId] !== undefined) {
      return batchDirections[currentId];
    }
    const assetHeading = parsedAssets[currentBatchIndex]?.gps?.heading;
    if (assetHeading != null && Number.isFinite(assetHeading)) {
      return Math.round(((assetHeading % 360) + 360) % 360);
    }
    return singleSignDirection;
  }, [batchIds, currentBatchIndex, batchDirections, parsedAssets, singleSignDirection]);

  const setSignDirection = useCallback(
    (degrees: number | undefined) => {
      const normalized =
        degrees !== undefined
          ? Math.round(((degrees % 360) + 360) % 360)
          : undefined;
      const currentId = batchIds[currentBatchIndex];
      if (currentId) {
        setBatchDirections((prev) => ({ ...prev, [currentId]: normalized }));
      }
      setSingleSignDirection(normalized);
    },
    [batchIds, currentBatchIndex],
  );

  useEffect(() => {
    if (!session || batchIds.length <= 1 || !submissionId) return;
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
  }, [batchIds, session, submissionId]);

  const draftQuery = useGetSurveySubmissionStatus(currentDraftId, Boolean(currentDraftId));
  const { mutateAsync: createSubmission } = useCreateSurveySubmission();
  const { mutateAsync: initializeUpload } = useInitializeSurveyUpload();
  const { mutateAsync: uploadChunk } = useUploadSurveyChunk();
  const { mutateAsync: completeUpload } = useCompleteSurveyUpload();

  const [imageUri, setImageUri] = useState<string | undefined>(paramImageUri);
  const [imageName, setImageName] = useState<string | undefined>(paramImageName);
  const [imageMimeType, setImageMimeType] = useState<string | undefined>(paramImageMimeType);

  const activeImageUri =
    imageUri ||
    paramImageUri ||
    (parsedAssets.length > 0 ? parsedAssets[currentBatchIndex]?.uri : undefined);
  const activeImageMimeType =
    imageMimeType ||
    paramImageMimeType ||
    (parsedAssets.length > 0 ? parsedAssets[currentBatchIndex]?.mimeType : undefined);
  const activeImageName =
    imageName ||
    paramImageName ||
    (parsedAssets.length > 0 ? parsedAssets[currentBatchIndex]?.fileName : undefined);
  const [savedGpxUri, setSavedGpxUri] = useState<string>();
  const [savedGpxName, setSavedGpxName] = useState<string>();
  const [isDraftLoaded, setIsDraftLoaded] = useState(
    Boolean(paramImageUri || submissionId || parsedAssets.length > 0),
  );
  const isSubmissionMatchingCurrent = draftQuery.data?.submission?.id === currentDraftId;
  const currentSubmission = isSubmissionMatchingCurrent ? draftQuery.data?.submission : undefined;
  const latitude = currentSubmission?.latitude;
  const longitude = currentSubmission?.longitude;
  const parsedLatitude = latitude != null ? Number(latitude) : Number.NaN;
  const parsedLongitude = longitude != null ? Number(longitude) : Number.NaN;
  const imageCoordinate: MapCoordinate | undefined = isValidCoordinate([
    parsedLongitude,
    parsedLatitude,
  ])
    ? [parsedLongitude, parsedLatitude]
    : undefined;
  console.log('[Surveyor] imageCoordinate:', imageCoordinate);

  const isInitialDraft = currentDraftId === submissionId;
  const parsedStartLat = startLat
    ? Number(startLat)
    : paramLatitude
      ? Number(paramLatitude)
      : parsedLatitude;
  const parsedStartLon = startLon
    ? Number(startLon)
    : paramLongitude
      ? Number(paramLongitude)
      : parsedLongitude;
  const initialStartCoord: MapCoordinate | undefined = isValidCoordinate([
    parsedStartLon,
    parsedStartLat,
  ])
    ? [parsedStartLon, parsedStartLat]
    : imageCoordinate;

  const durationSec = duration ? Math.max(1, Number(duration)) : 60;
  const [startCoordinate, setStartCoordinate] = useState<MapCoordinate | undefined>(
    initialStartCoord,
  );
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
    if (batchIds.length === 0) return;
    const currentId = batchIds[currentBatchIndex];
    if (!currentId) return;

    if (isValidCoordinate(effectiveStartCoord)) {
      const coordToSave = effectiveStartCoord;
      setBatchCoords((prev) => {
        if (prev[currentId]?.[0] === coordToSave[0] && prev[currentId]?.[1] === coordToSave[1]) {
          return prev;
        }
        return { ...prev, [currentId]: coordToSave };
      });
      if (session && currentDraftId && !currentDraftId.startsWith('local-')) {
        void updateDraftCoordinates(session.account.id, currentDraftId, {
          latitude: coordToSave[1],
          longitude: coordToSave[0],
        });
      }
    } else {
      setBatchCoords((prev) => {
        if (prev[currentId] === undefined) return prev;
        const next = { ...prev };
        delete next[currentId];
        return next;
      });
    }
  }, [batchIds, currentBatchIndex, effectiveStartCoord, session, currentDraftId]);

  const currentItemHasGps = isValidCoordinate(effectiveStartCoord);

  const missingGpsBatchIndices = useMemo(() => {
    const missing: number[] = [];
    batchIds.forEach((id, index) => {
      const coord = index === currentBatchIndex ? effectiveStartCoord : batchCoords[id];
      if (!isValidCoordinate(coord)) {
        missing.push(index);
      }
    });
    return missing;
  }, [batchIds, currentBatchIndex, effectiveStartCoord, batchCoords]);

  const allMediaSatisfyConditions =
    batchIds.length <= 1 ? Boolean(currentItemHasGps) : missingGpsBatchIndices.length === 0;

  const displayCoordinate = effectiveStartCoord;
  const startLocationQuery = useReverseGeocode(
    effectiveStartCoord
      ? { latitude: effectiveStartCoord[1], longitude: effectiveStartCoord[0] }
      : null,
  );
  const [focusRequestId, setFocusRequestId] = useState(1);
  const [coordinateSource, setCoordinateSource] = useState<CoordinateSource | undefined>(
    imageCoordinate ? 'IMAGE_EXIF' : undefined,
  );
  const initialCapturedDate = parseInitialCapturedDate(paramCapturedAt);
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
      capturedAt: initialCapturedDate,
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
  const hasInitialGps = Boolean(initialStartCoord || imageCoordinate);
  const [locationMessage, setLocationMessage] = useState<string | undefined>(
    hasInitialGps ? undefined : NO_GPS_PRESS_ZOOM_MESSAGE,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDatePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setCapturedAt(formatDate(selectedDate));
      setSubmitError(undefined);
    }
  };

  const handleLocationConfirm = (coord: MapCoordinate) => {
    setSelectedCoordinate(coord);
    setStartCoordinate(coord);
    setCoordinateSource('MANUAL');
    setIsModified(true);
    setLocationMessage(undefined);
    setSubmitError(undefined);
    setFocusRequestId((prev) => prev + 1);
    setIsLocationPickerOpen(false);
    if (batchIds.length > 0) {
      const currentId = batchIds[currentBatchIndex];
      if (currentId) {
        setBatchCoords((prev) => ({ ...prev, [currentId]: coord }));
      }
    }
    if (currentDraftId && !currentDraftId.startsWith('local-') && session) {
      void updateDraftCoordinates(session.account.id, currentDraftId, {
        latitude: coord[1],
        longitude: coord[0],
      });
    }
  };

  const handleSelectBatchIndex = async (newIndex: number) => {
    if (newIndex < 0 || newIndex >= batchIds.length || isSubmitting) return;
    const targetId = batchIds[newIndex];
    const currentId = batchIds[currentBatchIndex];
    if (targetId === currentId) return;

    // Save current values for this item
    const currentVals = getValues();
    if (currentId) {
      setBatchNotes((prev) => ({ ...prev, [currentId]: currentVals.note }));
      setBatchCapturedAts((prev) => ({ ...prev, [currentId]: currentVals.capturedAt }));
    }

    // Auto-save changes on current draft before switching if this is an existing server draft
    if (
      currentDraftId &&
      !currentDraftId.startsWith('local-') &&
      session &&
      (isModified || isFormDirty)
    ) {
      try {
        const effectiveStart = startCoordinate ?? selectedCoordinate;
        const dateValidation = validateCapturedDate(currentVals.capturedAt);
        const formattedCapturedAt =
          dateValidation.isValid && dateValidation.timestamp
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

    setActiveBatchIndex(newIndex);
    setIsModified(false);
    setSubmitError(undefined);
    setLocationMessage(undefined);

    if (parsedAssets.length > newIndex) {
      const targetAsset = parsedAssets[newIndex];
      setImageUri(targetAsset.uri);
      setImageName(targetAsset.fileName);
      setImageMimeType(targetAsset.mimeType);

      const targetCoord =
        batchCoords[targetId] ??
        (targetAsset.gps && isValidCoordinate([targetAsset.gps.longitude, targetAsset.gps.latitude])
          ? [targetAsset.gps.longitude, targetAsset.gps.latitude]
          : undefined);
      setStartCoordinate(targetCoord);
      setSelectedCoordinate(targetCoord);
      setEndCoordinate(targetCoord ? estimateEndPoint(targetCoord, durationSec) : undefined);
      setCoordinateSource(targetCoord ? 'IMAGE_EXIF' : undefined);

      const targetDate =
        batchCapturedAts[targetId] ?? parseInitialCapturedDate(targetAsset.capturedAt);
      const targetNote = batchNotes[targetId] ?? '';
      resetForm({ capturedAt: targetDate, note: targetNote });
    } else {
      hydratedId.current = undefined;
      setIsDraftLoaded(false);
      const targetCoord = batchCoords[targetId];
      setStartCoordinate(targetCoord);
      setSelectedCoordinate(targetCoord);
      setEndCoordinate(targetCoord ? estimateEndPoint(targetCoord, durationSec) : undefined);
      setCoordinateSource(targetCoord ? 'IMAGE_EXIF' : undefined);
      resetForm({ capturedAt: '', note: '' });
      setActiveSubmissionId(targetId);
    }
  };

  const remoteGpx = draftQuery.data?.mediaFiles?.find(
    (f: any) => (f.mediaType || f.media_type) === 'GPX',
  );
  const remoteGpxUrl = remoteGpx ? remoteGpx.fileUrl || remoteGpx.file_url : undefined;
  const activeGpxUri = gpxUri || savedGpxUri;
  const activeGpxName = gpxName || savedGpxName;
  const displayGpxName =
    activeGpxName ||
    (activeGpxUri ? activeGpxUri.split('/').pop()?.split('?')[0] : undefined) ||
    (remoteGpxUrl ? (remoteGpxUrl.split('/').pop()?.split('?')[0] ?? 'Attached GPX track') : '');

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

  const isDirty =
    isModified ||
    (Boolean(initialBaseline) &&
      (note !== initialBaseline!.note ||
        capturedAt !== initialBaseline!.capturedAt ||
        selectedCoordinate?.[0] !== initialBaseline!.longitude ||
        selectedCoordinate?.[1] !== initialBaseline!.latitude ||
        activeGpxUri !== initialBaseline!.gpxUri));
  const submissionStatus = draftQuery.data?.submission?.status;
  const isEditable =
    !currentDraftId ||
    isDirty ||
    !submissionStatus ||
    submissionStatus === 'DRAFT' ||
    submissionStatus === 'PENDING_CORRECTION' ||
    submissionStatus === 'FAILED';

  const captureDateValidation = useMemo(() => validateCapturedDate(capturedAt), [capturedAt]);

  const captureDateError =
    formErrors.capturedAt?.message ??
    (!captureDateValidation.isValid && capturedAt.trim().length > 0
      ? captureDateValidation.error
      : undefined);

  const canSubmit = Boolean(
    (isDraftLoaded || Boolean(imageUri)) &&
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
    draftQuery.data?.submission.submissionType === 'SINGLE_IMAGE' ||
    (draftQuery.data?.submission.submissionType !== 'VIDEO_GPX' &&
      !imageMimeType?.startsWith('video/') &&
      !(imageUri && /\.(mp4|mov|mkv)$/i.test(imageUri)) &&
      !activeGpxUri &&
      !duration);

  const endLocationQuery = useReverseGeocode(
    !isImageSubmission && endCoordinate
      ? { latitude: endCoordinate[1], longitude: endCoordinate[0] }
      : null,
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
          setCoordinateSource('FILE_GPX');
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
        setCoordinateSource('FILE_GPX');
        setLocationMessage(gpxName ? formatLoadedCoordinatesFromGpxMessage(gpxName) : undefined);
        setFocusRequestId((r) => r + 1);
        if (gpxData.startTime) {
          setCapturedAt(formatDate(gpxData.startTime));
        }
      }
    });
    return () => {
      active = false;
    };
  }, [durationSec, gpxName, gpxUri]);

  useEffect(() => {
    if (submissionInProgress.current || isSubmitting) return;
    const draft = draftQuery.data?.submission;
    if (!draft || !session || draft.id !== currentDraftId || hydratedId.current === draft.id)
      return;
    let active = true;
    void readDraftImage(session.account.id, draft.id)
      .then(async (local) => {
        if (!active || submissionInProgress.current || isSubmitting) return;
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
        setCoordinateSource(
          hasCoordinate
            ? ((draft.coordinateSource as CoordinateSource) ?? 'IMAGE_EXIF')
            : undefined,
        );
        setLocationMessage(hasCoordinate ? undefined : NO_GPS_PRESS_ZOOM_MESSAGE);
        const remoteItem = draftQuery.data?.mediaFiles?.find((file: any) => {
          const type = (file.mediaType || file.media_type || '').toUpperCase();
          return type === 'IMAGE' || type === 'VIDEO';
        });
        const remoteKey = remoteItem ? remoteItem.fileUrl || remoteItem.file_url : undefined;
        const remoteResolved = remoteKey ? resolveS3Url(remoteKey) : undefined;
        const resolvedUri = local?.uri ?? remoteResolved;
        if (resolvedUri) {
          setImageUri(resolvedUri);
        }
        if (local?.fileName) setImageName(local.fileName);
        if (local?.mimeType) setImageMimeType(local.mimeType);
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
              const coord: MapCoordinate = [
                gpxData.firstPoint.longitude,
                gpxData.firstPoint.latitude,
              ];
              setSelectedCoordinate(coord);
              setStartCoordinate(coord);
              if (gpxData.lastPoint) {
                setEndCoordinate([gpxData.lastPoint.longitude, gpxData.lastPoint.latitude]);
              } else {
                setEndCoordinate(estimateEndPoint(coord, durationSec));
              }
              setCoordinateSource('FILE_GPX');
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
      })
      .catch(() => {
        if (active) {
          setIsDraftLoaded(true);
          setSubmitError(UNABLE_TO_RESTORE_DRAFT_MEDIA_MESSAGE);
        }
      });
    return () => {
      active = false;
    };
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
      setCoordinateSource(!isImageSubmission ? 'FILE_GPX' : 'DEVICE_GPS');
      setIsModified(true);
      setSubmitError(undefined);
      setFocusRequestId((requestId) => requestId + 1);
      if (batchIds.length > 0) {
        const currentId = batchIds[currentBatchIndex];
        if (currentId) {
          setBatchCoords((prev) => ({ ...prev, [currentId]: coordinate }));
        }
      }
    } catch (error) {
      setLocationMessage(error instanceof Error ? error.message : LIVE_GPS_UNAVAILABLE_MESSAGE);
    } finally {
      setIsLocating(false);
    }
  };
  const onValidSubmit = async (formData: SurveyRecordFormData) => {
    if (submissionInProgress.current || isLocating || isLocatingEnd) return;
    if ((!imageUri && !currentDraftId) || !isDraftLoaded || !isEditable) {
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

        let targetSubmissionId =
          currentDraftId && !currentDraftId.startsWith('local-') ? currentDraftId : undefined;
        if (!targetSubmissionId) {
          const createPayload: CreateSubmissionDto = {
            submissionType: 'VIDEO_GPX',
            capturedAt: formattedCapturedAt,
            coordinateSource: 'FILE_GPX',
            latitude: effectiveStart[1],
            longitude: effectiveStart[0],
            note: formatNoteWithDirection(note, activeSignDirection),
          };
          const createRes = await createSubmission({ request: createPayload });
          targetSubmissionId = readSubmissionId(createRes);
          setActiveSubmissionId(targetSubmissionId);
        }

        // 1. Chunked video upload (1-minute temporal chunks down-res 640p + companion GPX)
        await executeChunkedVideoUpload({
          submissionId: targetSubmissionId,
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

        // 2. Register zero-copy draft for high-res 4K RoI cropping
        await registerZeroCopyDraft(targetSubmissionId, imageUri, assetId);

        // 3. Start Layer 1 Foreground Smart Polling
        startSmartPollingSync(targetSubmissionId, imageUri, session.accessToken);

        // 4. Update submission metadata with GPX_FILE and coordinates
        console.log('[Surveyor] Updating submission metadata with GPX_FILE coordinates...');
        await updateSubmission({
          submissionId: targetSubmissionId,
          request: {
            capturedAt: formattedCapturedAt,
            coordinateSource: 'FILE_GPX',
            latitude: effectiveStart[1],
            longitude: effectiveStart[0],
            note: formatNoteWithDirection(note, activeSignDirection),
          },
        });
        console.log('[Surveyor] Submission metadata updated successfully.');

        // 5. Submit to finalize
        const submitted = await submitSubmission({ submissionId: targetSubmissionId });
        const lastStatus = readSubmittedStatus(submitted) ?? 'QUEUED';

        router.replace({
          pathname: '/work/submission-complete',
          params: {
            type: 'upload_submission',
            submissionId: targetSubmissionId,
            submissionStatus: lastStatus,
          },
        });
      } else {
        // Single Image or Batch Images Upload Flow
        if (parsedAssets.length > 1) {
          const createdSubmissionIds: string[] = [];
          let lastStatus = 'QUEUED';

          for (let i = 0; i < parsedAssets.length; i++) {
            const asset = parsedAssets[i];
            const coord =
              i === currentBatchIndex
                ? effectiveStart
                : (batchCoords[batchIds[i]] ??
                  (asset.gps ? [asset.gps.longitude, asset.gps.latitude] : effectiveStart));
            const itemNote =
              i === currentBatchIndex ? note.trim() : (batchNotes[batchIds[i]] ?? '');
            const itemDirection = batchDirections[batchIds[i]] ?? activeSignDirection;
            const itemCapturedAt = asset.capturedAt
              ? new Date(asset.capturedAt).toISOString()
              : formattedCapturedAt;

            const createPayload: CreateSubmissionDto = {
              submissionType: 'SINGLE_IMAGE',
              capturedAt: itemCapturedAt,
              coordinateSource: coordinateSource ?? 'IMAGE_EXIF',
              latitude: coord[1],
              longitude: coord[0],
              note: formatNoteWithDirection(itemNote, itemDirection),
            };
            const createRes = await createSubmission({ request: createPayload });
            const subId = readSubmissionId(createRes);
            createdSubmissionIds.push(subId);

            const prepared = await prepareSurveyImage({
              uri: asset.uri,
              fileName: asset.fileName,
              mimeType: asset.mimeType,
            });
            const initRes = await initializeUpload({
              submissionId: subId,
              request: {
                mediaType: 'IMAGE',
                originalFilename: prepared.fileName,
                totalChunks: 1,
                totalSizeBytes: prepared.sizeBytes,
              },
            });
            await uploadChunk({
              sessionId: initRes.sessionId,
              request: prepared.chunk,
            });
            await completeUpload({ sessionId: initRes.sessionId });

            const submitted = await submitSubmission({ submissionId: subId });
            lastStatus = readSubmittedStatus(submitted) ?? lastStatus;
          }

          router.replace({
            pathname: '/work/submission-complete',
            params: {
              type: 'upload_submission',
              submissionId: createdSubmissionIds[0],
              batchSubmissionIds: createdSubmissionIds.join(','),
              submissionStatus: lastStatus,
            },
          });
        } else {
          // Single Image
          let targetSubmissionId =
            currentDraftId && !currentDraftId.startsWith('local-') ? currentDraftId : undefined;

          if (!targetSubmissionId) {
            const createPayload: CreateSubmissionDto = {
              submissionType: 'SINGLE_IMAGE',
              capturedAt: formattedCapturedAt,
              coordinateSource: coordinateSource ?? 'IMAGE_EXIF',
              latitude: effectiveStart[1],
              longitude: effectiveStart[0],
              note: formatNoteWithDirection(note, activeSignDirection),
            };
            const createRes = await createSubmission({ request: createPayload });
            targetSubmissionId = readSubmissionId(createRes);
            setActiveSubmissionId(targetSubmissionId);
          } else {
            const request: CreateSubmissionDto = {
              submissionType: 'SINGLE_IMAGE',
              capturedAt: formattedCapturedAt,
              coordinateSource: coordinateSource ?? 'IMAGE_EXIF',
              latitude: effectiveStart[1],
              longitude: effectiveStart[0],
              note: formatNoteWithDirection(note, activeSignDirection),
            };
            const { submissionType: _submissionType, ...updates } = request;
            await updateSubmission({ submissionId: targetSubmissionId, request: updates });
          }

          const mediaFiles = (draftQuery.data?.mediaFiles ?? []) as any[];
          const sessions = (draftQuery.data?.sessions ?? []) as any[];
          const hasMainMedia =
            mediaFiles.some((file) => {
              const type = (file.mediaType || file.media_type || '').toUpperCase();
              return type === 'IMAGE';
            }) ||
            sessions.some((upload) => {
              const type = (upload.mediaType || upload.media_type || '').toUpperCase();
              return type === 'IMAGE' && upload.status === 'COMPLETED';
            });

          if (!hasMainMedia && imageUri) {
            const prepared = await prepareSurveyImage({
              uri: imageUri,
              fileName: imageName,
              mimeType: imageMimeType,
            });
            const initRes = await initializeUpload({
              submissionId: targetSubmissionId,
              request: {
                mediaType: 'IMAGE',
                originalFilename: prepared.fileName,
                totalChunks: 1,
                totalSizeBytes: prepared.sizeBytes,
              },
            });
            await uploadChunk({
              sessionId: initRes.sessionId,
              request: prepared.chunk,
            });
            await completeUpload({ sessionId: initRes.sessionId });
          }

          // If batch has other items in existing server drafts
          if (batchSubmissionIds && batchIds.length > 1 && !batchIds[0].startsWith('local-')) {
            for (const otherId of batchIds) {
              if (otherId === targetSubmissionId) continue;
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

          // Finalize submission(s)
          const finalizeIds =
            batchSubmissionIds && batchIds.length > 0 && !batchIds[0].startsWith('local-')
              ? batchIds
              : [targetSubmissionId];
          let lastStatus = 'QUEUED';
          for (const id of finalizeIds) {
            const submitted = await submitSubmission({ submissionId: id });
            lastStatus = readSubmittedStatus(submitted) ?? lastStatus;
          }

          router.replace({
            pathname: '/work/submission-complete',
            params: {
              type: 'upload_submission',
              submissionId: targetSubmissionId,
              ...(finalizeIds.length > 1 ? { batchSubmissionIds: finalizeIds.join(',') } : {}),
              submissionStatus: lastStatus,
            },
          });
        }
      }
    } catch (error) {
      console.error('[Surveyor] handleSubmit ERROR:', error);
      setSubmitError(error instanceof Error ? error.message : UNABLE_TO_SUBMIT_SURVEY_MESSAGE);
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
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.six },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <AppButton
              accessibilityLabel="Quay lại"
              hitSlop={Spacing.one}
              onPress={() =>
                router.replace({ pathname: '/work', params: { currentRole: 'surveyor' } })
              }
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
                      name={{
                        android: 'chevron_right',
                        ios: 'chevron.right',
                        web: 'chevron_right',
                      }}
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
                  const thumbUri = itemDraft?.uri || (isSelected ? activeImageUri : undefined);
                  const itemCoord =
                    index === currentBatchIndex ? effectiveStartCoord : batchCoords[id];
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
            accessibilityLabel={
              activeImageUri ? 'Phương tiện khảo sát đã chọn' : 'Chưa chọn phương tiện khảo sát'
            }
            style={[
              styles.imageFrame,
              {
                backgroundColor: theme.neutral,
                borderColor: theme.border,
              },
            ]}
          >
            {activeImageUri &&
            !activeImageMimeType?.startsWith('video/') &&
            !/\.(mp4|mov|mkv)$/i.test(activeImageUri) ? (
              <Image
                accessibilityLabel="Ảnh khảo sát đã chọn"
                contentFit="cover"
                source={{ uri: activeImageUri }}
                style={styles.image}
              />
            ) : (
              <>
                <SymbolView
                  fallback={
                    <Text style={[styles.imageFallback, { color: theme.placeholder }]}>
                      {activeImageMimeType?.startsWith('video/') ||
                      (activeImageUri && /\.(mp4|mov|mkv)$/i.test(activeImageUri))
                        ? 'VID'
                        : 'IMG'}
                    </Text>
                  }
                  name={{
                    android:
                      activeImageMimeType?.startsWith('video/') ||
                      (activeImageUri && /\.(mp4|mov|mkv)$/i.test(activeImageUri))
                        ? 'videocam'
                        : 'image',
                    ios:
                      activeImageMimeType?.startsWith('video/') ||
                      (activeImageUri && /\.(mp4|mov|mkv)$/i.test(activeImageUri))
                        ? 'video'
                        : 'photo',
                    web:
                      activeImageMimeType?.startsWith('video/') ||
                      (activeImageUri && /\.(mp4|mov|mkv)$/i.test(activeImageUri))
                        ? 'videocam'
                        : 'image',
                  }}
                  size={40}
                  tintColor={theme.primary}
                />
                <Text style={[styles.placeholderLabel, { color: theme.textSecondary }]}>
                  {activeImageName ??
                    (activeImageMimeType?.startsWith('video/') ||
                    (activeImageUri && /\.(mp4|mov|mkv)$/i.test(activeImageUri))
                      ? 'Bản ghi khảo sát Video'
                      : 'Không có bản xem trước')}
                </Text>
              </>
            )}
          </View>

          {isDraftLoaded &&
          !draftQuery.data?.mediaFiles?.some((file: any) => {
            const type = (file.mediaType || file.media_type || '').toUpperCase();
            return type === 'IMAGE' || type === 'VIDEO';
          }) &&
          !imageUri ? (
            <AppButton
              label="Chọn phương tiện bản nháp"
              onPress={() =>
                router.replace({
                  pathname: '/work/new-survey',
                  params: { draftId: currentDraftId },
                })
              }
            />
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
                  trailingIcon={
                    <Pressable
                      accessibilityLabel="Chọn ngày từ lịch"
                      accessibilityRole="button"
                      hitSlop={Spacing.one}
                      onPress={() => setShowDatePicker(true)}
                      disabled={isSubmitting}
                      style={styles.calendarIconButton}
                    >
                      <MaterialCommunityIcons
                        name="calendar-month-outline"
                        size={22}
                        color={theme.primary}
                      />
                    </Pressable>
                  }
                />
              )}
            />
            {showDatePicker ? (
              <DateTimePicker
                value={parseDateToDateObject(capturedAt)}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={handleDatePickerChange}
              />
            ) : null}
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
                  value={
                    effectiveStartCoord
                      ? `${effectiveStartCoord[1].toFixed(6)}, ${effectiveStartCoord[0].toFixed(6)}`
                      : 'Chưa có vị trí bắt đầu'
                  }
                  placeholder="Chưa có vị trí bắt đầu"
                  leadingIcon={
                    <MaterialCommunityIcons name="map-marker" size={20} color="#16A34A" />
                  }
                  containerStyle={styles.imageLocationInput}
                />
                {effectiveStartCoord ? (
                  <View
                    style={[
                      styles.addressResolvedCard,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.addressResolvedHeader}>
                      <MaterialCommunityIcons name="map-marker-radius" size={16} color="#16A34A" />
                      <Text style={[styles.addressResolvedTitle, { color: theme.textSecondary }]}>
                        {startLocationQuery.isLoading
                          ? 'Đang tra cứu vị trí bắt đầu...'
                          : 'Địa chỉ điểm bắt đầu'}
                      </Text>
                      {startLocationQuery.isLoading ? (
                        <ActivityIndicator size="small" color="#16A34A" style={{ marginLeft: 6 }} />
                      ) : null}
                    </View>
                    <Text style={[styles.addressResolvedText, { color: theme.text }]}>
                      {startLocationQuery.data?.displayAddress ||
                        (startLocationQuery.isLoading
                          ? 'Đang tra cứu dịch vụ không gian...'
                          : 'Không thể xác định địa chỉ vị trí')}
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
                  value={
                    endCoordinate
                      ? `${endCoordinate[1].toFixed(6)}, ${endCoordinate[0].toFixed(6)}`
                      : 'Ước tính từ thời lượng video...'
                  }
                  placeholder="Đang ước tính vị trí kết thúc..."
                  leadingIcon={
                    <MaterialCommunityIcons name="flag-checkered" size={20} color="#DC2626" />
                  }
                  containerStyle={styles.imageLocationInput}
                />
                {endCoordinate ? (
                  <View
                    style={[
                      styles.addressResolvedCard,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.addressResolvedHeader}>
                      <MaterialCommunityIcons name="flag-checkered" size={16} color="#DC2626" />
                      <Text style={[styles.addressResolvedTitle, { color: theme.textSecondary }]}>
                        {endLocationQuery.isLoading
                          ? 'Đang tra cứu vị trí kết thúc...'
                          : 'Địa chỉ điểm kết thúc'}
                      </Text>
                      {endLocationQuery.isLoading ? (
                        <ActivityIndicator size="small" color="#DC2626" style={{ marginLeft: 6 }} />
                      ) : null}
                    </View>
                    <Text style={[styles.addressResolvedText, { color: theme.text }]}>
                      {endLocationQuery.data?.displayAddress ||
                        (endLocationQuery.isLoading
                          ? 'Đang tra cứu dịch vụ không gian...'
                          : 'Không thể xác định địa chỉ vị trí')}
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
                  style={[
                    styles.accordionHeader,
                    { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                  ]}
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
                  <View
                    style={[
                      styles.accordionBody,
                      { borderColor: theme.border, backgroundColor: theme.neutral },
                    ]}
                  >
                    <Text style={[styles.accordionDesc, { color: theme.textSecondary }]}>
                      Hệ thống tự động trích xuất GPS và tạo lộ trình GPX tương ứng. Chỉ đính kèm
                      tệp GPX ngoài nếu bạn muốn sử dụng lộ trình từ thiết bị GPS chuyên dụng.
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
                value={
                  displayCoordinate
                    ? `${displayCoordinate[1].toFixed(6)}, ${displayCoordinate[0].toFixed(6)}`
                    : ''
                }
                placeholder="Chưa có dữ liệu vị trí"
                leadingIcon={<AntDesign name="environment" size={18} color={theme.primary} />}
                containerStyle={styles.imageLocationInput}
              />
              {effectiveStartCoord ? (
                <AppInput
                  label="Địa chỉ thực tế"
                  editable={false}
                  multiline={true}
                  value={startLocationQuery.data?.displayAddress || ''}
                  leadingIcon={<AntDesign name="environment" size={18} color={theme.primary} />}
                  containerStyle={[styles.imageLocationInput, styles.multilineAddressInput]}
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
                        ? gpxCoordinates.length > 0
                          ? gpxCoordinates
                          : [effectiveStartCoord, endCoordinate]
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
                  variant="ghost"
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
            {locationMessage && !currentItemHasGps ? (
              <Text
                accessibilityRole="alert"
                style={[styles.locationMessage, { color: theme.textSecondary }]}
              >
                {locationMessage}
              </Text>
            ) : null}
          </View>

          {/* Sign Direction Selector Section (for Image Submissions) */}
          {isImageSubmission ? (
            <View style={styles.section}>
              <View style={styles.directionHeaderRow}>
                <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>
                  Hướng biển báo
                </Text>
                {activeSignDirection !== undefined ? (
                  <View style={[styles.directionBadge, { backgroundColor: '#E0F2FE' }]}>
                    <MaterialCommunityIcons name="compass-outline" size={16} color="#0284C7" />
                    <Text style={styles.directionBadgeText}>
                      {activeSignDirection}° ({getCardinalDirectionLabel(activeSignDirection)})
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Hướng luồng giao thông mà biển báo áp dụng (mặc định là hướng phía sau biển báo / chiều xe chạy qua biển).
              </Text>

              {/* Map Preview with Interactive Direction Indicator */}
              <View
                accessibilityLabel={
                  activeSignDirection !== undefined
                    ? `Bản đồ chọn hướng biển báo: hiện tại ${activeSignDirection} độ, hướng ${getCardinalDirectionLabel(activeSignDirection)}`
                    : 'Bản đồ chọn hướng biển báo: chưa chọn hướng'
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
                      locationPin={effectiveStartCoord}
                      showFocusPin={true}
                      showCurrentLocation={false}
                      isNavigatingFeature={false}
                    />

                    {/* Direction Indicator Overlay in Center of Map */}
                    <View pointerEvents="none" style={styles.directionOverlayCenter}>
                      {activeSignDirection !== undefined ? (
                        /* Direction pointer pointing along activeSignDirection */
                        <View
                          style={[
                            styles.directionConeContainer,
                            { transform: [{ rotate: `${activeSignDirection}deg` }] },
                          ]}
                        >
                          <View style={styles.directionBeam} />
                          <View style={styles.directionArrowHead} />
                        </View>
                      ) : null}

                      {/* Center Marker Pin */}
                      <View style={styles.centerCompassHub}>
                        <MaterialCommunityIcons name="traffic-light" size={18} color="#FFFFFF" />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.mapEmptyState}>
                    <MaterialCommunityIcons name="compass-off" size={28} color={theme.placeholder} />
                    <Text style={[styles.mapEmptyText, { color: theme.placeholder }]}>
                      Chưa có tọa độ GPS để hiển thị bản đồ hướng biển báo.
                    </Text>
                  </View>
                )}

                {/* Angle floating badge on map - only show when a direction is selected */}
                {activeSignDirection !== undefined ? (
                  <View style={[styles.floatingAngleBadge, { backgroundColor: 'rgba(15, 23, 42, 0.85)' }]}>
                    <Text style={styles.floatingAngleText}>
                      {activeSignDirection}° {getCardinalDirectionLabel(activeSignDirection)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Controls to adjust direction */}
              <View style={styles.directionControlsContainer}>
                {/* Quick Cardinal Direction Buttons */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardinalScrollContent}
                >
                  {[
                    { label: 'Bắc (0°)', deg: 0 },
                    { label: 'ĐB (45°)', deg: 45 },
                    { label: 'Đông (90°)', deg: 90 },
                    { label: 'ĐN (135°)', deg: 135 },
                    { label: 'Nam (180°)', deg: 180 },
                    { label: 'TN (225°)', deg: 225 },
                    { label: 'Tây (270°)', deg: 270 },
                    { label: 'TB (315°)', deg: 315 },
                  ].map(({ label, deg }) => {
                    const isSelected =
                      activeSignDirection !== undefined &&
                      (Math.abs(activeSignDirection - deg) < 10 || (deg === 0 && activeSignDirection > 350));
                    return (
                      <Pressable
                        key={deg}
                        accessibilityLabel={`Chọn hướng ${label}`}
                        onPress={() => {
                          if (isSelected) {
                            setSignDirection(undefined);
                          } else {
                            setSignDirection(deg);
                          }
                        }}
                        style={[
                          styles.cardinalChip,
                          {
                            backgroundColor: isSelected ? '#0671EB' : theme.backgroundElement,
                            borderColor: isSelected ? '#0671EB' : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cardinalChipText,
                            { color: isSelected ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Fine-tuning & Reset row */}
                <View style={styles.fineTuneRow}>
                  <Pressable
                    accessibilityLabel="Quay ngược chiều kim đồng hồ 15 độ"
                    onPress={() => setSignDirection(((activeSignDirection ?? 0) - 15 + 360) % 360)}
                    style={[styles.stepBtn, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                  >
                    <MaterialCommunityIcons name="rotate-left" size={18} color={theme.text} />
                    <Text style={[styles.stepBtnText, { color: theme.text }]}>-15°</Text>
                  </Pressable>

                  <Pressable
                    accessibilityLabel="Quay cùng chiều kim đồng hồ 15 độ"
                    onPress={() => setSignDirection(((activeSignDirection ?? 0) + 15) % 360)}
                    style={[styles.stepBtn, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                  >
                    <MaterialCommunityIcons name="rotate-right" size={18} color={theme.text} />
                    <Text style={[styles.stepBtnText, { color: theme.text }]}>+15°</Text>
                  </Pressable>

                  <Pressable
                    accessibilityLabel="Đặt lại hướng mặc định"
                    onPress={() => {
                      const defaultH =
                        parsedAssets[currentBatchIndex]?.gps?.heading ?? initialDefaultHeading;
                      setSignDirection(defaultH);
                    }}
                    style={[styles.stepBtn, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                  >
                    <MaterialCommunityIcons name="restore" size={18} color={theme.textSecondary} />
                    <Text style={[styles.stepBtnText, { color: theme.textSecondary }]}>Mặc định</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

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
                  containerStyle={styles.noteInputContainer}
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
      <Modal animationType="fade" transparent visible={Boolean(uploadProgress)}>
        <View style={styles.progressModalOverlay}>
          <View
            style={[
              styles.progressModalCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <ActivityIndicator color={theme.primary} size="large" />
            <Text style={[styles.progressModalTitle, { color: theme.text }]}>
              Đang tải lên Video khảo sát
            </Text>
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
                {uploadProgress?.currentChunk
                  ? `Phần ${uploadProgress.currentChunk}/${uploadProgress.totalChunks}`
                  : 'Đang khởi tạo'}
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
