import { useState, useRef, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  UploadSimple,
  VideoCamera,
  Camera,
  MapPin,
  CheckCircle,
  Clock,
  WarningCircle,
  Coins,
  Cpu,
  ArrowRight,
  Sparkle,
  Pause,
  Play,
  X,
  Crosshair,
  Compass,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import { mockSurveySubmissions } from '@/data'
import { PhotoLocationPicker, NewSignTypeModal } from '@/components/survey'

export default function SurveyStudioPage() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const toast = useToast()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'video_gpx' | 'photo_gps'>('video_gpx')
  const [tripName, setTripName] = useState('')
  const [route, setRoute] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Coordinates for photo mode
  const [photoLat, setPhotoLat] = useState(10.7769)
  const [photoLng, setPhotoLng] = useState(106.7009)

  // Simulated chunked upload state (Flow 1 & Requirement 3.2)
  const [isUploading, setIsUploading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentChunk, setCurrentChunk] = useState(1)
  const totalChunks = 10
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState('')

  // Modal for new sign type
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handlePhotoSelect = (file: File) => {
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Simulated EXIF GPS extraction
  const handleAutoExtractExif = () => {
    if (!photoFile) {
      toast.warning(t('survey.toast_err_no_photo_gps'))
      return
    }
    const detectedLat = Number((10.775 + (Math.random() - 0.5) * 0.02).toFixed(6))
    const detectedLng = Number((106.698 + (Math.random() - 0.5) * 0.02).toFixed(6))
    setPhotoLat(detectedLat)
    setPhotoLng(detectedLng)
    toast.success(
      t('survey.toast_exif_gps_success', { lat: detectedLat, lng: detectedLng }),
      t('survey.toast_exif_title')
    )
  }

  const startUploadSimulation = () => {
    setIsUploading(true)
    setIsPaused(false)

    uploadIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current)
          setTimeout(() => {
            setIsUploading(false)
            setUploadSuccess(true)

            // Add new submission record to mock data
            const newId = `SURV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
            mockSurveySubmissions.unshift({
              id: newId,
              tripName: tripName.trim(),
              route: route.trim() || 'HCMC Urban Corridor',
              mediaType: mode,
              videoFileName: videoFile?.name,
              gpxFileName: gpxFile?.name,
              photoFileName: photoFile?.name,
              fileSizeMb: mode === 'video_gpx' ? 385.4 : 4.2,
              durationSec: mode === 'video_gpx' ? 840 : undefined,
              distanceKm: mode === 'video_gpx' ? 10.5 : undefined,
              uploadDate: new Date().toLocaleString('vi-VN'),
              status: 'Processing',
              stage: 'sync',
              progressPercent: 25,
              detectedSignsCount: 2,
              validatedSignsCount: 0,
              rewardCredits: mode === 'video_gpx' ? 120 : 20,
              gpxPointsCount: mode === 'video_gpx' ? 1680 : undefined,
              routePoints: [
                [photoLat, photoLng],
                [photoLat + 0.005, photoLng + 0.008],
                [photoLat + 0.012, photoLng + 0.015],
              ],
              candidates: [
                {
                  id: `CAND-${newId}-1`,
                  signCode: 'P.102',
                  signName: t('survey.sample_sign_name'),
                  category: 'P',
                  confidence: 0.962,
                  cropFrameSec: 120,
                  timestampStr: '02:00',
                  lat: photoLat,
                  lng: photoLng,
                  trafficDirection: 'Northbound (015°)',
                  distanceMeters: 11.5,
                  reviewStatus: 'Pending',
                  reviewCount: 0,
                  reviewerVoteRatio: t('survey.waiting_reviewer'),
                },
              ],
            })
          }, 600)
          return 100
        }

        const nextVal = prev + 10
        setCurrentChunk(Math.min(totalChunks, Math.ceil((nextVal / 100) * totalChunks)))
        return nextVal
      })
    }, 400)
  }

  const handlePauseUpload = () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current)
      uploadIntervalRef.current = null
    }
    setIsPaused(true)
  }

  const handleResumeUpload = () => {
    setIsPaused(false)
    startUploadSimulation()
  }

  const handleUpload = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!tripName.trim()) {
      setError(t('survey.err_trip_name'))
      return
    }

    if (mode === 'video_gpx' && !videoFile) {
      setError(t('survey.err_no_video'))
      return
    }

    if (mode === 'photo_gps' && !photoFile) {
      setError(t('survey.err_no_photo'))
      return
    }

    startUploadSimulation()
  }

  return (
    <div
      className={`w-full min-h-[calc(100vh-80px)] py-8 sm:py-12 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6 text-left">
        {/* ─── Page Header (Matching ProfilePage & SurveyHistoryPage) ──────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  isDark
                    ? 'bg-[#007b8b]/20 border-[#00c4de]/30 text-[#00c4de]'
                    : 'bg-teal-50 border-teal-200 text-[#007b8b]'
                }`}
              >
                <Cpu size={14} weight="bold" />
                <span>Crowd-AI Survey Studio</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('survey.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              {t('survey.subtitle')}
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-200'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800'
              }`}
            >
              <Sparkle size={16} className="text-amber-500" />
              <span>{t('survey.btn_report_new_sign')}</span>
            </button>

            <Link
              to="/survey/history"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-200'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800'
              }`}
            >
              <Clock size={16} />
              <span>{t('survey.btn_view_history')}</span>
            </Link>
          </div>
        </div>

        {/* ─── Compact Contributor Reward Policy Strip ─────────────────────── */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex items-center gap-3.5 transition-colors ${
            isDark
              ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
              : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}
          >
            <Coins size={24} weight="fill" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>{t('survey.reward_banner_title')}</span>
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 max-w-xl leading-relaxed">
              {t('survey.reward_banner_desc')}
            </p>
          </div>
        </div>

        {/* ─── Mode Switcher Tabs (Like ProfilePage Tab Pills) ─────────────── */}
        <div
          className={`flex rounded-2xl p-1.5 border max-w-md ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setMode('video_gpx')
              setUploadSuccess(false)
            }}
            className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'video_gpx'
                ? isDark
                  ? 'bg-[#00c4de] text-black shadow-xs'
                  : 'bg-[#007b8b] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <VideoCamera size={16} weight={mode === 'video_gpx' ? 'bold' : 'regular'} />
            <span>{t('survey.mode_video_gpx')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('photo_gps')
              setUploadSuccess(false)
            }}
            className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'photo_gps'
                ? isDark
                  ? 'bg-[#00c4de] text-black shadow-xs'
                  : 'bg-[#007b8b] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Camera size={16} weight={mode === 'photo_gps' ? 'bold' : 'regular'} />
            <span>{t('survey.mode_photo_gps')}</span>
          </button>
        </div>

        {/* ─── Main Upload Studio Card ─────────────────────────────────────── */}
        <div
          className={`rounded-2xl border p-6 sm:p-8 space-y-6 transition-colors ${
            isDark
              ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
              : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}
        >
          {uploadSuccess ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle size={38} weight="bold" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                {t('survey.upload_success_title')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                {t('survey.upload_success_desc')}
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setUploadSuccess(false)
                    setTripName('')
                    setRoute('')
                    setVideoFile(null)
                    setGpxFile(null)
                    setPhotoFile(null)
                    setPhotoPreview(null)
                    setUploadProgress(0)
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
                      : 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {t('survey.btn_upload_another')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/survey/history')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all ${
                    isDark
                      ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/20'
                      : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
                  }`}
                >
                  <span>{t('survey.btn_view_telemetry')}</span>
                  <ArrowRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2.5 font-semibold">
                  <WarningCircle size={18} weight="bold" className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Thông tin chuyến đi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase font-mono">
                    {t('survey.lbl_trip_name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    placeholder={t('survey.ph_trip_name')}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${
                      isDark
                        ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase font-mono">
                    {t('survey.lbl_route_corridor')}
                  </label>
                  <input
                    type="text"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    placeholder={t('survey.ph_corridor')}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${
                      isDark
                        ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                    }`}
                  />
                </div>
              </div>

              {/* Section 2: Vùng tải lên file (Mode video_gpx vs photo_gps) */}
              {mode === 'video_gpx' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Video File Dropzone */}
                    <div
                      className={`p-6 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center transition-all ${
                        videoFile
                          ? isDark
                            ? 'border-[#00c4de] bg-[#00c4de]/5'
                            : 'border-[#007b8b] bg-[#007b8b]/5'
                          : isDark
                          ? 'border-white/15 bg-white/[0.02] hover:border-white/30'
                          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 ${
                          videoFile
                            ? isDark
                              ? 'bg-[#00c4de]/20 text-[#00c4de]'
                              : 'bg-[#007b8b]/15 text-[#007b8b]'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                        }`}
                      >
                        <VideoCamera size={26} weight="bold" />
                      </div>

                      <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate max-w-[220px]">
                        {videoFile ? videoFile.name : t('survey.drop_video_title')}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {t('survey.video_format_hint')}
                      </span>

                      <label
                        className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                          isDark
                            ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        }`}
                      >
                        <span>{videoFile ? t('survey.btn_change_video') : t('survey.btn_select_video')}</span>
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && setVideoFile(e.target.files[0])}
                        />
                      </label>
                    </div>

                    {/* GPX File Dropzone */}
                    <div
                      className={`p-6 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center transition-all ${
                        gpxFile
                          ? isDark
                            ? 'border-[#00c4de] bg-[#00c4de]/5'
                            : 'border-[#007b8b] bg-[#007b8b]/5'
                          : isDark
                          ? 'border-white/15 bg-white/[0.02] hover:border-white/30'
                          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 ${
                          gpxFile
                            ? isDark
                              ? 'bg-[#00c4de]/20 text-[#00c4de]'
                              : 'bg-[#007b8b]/15 text-[#007b8b]'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                        }`}
                      >
                        <MapPin size={26} weight="bold" />
                      </div>

                      <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate max-w-[220px]">
                        {gpxFile ? gpxFile.name : t('survey.drop_gpx_title')}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {t('survey.gpx_format_hint')}
                      </span>

                      <label
                        className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                          isDark
                            ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        }`}
                      >
                        <span>{gpxFile ? t('survey.btn_change_gpx') : t('survey.btn_select_gpx')}</span>
                        <input
                          type="file"
                          accept=".gpx,application/gpx+xml"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && setGpxFile(e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>

                  {/* GPX Pre-validation Info Card */}
                  {gpxFile && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                        isDark
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                          : 'bg-cyan-50 border-cyan-200 text-cyan-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} weight="bold" className="shrink-0 text-cyan-500" />
                        <span>
                          <strong>{t('survey.gpx_analyzed')}</strong> {t('survey.gpx_analyzed_detail')}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 dark:text-cyan-300 font-bold shrink-0">
                        GPX OK
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Photo Upload Box */}
                    <div>
                      {photoPreview ? (
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 h-60 flex items-center justify-center bg-black/40 p-2">
                          <img src={photoPreview} alt="Selected" className="h-full w-full object-contain rounded-lg" />
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoFile(null)
                              setPhotoPreview(null)
                            }}
                            className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/90 cursor-pointer"
                          >
                            <X size={15} weight="bold" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`h-60 p-6 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center transition-all ${
                            isDark
                              ? 'border-white/15 bg-white/[0.02] hover:border-white/30'
                              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-2 text-gray-400">
                            <Camera size={26} />
                          </div>
                          <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
                            {t('survey.drop_photo_title')}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {t('survey.photo_format_hint')}
                          </span>
                          <label
                            className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                              isDark
                                ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                            }`}
                          >
                            <span>{t('survey.btn_select_photo')}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handlePhotoSelect(e.target.files[0])}
                            />
                          </label>
                        </div>
                      )}

                      {/* Auto EXIF extraction button */}
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleAutoExtractExif}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-[#00c4de]'
                              : 'bg-white hover:bg-gray-50 border-gray-200 text-[#007b8b]'
                          }`}
                        >
                          <Crosshair size={14} weight="bold" />
                          <span>{t('survey.btn_extract_exif')}</span>
                        </button>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                          {photoFile ? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Leaflet Mini-Map Picker */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase font-mono text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          <Compass size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
                          <span>{t('survey.location_picker_title')}</span>
                        </span>
                        <span className="text-[11px] font-mono text-[#007b8b] dark:text-[#00c4de] font-bold">
                          {photoLat.toFixed(5)}, {photoLng.toFixed(5)}
                        </span>
                      </div>

                      <PhotoLocationPicker
                        lat={photoLat}
                        lng={photoLng}
                        onChangeLocation={(newLat, newLng) => {
                          setPhotoLat(newLat)
                          setPhotoLng(newLng)
                        }}
                        height="180px"
                      />

                      {/* Manual coordinate inputs */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 font-mono">
                            {t('survey.lbl_lat')}
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            value={photoLat}
                            onChange={(e) => setPhotoLat(parseFloat(e.target.value) || 0)}
                            className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none transition-all ${
                              isDark
                                ? 'bg-black/50 border-white/15 text-white focus:border-[#00c4de]'
                                : 'bg-gray-50 border-gray-300 text-gray-900 focus:bg-white focus:border-[#007b8b]'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 font-mono">
                            {t('survey.lbl_lng')}
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            value={photoLng}
                            onChange={(e) => setPhotoLng(parseFloat(e.target.value) || 0)}
                            className={`w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none transition-all ${
                              isDark
                                ? 'bg-black/50 border-white/15 text-white focus:border-[#00c4de]'
                                : 'bg-gray-50 border-gray-300 text-gray-900 focus:bg-white focus:border-[#007b8b]'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chunked Upload Progress Bar */}
              {isUploading && (
                <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] space-y-2.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-mono font-bold">
                    <span className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                      <span>
                        {isPaused ? t('survey.chunk_paused') : `${t('survey.chunk_uploading')}: ${currentChunk}/${totalChunks}`}
                      </span>
                      <span className="text-gray-500 font-normal">({(24.5 * (isPaused ? 0 : 1)).toFixed(1)} MB/s)</span>
                    </span>
                    <span className="text-[#007b8b] dark:text-[#00c4de]">{uploadProgress}%</span>
                  </div>

                  <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div
                      className={`h-full transition-all duration-300 ${
                        isPaused ? 'bg-amber-400' : isDark ? 'bg-[#00c4de]' : 'bg-[#007b8b]'
                      }`}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {isPaused ? (
                      <button
                        type="button"
                        onClick={handleResumeUpload}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer hover:bg-emerald-500/30"
                      >
                        <Play size={12} weight="fill" />
                        <span>{t('survey.btn_resume')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePauseUpload}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/30"
                      >
                        <Pause size={12} weight="fill" />
                        <span>{t('survey.btn_pause')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`w-full py-3.5 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/20'
                      : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
                  }`}
                >
                  <UploadSimple size={18} weight="bold" />
                  <span>{isUploading ? t('survey.btn_uploading') : t('survey.btn_submit_survey')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* New Sign Type Report Modal */}
      <NewSignTypeModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialLat={photoLat.toString()}
        initialLng={photoLng.toString()}
      />
    </div>
  )
}
