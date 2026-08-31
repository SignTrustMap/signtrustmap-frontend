import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MapTrifold,
  WarningOctagon,
  ArrowsClockwise,
  CheckCircle,
  X,
  Compass,
} from '@phosphor-icons/react'
import { mockSpatialSigns, type SpatialSignRecord } from '@/data/adminGovernanceData'

export default function SpatialOverridesPage() {
  const { t } = useTranslation('ops')

  const [signs, setSigns] = useState<SpatialSignRecord[]>(mockSpatialSigns)
  const [selectedSign, setSelectedSign] = useState<SpatialSignRecord | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [newHeading, setNewHeading] = useState<number>(0)
  const [newLat, setNewLat] = useState<number>(0)
  const [newLng, setNewLng] = useState<number>(0)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  function handleOpenModal(sign: SpatialSignRecord) {
    setSelectedSign(sign)
    setNewHeading(sign.headingDeg)
    setNewLat(sign.lat)
    setNewLng(sign.lng)
    setOverrideReason('')
  }

  function handleSaveOverride(e: React.FormEvent) {
    e.preventDefault()
    if (!overrideReason.trim()) {
      showToast(t('spatial.toast_reason_required'))
      return
    }
    if (!selectedSign) return

    setSigns((prev) =>
      prev.map((s) =>
        s.id === selectedSign.id
          ? {
              ...s,
              lat: newLat,
              lng: newLng,
              headingDeg: newHeading,
              status: 'Verified',
            }
          : s
      )
    )

    showToast(t('spatial.toast_overridden', { id: selectedSign.id }))
    setSelectedSign(null)
  }

  function handleDeleteMalicious(signId: string) {
    setSigns((prev) => prev.filter((s) => s.id !== signId))
    showToast(t('spatial.toast_deleted', { id: signId }))
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E4E3] dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider mb-1">
            <MapTrifold size={16} weight="bold" />
            <span>{t('spatial.tag')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('spatial.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('spatial.subtitle')}
          </p>
        </div>
      </div>

      {toastMsg && (
        <div
          onClick={() => setToastMsg(null)}
          className="fixed top-20 right-8 z-50 bg-[#007b8b] text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#00606d] transition-all active:scale-95 select-none"
          title="Bấm để đóng thông báo"
        >
          <CheckCircle size={16} weight="bold" />
          <span>{toastMsg}</span>
          <span className="ml-2 text-white/70 hover:text-white text-xs font-bold font-sans">✕</span>
        </div>
      )}

      {/* Spatial Signs Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{t('spatial.th_id_code')}</th>
                <th className="py-3 px-4 font-semibold">{t('spatial.th_coords')}</th>
                <th className="py-3 px-4 font-semibold">{t('spatial.th_heading')}</th>
                <th className="py-3 px-4 font-semibold">{t('spatial.th_road')}</th>
                <th className="py-3 px-4 font-semibold">{t('spatial.th_status')}</th>
                <th className="py-3 px-4 font-semibold text-center">{t('spatial.th_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {signs.map((sign) => (
                <tr key={sign.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-gray-900 dark:text-white block">{sign.id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#007b8b]/10 text-[#007b8b] dark:text-[#00c4de]">
                      {sign.signCode} - {sign.signName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="text-gray-900 dark:text-white font-bold">{sign.lat.toFixed(5)}, {sign.lng.toFixed(5)}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold">
                      <Compass size={15} />
                      <span>{sign.headingDeg}°</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                    <p className="font-medium">{sign.roadName}</p>
                    <span className="text-gray-400 font-mono text-[10px]">{sign.direction}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {sign.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(sign)}
                        className="px-2.5 py-1 bg-[#007b8b]/10 hover:bg-[#007b8b]/20 text-[#007b8b] dark:text-[#00c4de] rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowsClockwise size={13} />
                        <span>{t('spatial.btn_override')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMalicious(sign.id)}
                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <WarningOctagon size={13} />
                        <span>{t('spatial.btn_delete')}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {selectedSign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t('spatial.modal_title')}
              </h3>
              <button type="button" onClick={() => setSelectedSign(null)} className="text-gray-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                <span className="text-gray-400 font-mono text-[10px] block">{t('spatial.lbl_target')}</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedSign.id} • {selectedSign.signName}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono font-bold text-gray-500">{t('spatial.lbl_lat')}</label>
                  <input
                    type="number"
                    step="0.00001"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono font-bold text-gray-500">{t('spatial.lbl_lng')}</label>
                  <input
                    type="number"
                    step="0.00001"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono font-bold text-gray-500">{t('spatial.lbl_heading')}</label>
                <input
                  type="number"
                  min={0}
                  max={360}
                  required
                  value={newHeading}
                  onChange={(e) => setNewHeading(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono font-bold text-red-500 uppercase">{t('spatial.lbl_justification')}</label>
                <textarea
                  required
                  rows={2}
                  placeholder={t('spatial.placeholder_justification')}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedSign(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-semibold cursor-pointer"
                >
                  {t('spatial.btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {t('spatial.btn_confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
