import { useState } from 'react'
import {
  CheckCircle,
  MagnifyingGlass,
  ShieldWarning,
} from '@phosphor-icons/react'
import { mockCreditApprovals, type CreditApprovalItem } from '@/data'

export default function CreditsApprovalPage() {
  const [items, setItems] = useState<CreditApprovalItem[]>(mockCreditApprovals)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  function handleDecision(id: string, decision: 'Approved' | 'Rejected') {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: decision } : item))
    )
    setToast(
      decision === 'Approved'
        ? `Đã phê duyệt cộng ${items.find((i) => i.id === id)?.amount} điểm thưởng cho người dùng.`
        : `Đã từ chối cấp thưởng cho giao dịch ${id}.`
    )
    setTimeout(() => setToast(null), 3000)
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Duyệt thưởng & Điểm đóng góp
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kiểm soát chi trả điểm thưởng đóng góp của khảo sát viên và reviewer, phát hiện gian lận và farm điểm.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Tìm theo tên, email hoặc mã..."
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

      {/* Table */}
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E8E4E3] bg-[#F8F7F7]/60 text-[11px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                <th className="py-4 px-6">Mã giao dịch</th>
                <th className="py-4 px-6">Người nhận thưởng</th>
                <th className="py-4 px-6">Hoạt động đóng góp</th>
                <th className="py-4 px-6 text-center">Điểm yêu cầu</th>
                <th className="py-4 px-6">Mức độ rủi ro</th>
                <th className="py-4 px-6">Bằng chứng & Đánh giá</th>
                <th className="py-4 px-6 text-right">Quyết định</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3]">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8F7F7]/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-900 font-mono text-xs">
                    {item.id}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${item.user.avatarBg}`}
                      >
                        {item.user.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-bold text-gray-900 text-xs">{item.user.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{item.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-700 font-medium">
                    {item.activityType}
                  </td>
                  <td className="py-4 px-6 text-center font-bold font-mono text-emerald-700">
                    +{item.amount}
                  </td>
                  <td className="py-4 px-6">
                    {item.riskLevel === 'Thấp' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#dcfce7] text-[#15803d]">
                        An toàn
                      </span>
                    )}
                    {item.riskLevel === 'Cảnh báo gian lận' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#fee2e2] text-[#b91c1c] flex items-center gap-1 w-fit">
                        <ShieldWarning size={13} weight="bold" />
                        Gian lận
                      </span>
                    )}
                    {item.riskLevel === 'Nghi vấn' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#fef3c7] text-[#b45309]">
                        Nghi vấn
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-600 max-w-xs">
                    <p className="truncate">{item.evidenceSummary}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.createdAt}</p>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                    {item.status === 'Pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDecision(item.id, 'Approved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition-colors cursor-pointer text-xs"
                        >
                          Phê duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision(item.id, 'Rejected')}
                          className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-md transition-colors cursor-pointer text-xs"
                        >
                          Từ chối
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs font-bold ${item.status === 'Approved' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {item.status === 'Approved' ? '✓ Đã duyệt' : '✕ Đã từ chối'}
                      </span>
                    )}
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
