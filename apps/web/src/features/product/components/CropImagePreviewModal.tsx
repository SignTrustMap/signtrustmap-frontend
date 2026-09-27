import { X, Camera, ArrowSquareOut } from '@phosphor-icons/react'

interface CropImagePreviewModalProps {
  imageUrl: string | null
  onClose: () => void
  isDark: boolean
}

export function CropImagePreviewModal({ imageUrl, onClose, isDark }: CropImagePreviewModalProps) {
  if (!imageUrl) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className={`relative max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl border ${
          isDark ? 'bg-[#071317] border-white/10 text-white' : 'bg-white border-[#E8E4E3] text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Camera weight="bold" className="w-4 h-4 text-[#0671eb]" />
            <span>Ảnh thực địa từ camera hành trình</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Content */}
        <div className="p-4 flex items-center justify-center bg-black/20">
          <img
            src={imageUrl}
            alt="Ảnh thực địa camera"
            className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md"
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-inherit text-xs text-gray-500 dark:text-gray-400">
          <span>Hình ảnh được cắt tự động bởi mô hình AI từ video khảo sát</span>
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#0671eb] font-semibold hover:underline"
          >
            Mở ảnh gốc
            <ArrowSquareOut className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
