import React from 'react'
import {
  X,
  Keyboard,
  CheckCircle,
  XCircle,
  BookOpen,
  ArrowBendUpRight,
  Flag,
  ArrowUUpLeft,
  ArrowsLeftRight,
  Eye,
  MapPin,
  Sparkle,
} from '@phosphor-icons/react'
import { Modal } from '@/components/common/Modal'

export interface ReviewGuideModalProps {
  isOpen: boolean
  onClose: () => void
  isDark: boolean
}

export const ReviewGuideModal: React.FC<ReviewGuideModalProps> = ({
  isOpen,
  onClose,
  isDark,
}) => {
  if (!isOpen) return null

  const workflowSteps = [
    {
      step: '1',
      title: 'Quan sát & Đối chiếu ảnh',
      desc: 'Xem ảnh chi tiết (vết cắt biển báo) và ảnh toàn cảnh dashcam để đối chiếu với loại biển báo AI đang dự đoán.',
      icon: Eye,
      colorClass: 'text-[#007b8b] dark:text-[#00c4de]',
      bgClass: 'bg-[#007b8b]/10 dark:bg-[#00c4de]/10 border-[#007b8b]/20 dark:border-[#00c4de]/20',
    },
    {
      step: '2',
      title: 'Kiểm tra vị trí trên bản đồ',
      desc: 'Xác minh tọa độ GPS và tuyến đường khảo sát trên bản đồ số để đảm bảo biển báo nằm đúng vị trí lưu thông.',
      icon: MapPin,
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      step: '3',
      title: 'Xác nhận hoặc Sửa biển báo',
      desc: 'Bấm Duyệt nếu AI nhận diện đúng; nếu AI đoán nhầm, chọn nhanh mã biển hoặc tra cứu danh mục QCVN 41 để sửa.',
      icon: Sparkle,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    },
  ]

  const hotkeysList = [
    {
      keys: ['4'],
      label: 'Duyệt',
      desc: 'Xác nhận biển báo do AI nhận diện là chính xác',
      icon: CheckCircle,
      accentClass: 'text-[#007b8b] dark:text-[#00c4de]',
    },
    {
      keys: ['3'],
      label: 'Từ chối',
      desc: 'Mở hộp thoại chọn lý do từ chối như không có biển, ảnh quá mờ',
      icon: XCircle,
      accentClass: 'text-red-500 dark:text-red-400',
    },
    {
      keys: ['2'],
      label: 'Danh mục',
      desc: 'Mở bảng tra cứu toàn bộ 417 biển báo chuẩn QCVN 41',
      icon: BookOpen,
      accentClass: 'text-blue-500 dark:text-blue-400',
    },
    {
      keys: ['1'],
      label: 'Bỏ qua',
      desc: 'Chuyển sang ca tiếp theo mà không lưu đánh giá',
      icon: ArrowBendUpRight,
      accentClass: 'text-gray-500 dark:text-gray-400',
    },
    {
      keys: ['E'],
      label: 'Báo lỗi',
      desc: 'Gắn cờ báo cáo sai lệch tọa độ GPS, ảnh gian lận hoặc lỗi kỹ thuật',
      icon: Flag,
      accentClass: 'text-amber-500 dark:text-amber-400',
    },
    {
      keys: ['Space'],
      label: 'Đổi góc nhìn',
      desc: 'Chuyển đổi giữa ảnh chi tiết và ảnh toàn cảnh dashcam',
      icon: ArrowsLeftRight,
      accentClass: 'text-purple-500 dark:text-purple-400',
    },
    {
      keys: ['Ctrl + Z'],
      label: 'Hoàn tác',
      desc: 'Thu hồi quyết định đánh giá của ca biển báo gần nhất',
      icon: ArrowUUpLeft,
      accentClass: 'text-gray-500 dark:text-gray-400',
    },
    {
      keys: ['?'],
      label: 'Trợ giúp',
      desc: 'Mở lại bảng hướng dẫn và danh sách phím tắt này bất kỳ lúc nào',
      icon: Keyboard,
      accentClass: 'text-[#007b8b] dark:text-[#00c4de]',
    },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" topSpacing="pt-8 sm:pt-12">
      <div
        className={`rounded-2xl border p-6 sm:p-7 space-y-6 shadow-2xl transition-colors text-left ${
          isDark
            ? 'bg-[#071317] border-white/10 text-gray-100 shadow-black/80'
            : 'bg-white border-gray-200 text-gray-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                isDark
                  ? 'bg-[#00c4de]/10 border-[#00c4de]/20 text-[#00c4de]'
                  : 'bg-[#007b8b]/10 border-[#007b8b]/20 text-[#007b8b]'
              }`}
            >
              <Keyboard size={22} weight="bold" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white leading-snug">
                Hướng dẫn thẩm định & Phím tắt
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Quy trình chuẩn và thao tác phím tắt nhanh cho cộng tác viên thẩm định
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400 hover:text-white'
                : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Section 1: Workflow Steps */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Quy trình thẩm định biển báo
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {workflowSteps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.step}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 transition-colors ${
                    isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-white/10 text-xs font-mono font-bold flex items-center justify-center text-gray-700 dark:text-gray-300">
                      {step.step}
                    </span>
                    <Icon size={18} className={step.colorClass} weight="bold" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                      {step.title}
                    </h5>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 2: Hotkeys Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Phím tắt thao tác nhanh
            </h4>
            <span className="text-[11px] font-mono text-gray-400">Không cần bấm chuột</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {hotkeysList.map((hk, idx) => {
              const Icon = hk.icon
              return (
                <div
                  key={idx}
                  className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Icon size={16} className={`shrink-0 ${hk.accentClass}`} weight="bold" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                        {hk.label}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        {hk.desc}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {hk.keys.map((k) => (
                      <kbd
                        key={k}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border shadow-2xs ${
                          isDark
                            ? 'bg-black/60 border-white/15 text-gray-200'
                            : 'bg-white border-gray-200 text-gray-800'
                        }`}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isDark
                ? 'bg-[#00c4de] hover:bg-[#00b2ca] text-gray-950'
                : 'bg-[#007b8b] hover:bg-[#006876] text-white'
            }`}
          >
            Đã hiểu, bắt đầu thẩm định
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ReviewGuideModal
