import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CaretRight,
  WarningOctagon,
  User,
  FileText,
  ClockCounterClockwise,
  Prohibit,
  ArrowsClockwise,
  CheckCircle,
  FileImage,
  ArrowSquareOut,
  ShieldCheck,
} from '@phosphor-icons/react'

export default function CandidateDetailPage() {
  const { t } = useTranslation('ops')
  const { id } = useParams<{ id: string }>()
  const reportId = id ? `Hồ sơ #${id}` : 'Hồ sơ #RC-8924-A'

  const [currentStatus, setCurrentStatus] = useState<string>('Đang xem xét')
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  function handleAction(action: string) {
    if (action === 'reject') {
      setCurrentStatus('Đã từ chối & Gỡ bỏ')
      setActionNotice('Hồ sơ ứng viên đã bị từ chối và gỡ bỏ khỏi hệ thống.')
    } else if (action === 'resurvey') {
      setCurrentStatus('Đã yêu cầu khảo sát lại')
      setActionNotice('Yêu cầu tái khảo sát đã được gửi đến đội ngũ kiểm tra thực địa.')
    } else if (action === 'approve') {
      setCurrentStatus('Đã phê duyệt & Xóa cờ')
      setActionNotice('Bản ghi đã được duyệt hợp lệ và các cờ cảnh báo đã được gỡ bỏ.')
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link
          to="/candidates"
          className="hover:text-[#007b8b] dark:hover:text-[#00c4de] transition-colors"
        >
          {t('candidate_detail.breadcrumb')}
        </Link>
        <CaretRight size={12} />
        <span className="text-gray-900 dark:text-white font-bold font-mono">{reportId}</span>
      </nav>

      {/* Page Title & Priority Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E4E3] dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('candidate_detail.title')}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-[#fee2e2] text-[#b91c1c] dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30 uppercase tracking-wider">
              <WarningOctagon size={14} weight="fill" /> {t('candidate_detail.priority_high')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              Trạng thái: <strong className="text-gray-900 dark:text-white">{currentStatus}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleAction('reject')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/25 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Prohibit size={15} />
            <span>{t('candidate_detail.btn_reject')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleAction('resurvey')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <ArrowsClockwise size={15} />
            <span>{t('candidate_detail.btn_resurvey')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleAction('approve')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <CheckCircle size={15} weight="bold" />
            <span>{t('candidate_detail.btn_approve')}</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <ShieldCheck size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Grid: 8 Cols Left (Evidence + Details) + 4 Cols Right (Profile + Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Violation Details */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText size={20} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>Nội dung cảnh báo & Chi tiết vi phạm</span>
            </h2>

            <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-500/20 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-red-900 dark:text-red-300 mb-1">
                Lý do gắn cờ tự động (AI Quality Gate):
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                Độ lệch tọa độ GPS vượt quá 45 mét so với vị trí biển báo gốc trên cơ sở dữ liệu đường bộ QCVN 41. Ảnh chụp đính kèm có dấu hiệu qua xử lý phần mềm hoặc tái sử dụng từ khảo sát trước đó.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F8F7F7] dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 font-mono text-[11px] uppercase">Mã biển báo gốc</span>
                <p className="font-bold text-gray-900 dark:text-white font-mono text-sm">P.102 (Cấm đi ngược chiều)</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8F7F7] dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 font-mono text-[11px] uppercase">Tọa độ phản ánh</span>
                <p className="font-bold text-gray-900 dark:text-white font-mono text-sm">10.7769° N, 106.7009° E</p>
              </div>
            </div>
          </div>

          {/* Card: Attached Evidence */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FileImage size={20} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>Bằng chứng hình ảnh & Tệp đính kèm</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 group">
                <div className="aspect-video bg-gray-100 dark:bg-black relative">
                  <img
                    src="https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80"
                    alt="Evidence 1"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
                    Ảnh 1: Hiện trường biển báo
                  </span>
                </div>
                <div className="p-3 bg-[#F8F7F7] dark:bg-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">evidence_cam_01.jpg</span>
                  <a
                    href="#"
                    className="text-[#007b8b] dark:text-[#00c4de] hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    Xem gốc <ArrowSquareOut size={12} />
                  </a>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 group">
                <div className="aspect-video bg-gray-100 dark:bg-black relative">
                  <img
                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80"
                    alt="Evidence 2"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
                    Ảnh 2: Tọa độ đối chiếu GIS
                  </span>
                </div>
                <div className="p-3 bg-[#F8F7F7] dark:bg-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">gps_telemetry.png</span>
                  <a
                    href="#"
                    className="text-[#007b8b] dark:text-[#00c4de] hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    Xem gốc <ArrowSquareOut size={12} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-6 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
              <User size={18} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>Đối tượng khảo sát</span>
            </h2>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#dcfce7] text-[#15803d] font-bold text-base flex items-center justify-center">
                TH
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Trần Hoàng Long</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">Khảo sát viên Cấp 2</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs border-t border-gray-100 dark:border-white/10 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Điểm uy tín (Trust Score):</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">92.4%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tổng lượt khảo sát:</span>
                <span className="font-bold font-mono text-gray-900 dark:text-white">148 lượt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tỷ lệ chính xác:</span>
                <span className="font-bold font-mono text-gray-900 dark:text-white">96.8%</span>
              </div>
            </div>
          </div>

          {/* Audit History Log */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-6 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
              <ClockCounterClockwise size={18} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>Nhật ký xử lý hồ sơ</span>
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="border-l-2 border-[#007b8b] dark:border-[#00c4de] pl-3 py-0.5">
                <p className="font-bold text-gray-900 dark:text-white">Đã tiếp nhận hồ sơ</p>
                <p className="text-gray-500 dark:text-gray-400 text-[11px]">Hệ thống AI Quality Gate • 14:20 24/10</p>
              </div>
              <div className="border-l-2 border-amber-400 pl-3 py-0.5">
                <p className="font-bold text-gray-900 dark:text-white">Gắn cờ cảnh báo cấp 2</p>
                <p className="text-gray-500 dark:text-gray-400 text-[11px]">Tự động gắn cờ độ lệch GPS • 14:22 24/10</p>
              </div>
              <div className="border-l-2 border-gray-300 dark:border-white/20 pl-3 py-0.5">
                <p className="font-bold text-gray-900 dark:text-white">Đang xem xét thẩm định</p>
                <p className="text-gray-500 dark:text-gray-400 text-[11px]">Chuyên viên vận hành • Hiện tại</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
