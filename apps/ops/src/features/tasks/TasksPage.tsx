import { useState } from 'react'
import {
  MapPin,
  Clock,
  CheckCircle,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { mockRevalidationTasks, type RevalidationTask } from '@/data'

export default function TasksPage() {
  const [tasks] = useState<RevalidationTask[]>(mockRevalidationTasks)
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  function handleAction(taskId: string, action: string) {
    setToast(`Nhiệm vụ ${taskId} đã được cập nhật: ${action}.`)
    setTimeout(() => setToast(null), 3000)
  }

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.signName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeTab === 'critical') return matchesSearch && t.freshnessStatus === 'Critical'
    if (activeTab === 'pending') return matchesSearch && t.submittedEvidenceCount > 0
    return matchesSearch
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Vùng khảo sát & Tái xác thực
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi biển báo hết hạn độ tươi mới (Stale Signs) và thẩm định bằng chứng khảo sát từ cộng đồng.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc địa điểm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-[#061115] border border-[#E8E4E3] dark:border-white/15 rounded-lg focus:outline-none focus:border-[#00c4de] shadow-xs"
          />
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#E8E4E3] dark:border-white/10 flex gap-6 text-xs sm:text-sm font-semibold">
        {(
          [
            { id: 'all', label: 'Tất cả nhiệm vụ', count: tasks.length },
            { id: 'critical', label: 'Hết hạn nghiêm trọng', count: 1 },
            { id: 'pending', label: 'Có bằng chứng chờ duyệt', count: 3 },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === t.id
                ? 'border-[#007b8b] text-[#007b8b] dark:border-[#00c4de] dark:text-[#00c4de]'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <span>{t.label}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === t.id
                ? 'bg-[#d3f7ff] text-[#007b8b] dark:bg-[#00c4de]/20 dark:text-[#00c4de]'
                : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E8E4E3] dark:border-white/10 bg-[#F8F7F7]/60 dark:bg-[#061014] text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono">
                <th className="py-4 px-6">Mã nhiệm vụ</th>
                <th className="py-4 px-6">Biển báo mục tiêu</th>
                <th className="py-4 px-6">Vị trí thực địa</th>
                <th className="py-4 px-6">Độ tươi mới</th>
                <th className="py-4 px-6 text-center">Thưởng (Điểm)</th>
                <th className="py-4 px-6 text-center">Bằng chứng</th>
                <th className="py-4 px-6 text-right">Thao tác xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3] dark:divide-white/10">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-[#F8F7F7]/50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-900 dark:text-white font-mono text-xs">
                    {t.id}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-gray-900 dark:text-white">{t.signCode}</span> - {t.signName}
                  </td>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={15} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                      <span>{t.location}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock size={15} className="text-amber-500 shrink-0" weight="bold" />
                      <span className="text-amber-600 dark:text-amber-400 font-mono font-medium">{t.lastVerifiedDate}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                    +{t.rewardCredits}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#dbeafe] text-[#1d4ed8] dark:bg-cyan-500/15 dark:text-[#00c4de] dark:border dark:border-cyan-500/30">
                      {t.submittedEvidenceCount} tệp đính kèm
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleAction(t.id, 'Đã phê duyệt bằng chứng mới')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer text-xs"
                    >
                      Duyệt bằng chứng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(t.id, 'Đã yêu cầu khảo sát lại')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all active:scale-95 cursor-pointer text-xs border border-gray-200 dark:border-white/10"
                    >
                      Tái phân công
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
