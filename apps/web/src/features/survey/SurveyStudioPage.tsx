import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, WarningCircle } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import { PageHeader, Button } from '@shared/ui'
import type { CoordinateSource } from '@shared/types'
import { submissionsService, type ChunkedUploadProgress } from '@/api/services/submissions.service'
import {
  parseGpxFile,
  extractImageFileMetadata,
  extractGpsFromVideoFile,
  createCompanionGpxFile,
  estimateEndCoordinate,
} from './utils'
import {
  SurveyMediaStep,
  SurveyDetailsStep,
  SurveyChunkProgress,
  SurveyFinishView,
} from './components'

export type SurveyStudioStep = 'media' | 'details' | 'uploading' | 'finish'

/**
 * SurveyStudioPage: Dedicated ingestion studio matching mobile's 3-step interaction:
 * Step 1: Media Selection & EXIF/Video-container GPS auto-detection
 * Step 2: Location Map Confirmation & Submission Metadata
 * Step 3: Chunked Upload Progress & Finish Screen
 */
export default function SurveyStudioPage() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const toast = useToast()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState<SurveyStudioStep>('media')
  const [mode, setMode] = useState<'video_gpx' | 'photo_gps'>('video_gpx')
  const [capturedAt, setCapturedAt] = useState<string>(new Date().toISOString())
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Coordinates & Trajectory
  const [photoLat, setPhotoLat] = useState(10.7769)
  const [photoLng, setPhotoLng] = useState(106.7009)
  const [endLat, setEndLat] = useState(10.781)
  const [endLng, setEndLng] = useState(106.705)
  const [durationSeconds, setDurationSeconds] = useState(60)
  const [note, setNote] = useState('')
  const [hasAutoGps, setHasAutoGps] = useState(false)
  const [gpxPointsCount, setGpxPointsCount] = useState<number | undefined>()

  // Chunked Upload State
  const [isUploading, setIsUploading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const isPausedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const [chunkProgress, setChunkProgress] = useState<ChunkedUploadProgress>({
    step: 'initializing',
    percent: 0,
  })
  const [submittedId, setSubmittedId] = useState<string | undefined>()
  const [submittedStatus, setSubmittedStatus] = useState<string>('QUEUED')
  const [error, setError] = useState('')

  const isMediaValid = mode === 'video_gpx' ? Boolean(videoFile) : Boolean(photoFile)

  const handleStepClick = (targetStep: SurveyStudioStep) => {
    if (isUploading) return

    if (targetStep === 'media') {
      setCurrentStep('media')
      return
    }

    if (targetStep === 'details') {
      if (isMediaValid) {
        setCurrentStep('details')
      }
      return
    }

    if (targetStep === 'uploading') {
      if (currentStep === 'uploading' || currentStep === 'finish') {
        setCurrentStep('uploading')
      }
    }
  }

  // Handle Photo Selection with automatic EXIF GPS extraction
  const handlePhotoSelect = async (file: File) => {
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    const meta = await extractImageFileMetadata(file)
    if (meta.latitude && meta.longitude) {
      setPhotoLat(meta.latitude)
      setPhotoLng(meta.longitude)
      setHasAutoGps(true)
      if (meta.capturedAt) {
        setCapturedAt(meta.capturedAt)
      }
      const end = estimateEndCoordinate(meta.longitude, meta.latitude, 60)
      setEndLng(end[0])
      setEndLat(end[1])
    } else {
      setHasAutoGps(false)
    }
  }

  // Handle Video Selection with container GPS extraction (QuickTime, NMEA, camm, GPMF, loci)
  const handleVideoSelect = async (file: File) => {
    setVideoFile(file)
    try {
      const meta = await extractGpsFromVideoFile(file)
      const dur = meta?.durationSeconds || 60
      setDurationSeconds(dur)

      if (meta && meta.latitude && meta.longitude) {
        setPhotoLat(meta.latitude)
        setPhotoLng(meta.longitude)
        setHasAutoGps(true)
        if (meta.capturedAt) {
          setCapturedAt(meta.capturedAt)
        }

        const end = estimateEndCoordinate(meta.longitude, meta.latitude, dur)
        setEndLng(end[0])
        setEndLat(end[1])

        // Auto-generate companion GPX file from video telemetry if no manual GPX attached yet
        const companionGpx = createCompanionGpxFile({
          startCoordinate: [meta.longitude, meta.latitude],
          endCoordinate: end,
          capturedAt: meta.capturedAt || capturedAt || new Date().toISOString(),
          durationSeconds: dur,
          fileName: `${file.name.replace(/\.[^/.]+$/, '')}-companion.gpx`,
        })
        setGpxFile(companionGpx)
        setGpxPointsCount(2)
      } else {
        setHasAutoGps(false)
        const end = estimateEndCoordinate(photoLng, photoLat, dur)
        setEndLng(end[0])
        setEndLat(end[1])
      }
    } catch (err) {
      console.warn('[SurveyStudio] Failed to inspect video file for GPS:', err)
      setHasAutoGps(false)
    }
  }

  // Handle GPX / Companion Telemetry Selection (supports .gpx, companion frame .jpg, and .json)
  const handleGpxSelect = async (file: File) => {
    try {
      // 1. If companion image (e.g. frame_000505.jpg), extract EXIF/JSON GPS & create companion GPX
      if (file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name)) {
        const meta = await extractImageFileMetadata(file)
        if (meta.latitude && meta.longitude) {
          setPhotoLat(meta.latitude)
          setPhotoLng(meta.longitude)
          setHasAutoGps(true)
          if (meta.capturedAt) {
            setCapturedAt(meta.capturedAt)
          }
          const companionGpx = createCompanionGpxFile({
            startCoordinate: [meta.longitude, meta.latitude],
            endCoordinate: estimateEndCoordinate(meta.longitude, meta.latitude, 60),
            capturedAt: meta.capturedAt || capturedAt || new Date().toISOString(),
            durationSeconds: 60,
            fileName: `${file.name.replace(/\.[^/.]+$/, '')}-companion.gpx`,
          })
          setGpxFile(companionGpx)
          setGpxPointsCount(2)
          toast.success(
            `Đã trích xuất toạ độ GPS từ ảnh chụp kèm (${meta.latitude.toFixed(5)}, ${meta.longitude.toFixed(5)})`,
            t('survey.gps_detected_title')
          )
          return
        } else {
          toast.warning('Ảnh chụp kèm không chứa siêu dữ liệu toạ độ GPS.')
          return
        }
      }

      // 2. If companion JSON telemetry file
      if (file.type.includes('json') || file.name.endsWith('.json')) {
        const text = await file.text()
        const cLatMatch = /(?:c_lat|latitude|lat)[\s"':=]+([+-]?\d{1,2}\.\d{4,})/i.exec(text)
        const cLonMatch = /(?:c_lon|longitude|lon)[\s"':=]+([+-]?\d{1,3}\.\d{4,})/i.exec(text)
        if (cLatMatch && cLonMatch) {
          const lat = Number.parseFloat(cLatMatch[1])
          const lon = Number.parseFloat(cLonMatch[1])
          setPhotoLat(lat)
          setPhotoLng(lon)
          setHasAutoGps(true)
          const companionGpx = createCompanionGpxFile({
            startCoordinate: [lon, lat],
            endCoordinate: estimateEndCoordinate(lon, lat, 60),
            capturedAt: capturedAt || new Date().toISOString(),
            durationSeconds: 60,
            fileName: `${file.name.replace(/\.[^/.]+$/, '')}-companion.gpx`,
          })
          setGpxFile(companionGpx)
          setGpxPointsCount(2)
          toast.success(`Đã trích xuất toạ độ GPS từ file JSON (${lat.toFixed(5)}, ${lon.toFixed(5)})`, t('survey.gps_detected_title'))
          return
        }
      }

      // 3. Standard GPX file
      setGpxFile(file)
      const parsed = await parseGpxFile(file)
      if (parsed.firstPoint) {
        setPhotoLat(parsed.firstPoint.latitude)
        setPhotoLng(parsed.firstPoint.longitude)
        setGpxPointsCount(parsed.totalPoints)
        setHasAutoGps(true)
        if (parsed.startTime) {
          setCapturedAt(parsed.startTime)
        }
        toast.success(
          `Đã phân tích ${parsed.totalPoints} toạ độ hành trình từ file GPX`,
          'GPX Hợp lệ'
        )
      }
    } catch (err) {
      console.warn('[SurveyStudio] Failed to parse GPX/companion file:', err)
      toast.error('Không thể đọc file toạ độ. Vui lòng kiểm tra định dạng.')
    }
  }

  // Submit Chunked Upload
  const handleUpload = async () => {
    if (isUploading) return
    setError('')
    setIsUploading(true)
    setIsPaused(false)
    isPausedRef.current = false
    setCurrentStep('uploading')

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const isVideo = mode === 'video_gpx'
      const targetFile = isVideo ? videoFile! : photoFile!
      const coordinateSource: CoordinateSource = isVideo
        ? 'GPX_FILE'
        : hasAutoGps
        ? 'IMAGE_EXIF'
        : 'DEVICE_GPS'

      let finalGpx = isVideo ? gpxFile : undefined
      // Auto-synthesize companion GPX if video without separate GPX file
      if (isVideo && !finalGpx) {
        finalGpx = createCompanionGpxFile({
          startCoordinate: [photoLng, photoLat],
          endCoordinate: [endLng, endLat],
          capturedAt: capturedAt || new Date().toISOString(),
          durationSeconds: durationSeconds || 60,
          fileName: `${targetFile.name.replace(/\.[^/.]+$/, '')}-companion.gpx`,
        })
      }

      const result = await submissionsService.executeFullChunkedUpload(targetFile, {
        submissionType: isVideo ? 'VIDEO_GPX' : 'SINGLE_IMAGE',
        capturedAt: capturedAt || new Date().toISOString(),
        coordinateSource,
        note: note.trim() || undefined,
        latitude: photoLat,
        longitude: photoLng,
        durationSeconds: durationSeconds || 60,
        gpxFile: finalGpx || undefined,
        signal: abortController.signal,
        checkPaused: () => isPausedRef.current,
        onProgress: (p) => {
          setChunkProgress(p)
        },
      })

      setSubmittedId(result.submissionId)
      setSubmittedStatus(result.status || 'QUEUED')
      setCurrentStep('finish')
      toast.success(t('survey.upload_success_title', 'Tải lên thành công! Dữ liệu đang được xử lý'))
    } catch (err: any) {
      if (abortController.signal.aborted) {
        toast.info('Đã hủy tải lên')
        setCurrentStep('details')
        return
      }
      console.error('[SurveyStudio] Upload error:', err)
      setError(err.message || 'Lỗi tải lên tệp. Vui lòng thử lại.')
      toast.error(err.message || 'Tải lên thất bại')
      setCurrentStep('details')
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    abortControllerRef.current?.abort()
    setCurrentStep('media')
    setSubmittedId(undefined)
    setVideoFile(null)
    setGpxFile(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    setNote('')
    setChunkProgress({ step: 'initializing', percent: 0 })
    setError('')
  }

  return (
    <div className={`min-h-screen pb-16 transition-colors ${isDark ? 'bg-[#030708]' : 'bg-[#F8F7F7]'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <PageHeader
          title={t('survey.title_studio', t('survey.title'))}
          subtitle={t('survey.subtitle_studio', t('survey.subtitle'))}
          actions={
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/survey/history')}
              leftIcon={<Compass size={18} weight="bold" />}
            >
              {t('survey.btn_view_telemetry')}
            </Button>
          }
        />

        {/* Stepper Progress Bar (Interactive & Clean) */}
        {currentStep !== 'finish' && (
          <div
            className={`p-1.5 sm:p-2 rounded-2xl border flex items-center justify-between text-xs font-bold transition-colors ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-xs'
            }`}
          >
            {/* Step 1: Media */}
            <button
              type="button"
              onClick={() => handleStepClick('media')}
              disabled={isUploading}
              title={t('survey.stepper_media')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                currentStep === 'media'
                  ? isDark
                    ? 'bg-[#00c4de]/10 text-[#00c4de]'
                    : 'bg-[#007b8b]/10 text-[#007b8b]'
                  : isMediaValid
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full transition-all shrink-0 ${
                  currentStep === 'media'
                    ? 'bg-[#007b8b] dark:bg-[#00c4de] ring-4 ring-[#007b8b]/20 dark:ring-[#00c4de]/20'
                    : isMediaValid
                    ? 'bg-emerald-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
              <span className="truncate">{t('survey.stepper_media')}</span>
            </button>

            {/* Divider 1 */}
            <div
              className={`flex-1 h-px mx-1 sm:mx-3 transition-colors ${
                isMediaValid
                  ? 'bg-emerald-500/40 dark:bg-emerald-500/30'
                  : 'bg-gray-200 dark:bg-white/10'
              }`}
            />

            {/* Step 2: Location and Details */}
            <button
              type="button"
              onClick={() => handleStepClick('details')}
              disabled={!isMediaValid || isUploading}
              title={isMediaValid ? t('survey.stepper_details') : 'Vui lòng chọn phương tiện trước'}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                currentStep === 'details'
                  ? isDark
                    ? 'bg-[#00c4de]/10 text-[#00c4de]'
                    : 'bg-[#007b8b]/10 text-[#007b8b]'
                  : isMediaValid
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer'
                  : 'text-gray-400 dark:text-gray-600 opacity-60 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full transition-all shrink-0 ${
                  currentStep === 'details'
                    ? 'bg-[#007b8b] dark:bg-[#00c4de] ring-4 ring-[#007b8b]/20 dark:ring-[#00c4de]/20'
                    : currentStep === 'uploading'
                    ? 'bg-emerald-500'
                    : isMediaValid
                    ? 'bg-gray-400 dark:bg-gray-500'
                    : 'bg-gray-300 dark:bg-gray-700'
                }`}
              />
              <span className="truncate">{t('survey.stepper_details')}</span>
            </button>

            {/* Divider 2 */}
            <div
              className={`flex-1 h-px mx-1 sm:mx-3 transition-colors ${
                currentStep === 'uploading'
                  ? 'bg-emerald-500/40 dark:bg-emerald-500/30'
                  : 'bg-gray-200 dark:bg-white/10'
              }`}
            />

            {/* Step 3: AI Processing */}
            <button
              type="button"
              onClick={() => handleStepClick('uploading')}
              disabled={currentStep !== 'uploading'}
              title={t('survey.stepper_upload')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                currentStep === 'uploading'
                  ? isDark
                    ? 'bg-[#00c4de]/10 text-[#00c4de]'
                    : 'bg-[#007b8b]/10 text-[#007b8b]'
                  : 'text-gray-400 dark:text-gray-600 opacity-60 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full transition-all shrink-0 ${
                  currentStep === 'uploading'
                    ? 'bg-[#007b8b] dark:bg-[#00c4de] ring-4 ring-[#007b8b]/20 dark:ring-[#00c4de]/20'
                    : 'bg-gray-300 dark:bg-gray-700'
                }`}
              />
              <span className="truncate">{t('survey.stepper_upload')}</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2.5 font-semibold">
            <WarningCircle size={18} weight="bold" className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stepped Body Container */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          {currentStep === 'media' && (
            <SurveyMediaStep
              mode={mode}
              onModeChange={setMode}
              videoFile={videoFile}
              gpxFile={gpxFile}
              photoFile={photoFile}
              photoPreview={photoPreview}
              hasAutoGps={hasAutoGps}
              photoLat={photoLat}
              photoLng={photoLng}
              gpxPointsCount={gpxPointsCount}
              onPhotoSelect={handlePhotoSelect}
              onVideoSelect={handleVideoSelect}
              onGpxSelect={handleGpxSelect}
              onNext={() => setCurrentStep('details')}
              isDark={isDark}
            />
          )}

          {currentStep === 'details' && (
            <SurveyDetailsStep
              mode={mode}
              videoFile={videoFile}
              gpxFile={gpxFile}
              photoFile={photoFile}
              photoPreview={photoPreview}
              capturedAt={capturedAt}
              note={note}
              lat={photoLat}
              lng={photoLng}
              endLat={endLat}
              endLng={endLng}
              durationSeconds={durationSeconds}
              hasAutoGps={hasAutoGps}
              isUploading={isUploading}
              isDark={isDark}
              onCapturedAtChange={setCapturedAt}
              onNoteChange={setNote}
              onChangeLocation={(lat, lng) => {
                setPhotoLat(lat)
                setPhotoLng(lng)
              }}
              onChangeEndLocation={(lat, lng) => {
                setEndLat(lat)
                setEndLng(lng)
              }}
              onGpxSelect={handleGpxSelect}
              onBack={() => setCurrentStep('media')}
              onSubmit={handleUpload}
            />
          )}

          {currentStep === 'uploading' && (
            <div className="py-6 space-y-6">
              <SurveyChunkProgress
                progress={chunkProgress}
                isPaused={isPaused}
                isDark={isDark}
                onTogglePause={() => setIsPaused((p) => !p)}
              />
            </div>
          )}

          {currentStep === 'finish' && (
            <SurveyFinishView
              submissionId={submittedId}
              status={submittedStatus}
              isDark={isDark}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  )
}
