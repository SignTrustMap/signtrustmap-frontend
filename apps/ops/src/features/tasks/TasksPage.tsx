import { useState } from 'react'
import {
  MapPin,
  Clock,
  CheckCircle,
  MagnifyingGlass,
} from '@phosphor-icons/react'

export interface RevalidationTask {
  id: string
  signCode: string
  signName: string
  location: string
  lastVerifiedDate: string
  freshnessStatus: 'Stale' | 'Critical' | 'Pending Evidence'
  rewardCredits: number
  submittedEvidenceCount: number
  assignedSurveyor?: string
}

const mockTasks: RevalidationTask[] = [
  {
    id: 'TSK-9021',
    signCode: 'P.102',
    signName: 'Cấm đi ngược chiều',
    location: 'Số 124 Nguyễn Thái Học, Ba Đình, Hà Nội',
    lastVerifiedDate: '15/04/2023 (Quá hạn 16 tháng)',
    freshnessStatus: 'Critical',
    rewardCredits: 50,
    submittedEvidenceCount: 2,
    assignedSurveyor: 'Nguyễn Văn Hùng',
  },
  {
    id: 'TSK-9022',
    signCode: 'P.130',
    signName: 'Cấm dừng xe và đỗ xe',
    location: 'Ngã tư Lê Duẩn - Hai Bà Trưng, Quận 1, TP.HCM',
    lastVerifiedDate: '10/08/2023 (Quá hạn 12 tháng)',
    freshnessStatus: 'Stale',
    rewardCredits: 35,
    submittedEvidenceCount: 1,
  },
  {
    id: 'TSK-9023',
    signCode: 'W.207a',
    signName: 'Giao nhau với đường không ưu tiên',
    location: 'Km 18+200 Quốc lộ 1A, Đà Nẵng',
    lastVerifiedDate: '01/06/2023 (Quá hạn 14 tháng)',
    freshnessStatus: 'Pending Evidence',
    rewardCredits: 40,
    submittedEvidenceCount: 3,
    assignedSurveyor: 'Lê Hoàng Nam',
  },
]

export default function TasksPage() {
  const [tasks] = useState<RevalidationTask[]>(mockTasks)
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Vùng khảo sát & Tái xác thực
          </h1>
          <p className="text-sm text-gray-500 mt-1">
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
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b] shadow-xs"
          />
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={18} weight="fill" className="text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#E8E4E3] flex gap-6 text-xs sm:text-sm font-semibold">
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
                ? 'border-[#007b8b] text-[#007b8b]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>{t.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === t.id ? 'bg-[#d3f7ff] text-[#007b8b]' : 'bg-gray-100 text-gray-600'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E8E4E3] bg-[#F8F7F7]/60 text-[11px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                <th className="py-4 px-6">Mã nhiệm vụ</th>
                <th className="py-4 px-6">Biển báo mục tiêu</th>
                <th className="py-4 px-6">Vị trí thực địa</th>
                <th className="py-4 px-6">Độ tươi mới</th>
                <th className="py-4 px-6 text-center">Thưởng (Điểm)</th>
                <th className="py-4 px-6 text-center">Bằng chứng</th>
                <th className="py-4 px-6 text-right">Thao tác xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3]">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-[#F8F7F7]/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-900 font-mono text-xs">
                    {t.id}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-gray-900">{t.signCode}</span> - {t.signName}
                  </td>
                  <td className="py-4 px-6 text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={15} className="text-[#007b8b] shrink-0" />
                      <span>{t.location}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-xs">
                      <Clock size={14} className="text-amber-500" />
                      <span className="text-gray-600 font-mono">{t.lastVerifiedDate}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center font-bold text-emerald-700">
                    +{t.rewardCredits}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#dbeafe] text-[#1d4ed8]">
                      {t.submittedEvidenceCount} tệp đính kèm
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleAction(t.id, 'Đã phê duyệt bằng chứng mới')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-md transition-colors cursor-pointer text-xs"
                    >
                      Duyệt bằng chứng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(t.id, 'Đã yêu cầu khảo sát lại')}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors cursor-pointer text-xs"
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
