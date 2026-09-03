import { useState, type FormEvent } from 'react'
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
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { mockSurveySubmissions } from '@/data'

export default function SurveyStudioPage() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  const [mode, setMode] = useState<'video_gpx' | 'photo_gps'>('video_gpx')
  const [tripName, setTripName] = useState('')
  const [route, setRoute] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoLat, setPhotoLat] = useState('10.7769')
  const [photoLng, setPhotoLng] = useState('106.7009')

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState('')

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

    setIsUploading(true)
    setUploadProgress(10)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          setTimeout(() => {
            setIsUploading(false)
            setUploadSuccess(true)

            const newId = `SURV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
            mockSurveySubmissions.unshift({
              id: newId,
              tripName: tripName.trim(),
              route: route.trim() || 'HCMC Urban Corridor',
              mediaType: mode,
              videoFileName: videoFile?.name,
              gpxFileName: gpxFile?.name,
              photoFileName: photoFile?.name,
              fileSizeMb: mode === 'video_gpx' ? 245.8 : 4.5,
              durationSec: mode === 'video_gpx' ? 600 : undefined,
              uploadDate: new Date().toLocaleString('vi-VN'),
              status: 'Processing',
              stage: 'sync',
              progressPercent: 20,
              detectedSignsCount: 0,
              validatedSignsCount: 0,
              rewardCredits: mode === 'video_gpx' ? 120 : 20,
              gpxPointsCount: mode === 'video_gpx' ? 1200 : undefined,
            })
          }, 600)
          return 100
        }
        return prev + 20
      })
    }, 300)
  }

  return (
    <div className={`min-h-screen pt-6 sm:pt-8 pb-16 px-4 sm:px-6 lg:px-8 transition-colors ${
      isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
    }`}>
      <div className="max-w-5xl mx-auto">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold bg-[#00c4de]/10 text-[#00c4de] border border-[#00c4de]/20 mb-3">
              <Cpu size={16} />
              <span>Crowd-AI Survey Studio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t('survey.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              {t('survey.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/survey/history"
              className={`px-5 py-3 rounded-2xl text-sm font-bold border flex items-center gap-2.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 shadow-xs'
              }`}
            >
              <Clock size={18} />
              <span>{t('survey.btn_view_history')}</span>
            </Link>
          </div>
        </div>

        {/* Contributor Reward Highlight Box */}
        <div className={`mb-10 p-6 rounded-[28px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
          isDark
            ? 'bg-gradient-to-r from-[#00c4de]/10 via-[#00c4de]/5 to-transparent border-[#00c4de]/20'
            : 'bg-gradient-to-r from-[#007b8b]/10 via-[#007b8b]/5 to-transparent border-[#007b8b]/20'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-[#00c4de]/20 text-[#00c4de]' : 'bg-[#007b8b]/20 text-[#007b8b]'}`}>
              <Coins size={28} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>{t('survey.reward_banner_title')}</span>
                <Sparkle size={16} className="text-amber-400" />
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 mt-1 leading-relaxed">
                {t('survey.reward_banner_desc')}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs sm:text-sm text-gray-400 block font-medium">{t('survey.your_balance')}</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{user?.credits || 0} Credits</span>
          </div>
        </div>

        {/* Upload Mode Selector */}
        <div className={`flex rounded-2xl p-2 mb-8 border max-w-lg ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          <button
            type="button"
            onClick={() => {
              setMode('video_gpx')
              setUploadSuccess(false)
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              mode === 'video_gpx'
                ? isDark
                  ? 'bg-[#00c4de] text-black shadow-md'
                  : 'bg-[#007b8b] text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <VideoCamera size={18} />
            <span>{t('survey.mode_video_gpx')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('photo_gps')
              setUploadSuccess(false)
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              mode === 'photo_gps'
                ? isDark
                  ? 'bg-[#00c4de] text-black shadow-md'
                  : 'bg-[#007b8b] text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Camera size={18} />
            <span>{t('survey.mode_photo_gps')}</span>
          </button>
        </div>

        {/* Main Upload Form */}
        <div className={`p-6 sm:p-10 rounded-[28px] border shadow-xl ${
          isDark ? 'bg-[#061417]/90 border-white/10' : 'bg-white border-gray-200'
        }`}>
          {uploadSuccess ? (
            <div className="text-center py-12 space-y-5">
              <div className="w-18 h-18 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle size={42} />
              </div>
              <h3 className="text-2xl font-bold">{t('survey.upload_success_title')}</h3>
              <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
                {t('survey.upload_success_desc')}
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setUploadSuccess(false)
                    setTripName('')
                    setVideoFile(null)
                    setGpxFile(null)
                    setPhotoFile(null)
                  }}
                  className={`px-5 py-3 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                    isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {t('survey.btn_upload_another')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/survey/history')}
                  className={`px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                    isDark ? 'bg-[#00c4de] text-black hover:bg-[#38dbf1]' : 'bg-[#007b8b] text-white hover:bg-[#00606d]'
                  }`}
                >
                  <span>{t('survey.btn_view_telemetry')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-8">
              {error && (
                <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
                  <WarningCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* Trip Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-400 mb-2">
                    {t('survey.lbl_trip_name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    placeholder="Ví dụ: Khảo sát Võ Văn Kiệt - Sáng"
                    className={`w-full px-4 py-3 text-sm sm:text-base rounded-2xl border outline-none transition-colors ${
                      isDark ? 'bg-white/5 border-white/10 focus:border-[#00c4de] text-white' : 'bg-white border-gray-300 focus:border-[#007b8b] text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-400 mb-2">
                    {t('survey.lbl_route_corridor')}
                  </label>
                  <input
                    type="text"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    placeholder="Ví dụ: Quận 1 sang Quận 5, TP.HCM"
                    className={`w-full px-4 py-3 text-sm sm:text-base rounded-2xl border outline-none transition-colors ${
                      isDark ? 'bg-white/5 border-white/10 focus:border-[#00c4de] text-white' : 'bg-white border-gray-300 focus:border-[#007b8b] text-gray-900'
                    }`}
                  />
                </div>
              </div>
              {/* Upload Dropzones */}
              {mode === 'video_gpx' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Video Dropzone */}
                  <div className={`p-8 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center transition-all ${
                    videoFile
                      ? isDark
                        ? 'border-[#00c4de] bg-[#00c4de]/5'
                        : 'border-[#007b8b] bg-[#007b8b]/5'
                      : isDark
                      ? 'border-white/15 bg-white/[0.02] hover:border-white/30'
                      : 'border-gray-300 bg-gray-50/50 hover:border-gray-400'
                  }`}>
                    <VideoCamera size={36} className={videoFile ? (isDark ? 'text-[#00c4de]' : 'text-[#007b8b]') : 'text-gray-400'} />
                    <span className="text-sm font-bold mt-3">
                      {videoFile ? videoFile.name : t('survey.drop_video_title')}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">Định dạng MP4, MOV tối đa 2GB (1080p/4K)</span>
                    <label className={`mt-4 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                      isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}>
                      <span>Chọn Video từ máy</span>
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && setVideoFile(e.target.files[0])}
                      />
                    </label>
                  </div>

                  {/* GPX Dropzone */}
                  <div className={`p-8 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center transition-all ${
                    gpxFile
                      ? isDark
                        ? 'border-[#00c4de] bg-[#00c4de]/5'
                        : 'border-[#007b8b] bg-[#007b8b]/5'
                      : isDark
                      ? 'border-white/15 bg-white/[0.02] hover:border-white/30'
                      : 'border-gray-300 bg-gray-50/50 hover:border-gray-400'
                  }`}>
                    <MapPin size={36} className={gpxFile ? (isDark ? 'text-[#00c4de]' : 'text-[#007b8b]') : 'text-gray-400'} />
                    <span className="text-sm font-bold mt-3">
                      {gpxFile ? gpxFile.name : t('survey.drop_gpx_title')}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">File .GPX có timestamp và tọa độ GPS</span>
                    <label className={`mt-4 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                      isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}>
                      <span>Chọn file GPX</span>
                      <input
                        type="file"
                        accept=".gpx,application/gpx+xml"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && setGpxFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Photo Dropzone */}
                  <div className={`p-10 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center transition-all ${
                    photoFile
                      ? isDark
                        ? 'border-[#00c4de] bg-[#00c4de]/5'
                        : 'border-[#007b8b] bg-[#007b8b]/5'
                      : isDark
                      ? 'border-white/15 bg-white/[0.02] hover:border-white/30'
                      : 'border-gray-300 bg-gray-50/50 hover:border-gray-400'
                  }`}>
                    <Camera size={42} className={photoFile ? (isDark ? 'text-[#00c4de]' : 'text-[#007b8b]') : 'text-gray-400'} />
                    <span className="text-sm sm:text-base font-bold mt-3">
                      {photoFile ? photoFile.name : t('survey.drop_photo_title')}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">Ảnh JPEG, PNG rõ nét và có nhãn biển báo</span>
                    <label className={`mt-4 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                      isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}>
                      <span>Chọn ảnh từ thiết bị</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && setPhotoFile(e.target.files[0])}
                      />
                    </label>
                  </div>

                  {/* Manual Coordinates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-gray-400 mb-1.5">Vĩ độ (Latitude)</label>
                      <input
                        type="text"
                        value={photoLat}
                        onChange={(e) => setPhotoLat(e.target.value)}
                        className={`w-full px-4 py-3 text-sm rounded-xl border outline-none ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-gray-400 mb-1.5">Kinh độ (Longitude)</label>
                      <input
                        type="text"
                        value={photoLng}
                        onChange={(e) => setPhotoLng(e.target.value)}
                        className={`w-full px-4 py-3 text-sm rounded-xl border outline-none ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm font-mono font-bold">
                    <span className="text-gray-400">{t('survey.btn_uploading')}</span>
                    <span className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'}>{uploadProgress}%</span>
                  </div>
                  <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div
                      className={`h-full transition-all duration-300 ${
                        isDark ? 'bg-[#00c4de]' : 'bg-[#007b8b]'
                      }`}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`w-full py-4 font-bold text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/25'
                      : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/25'
                  }`}
                >
                  <UploadSimple size={20} />
                  <span>{isUploading ? t('survey.btn_uploading') : t('survey.btn_submit_survey')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
