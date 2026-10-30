import { useToast } from '@/context/ToastContext'
import {
  CheckCircle,
  ShieldCheck,
  RocketLaunch,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'

interface CandidateEvaluationTabProps {
  activeModelVersion: string
  setActiveModelVersion: React.Dispatch<React.SetStateAction<string>>
  candidateModelVersion: string
  candidateStatus: 'pending_review' | 'promoted' | 'rejected'
  setCandidateStatus: React.Dispatch<React.SetStateAction<'pending_review' | 'promoted' | 'rejected'>>
}

export function CandidateEvaluationTab({
  activeModelVersion,
  setActiveModelVersion,
  candidateModelVersion,
  candidateStatus,
  setCandidateStatus,
}: CandidateEvaluationTabProps) {
  const toast = useToast()

  return (
    <div className="space-y-6 text-left">
      {/* Automated Lifecycle Status Banner */}
      <div className="p-5 rounded-2xl border bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-transparent border-[#007b8b]/20 dark:border-[#00c4de]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#007b8b] dark:text-[#00c4de]">
              MLOps Automated Retraining Lifecycle
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Đánh giá So sánh Ứng viên & Kiểm soát Triển khai Mô hình
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
            Theo quy trình vận hành SignTrustMap, chu trình huấn luyện lại chạy tự động khi tích lũy đủ dữ liệu
            biên và ca kiểm duyệt từ Reviewer. Quản trị viên (Admin) xem xét bảng so sánh thực nghiệm và ra quyết
            định phê duyệt triển khai vào sản xuất (SoD Enforcement).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/20 text-xs font-mono">
            <span className="text-gray-400">Trạng thái: </span>
            <span className="font-bold text-emerald-400">Tự động kích hoạt (Auto-trigger)</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Model Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Model Card */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0A171C] border-[#E8E4E3] dark:border-white/10 shadow-xs space-y-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Phiên bản Hiện hành (Production)
              </span>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-1.5 font-mono">
                {activeModelVersion}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                YOLOv11x Detector + CLIP Zero-shot Re-ranker
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle size={14} weight="fill" />
              <span>Live Active</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">mAP@0.5</span>
              <span className="text-lg font-extrabold font-mono text-gray-900 dark:text-white">93.8%</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">mAP@50:95</span>
              <span className="text-lg font-extrabold font-mono text-gray-900 dark:text-white">78.4%</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Precision</span>
              <span className="text-lg font-extrabold font-mono text-gray-900 dark:text-white">94.2%</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Recall</span>
              <span className="text-lg font-extrabold font-mono text-gray-900 dark:text-white">92.1%</span>
            </div>
          </div>

          {/* Telemetry info */}
          <div className="space-y-2 text-xs font-mono border-t border-gray-100 dark:border-white/10 pt-4 text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Độ trễ suy luận (Latency):</span>
              <span className="font-bold text-gray-900 dark:text-white">18.2 ms (TensorRT FP16)</span>
            </div>
            <div className="flex justify-between">
              <span>Kích thước tập huấn luyện:</span>
              <span className="font-bold text-gray-900 dark:text-white">42,500 mẫu gán nhãn</span>
            </div>
            <div className="flex justify-between">
              <span>Tệp trọng số:</span>
              <span className="truncate max-w-[200px] text-gray-500">best_yolov11x_v2.3_prod.pt</span>
            </div>
          </div>
        </div>

        {/* Candidate Model Card */}
        <div
          className={`p-6 rounded-2xl border shadow-xs space-y-5 relative transition-all ${
            candidateStatus === 'promoted'
              ? 'bg-emerald-500/5 border-emerald-500/30'
              : candidateStatus === 'rejected'
              ? 'bg-red-500/5 border-red-500/30 opacity-75'
              : 'bg-white dark:bg-[#0A171C] border-[#007b8b]/40 dark:border-[#00c4de]/40 ring-1 ring-[#007b8b]/20 dark:ring-[#00c4de]/20'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Ứng viên Tự động Huấn luyện (Candidate)
              </span>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-1.5 font-mono">
                {candidateModelVersion}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Retrained với 3,300 mẫu biên từ Active Learning & Reviewer Consensus
              </p>
            </div>

            <div>
              {candidateStatus === 'promoted' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Đã Phê duyệt & Triển khai
                </span>
              ) : candidateStatus === 'rejected' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                  Đã Từ chối (Lưu kho)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                  Chờ Admin Quyết định
                </span>
              )}
            </div>
          </div>

          {/* Metrics Grid with Green Deltas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">mAP@0.5</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">95.6%</span>
                <span className="text-[10px] font-bold text-emerald-500">+1.8%</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">mAP@50:95</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">81.2%</span>
                <span className="text-[10px] font-bold text-emerald-500">+2.8%</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Precision</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">95.8%</span>
                <span className="text-[10px] font-bold text-emerald-500">+1.6%</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Recall</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">94.0%</span>
                <span className="text-[10px] font-bold text-emerald-500">+1.9%</span>
              </div>
            </div>
          </div>

          {/* Telemetry info */}
          <div className="space-y-2 text-xs font-mono border-t border-gray-100 dark:border-white/10 pt-4 text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Độ trễ suy luận (Latency):</span>
              <span className="font-bold text-gray-900 dark:text-white">18.5 ms (+0.3ms - Đạt SLA)</span>
            </div>
            <div className="flex justify-between">
              <span>Kích thước tập huấn luyện:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">45,800 mẫu (+3,300 ca mới)</span>
            </div>
            <div className="flex justify-between">
              <span>Tệp trọng số:</span>
              <span className="truncate max-w-[200px] text-gray-500">candidate_yolov11x_v2.4_epoch120.pt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Class-specific Accuracy Breakdown */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-[#0A171C] border-[#E8E4E3] dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Hiệu năng Cải thiện trên các Lớp Biển báo Khó (Challenging Classes)
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Đo lường trên tập kiểm thử độc lập gồm các ca chụp đêm, ngược sáng và bị che khuất một phần.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex justify-between font-bold mb-1">
              <span>W.201 (Quanh co nguy hiểm)</span>
              <span className="text-emerald-500">+5.9%</span>
            </div>
            <div className="text-gray-500">v2.3: 88.2% ➔ v2.4: 94.1%</div>
          </div>
          <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex justify-between font-bold mb-1">
              <span>P.102 (Cấm đi ngược chiều)</span>
              <span className="text-emerald-500">+5.3%</span>
            </div>
            <div className="text-gray-500">v2.3: 91.0% ➔ v2.4: 96.3%</div>
          </div>
          <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex justify-between font-bold mb-1">
              <span>R.301a (Hướng phải theo)</span>
              <span className="text-emerald-500">+5.9%</span>
            </div>
            <div className="text-gray-500">v2.3: 86.5% ➔ v2.4: 92.4%</div>
          </div>
          <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex justify-between font-bold mb-1">
              <span>P.127 (Biển tốc độ nghiêng)</span>
              <span className="text-emerald-500">+5.6%</span>
            </div>
            <div className="text-gray-500">v2.3: 89.4% ➔ v2.4: 95.0%</div>
          </div>
        </div>
      </div>

      {/* Admin Governed Actions Bar */}
      <div className="p-5 rounded-2xl border bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs">
          <ShieldCheck size={20} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
          <span className="text-gray-600 dark:text-gray-300">
            Đặc quyền Admin: Hành động triển khai hoặc hủy bỏ ứng viên sẽ được ghi nhận vào Nhật ký Kiểm toán (Audit Logs).
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {candidateStatus === 'pending_review' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setCandidateStatus('rejected')
                  toast.info('Đã từ chối triển khai ứng viên v2.4. Hệ thống tiếp tục duy trì v2.3.')
                }}
                className="px-4 py-2.5 text-xs font-bold rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                Từ chối Ứng viên
              </button>
              <button
                type="button"
                onClick={() => {
                  setCandidateStatus('promoted')
                  setActiveModelVersion('YOLOv11x-v2.4')
                  toast.success('Đã phê duyệt và kích hoạt triển khai mô hình ứng viên v2.4 lên Production!')
                }}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <RocketLaunch size={16} weight="bold" />
                <span>Phê duyệt & Triển khai vào Production</span>
              </button>
            </>
          ) : candidateStatus === 'promoted' ? (
            <button
              type="button"
              onClick={() => {
                setCandidateStatus('pending_review')
                setActiveModelVersion('YOLOv11x-v2.3')
                toast.warning('Đã thực hiện Rollback về phiên bản v2.3.')
              }}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowCounterClockwise size={15} weight="bold" />
              <span>Rollback về v2.3</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCandidateStatus('pending_review')
                toast.info('Đã mở lại quy trình đánh giá ứng viên v2.4.')
              }}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Mở lại Đánh giá
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
