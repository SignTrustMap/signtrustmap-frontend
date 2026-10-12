import { useState } from 'react'
import { X, Crop, ImageSquare, MapPin, Compass, Calendar, DownloadSimple } from '@phosphor-icons/react'
import { Modal } from './Modal'

export interface ImageInspectionModalProps {
  isOpen: boolean
  onClose: () => void
  signName: string
  signCode: string
  actualCropUrl?: string
  scenePhotoUrl?: string
  lat?: number
  lng?: number
  heading?: number
  verifiedAt?: string
}

export function ImageInspectionModal({
  isOpen,
  onClose,
  signName,
  signCode,
  actualCropUrl,
  scenePhotoUrl,
  lat,
  lng,
  heading,
  verifiedAt,
}: ImageInspectionModalProps) {
  const [activeTab, setActiveTab] = useState<'crop' | 'scene'>('crop')

  const currentImageUrl = activeTab === 'crop'
    ? (actualCropUrl || scenePhotoUrl)
    : (scenePhotoUrl || actualCropUrl)

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
      <div className="bg-white dark:bg-[#0c181c] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-md bg-teal-50 dark:bg-[#00c4de]/10 border border-teal-200 dark:border-[#00c4de]/30 text-[#007b8b] dark:text-[#00c4de]">
              {signCode}
            </span>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                {signName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hình ảnh thực tế tại vị trí tọa độ GPS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* View Switcher Tabs (Crop vs Scene) */}
        {(actualCropUrl && scenePhotoUrl) && (
          <div className="flex items-center gap-2 px-5 pt-3 pb-1 border-b border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('crop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'crop'
                  ? 'bg-teal-50 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] border border-teal-200 dark:border-[#00c4de]/30'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
              }`}
            >
              <Crop size={14} weight="bold" />
              <span>Biển Báo (Crop)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scene')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'scene'
                  ? 'bg-teal-50 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] border border-teal-200 dark:border-[#00c4de]/30'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
              }`}
            >
              <ImageSquare size={14} weight="bold" />
              <span>Toàn Cảnh Hiện Trường (Scene)</span>
            </button>
          </div>
        )}

        {/* Image Preview Container */}
        <div className="relative flex-1 min-h-[280px] sm:min-h-[380px] bg-black/90 flex items-center justify-center p-2 overflow-hidden">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt={signName}
              className="max-h-[50vh] sm:max-h-[60vh] max-w-full object-contain rounded-lg shadow-inner"
            />
          ) : (
            <div className="text-gray-400 text-xs flex flex-col items-center gap-2">
              <ImageSquare size={36} />
              <span>Chưa có hình ảnh kiểm định thực tế tại tọa độ này</span>
            </div>
          )}

          {currentImageUrl && (
            <a
              href={currentImageUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-sm transition-colors text-xs flex items-center gap-1.5"
              title="Mở ảnh gốc trong tab mới"
            >
              <DownloadSimple size={15} />
              <span className="hidden sm:inline">Mở ảnh gốc</span>
            </a>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-300">
            {lat !== undefined && lng !== undefined && (
              <span className="flex items-center gap-1 font-mono">
                <MapPin size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
            )}
            {heading !== undefined && (
              <span className="flex items-center gap-1 font-mono">
                <Compass size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
                Góc hướng: {heading}°
              </span>
            )}
            {verifiedAt && (
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
                Thời gian: {verifiedAt}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  )
}
