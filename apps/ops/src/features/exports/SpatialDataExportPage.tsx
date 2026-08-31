import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DownloadSimple,
  CheckCircle,
  FileCode,
  FileCsv,
  MapPin,
  ClockCounterClockwise,
} from '@phosphor-icons/react'
import { mockExportHistory, type ExportHistoryRecord } from '@/data/adminGovernanceData'

export default function SpatialDataExportPage() {
  const { t, i18n } = useTranslation('ops')
  const isEn = i18n.language.startsWith('en')

  const [exportFormat, setExportFormat] = useState<'geojson' | 'shapefile' | 'csv' | 'osm'>('geojson')
  const [selectedCity, setSelectedCity] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [includeConfidence, setIncludeConfidence] = useState(true)
  const [history, setHistory] = useState<ExportHistoryRecord[]>(mockExportHistory)
  const [isExporting, setIsExporting] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  function handleStartExport() {
    setIsExporting(true)
    setTimeout(() => {
      const fmtLabelMap: Record<string, ExportHistoryRecord['format']> = {
        geojson: 'GeoJSON (RFC 7946)',
        shapefile: 'ESRI Shapefile (.shp)',
        csv: 'CSV',
        osm: 'OSM XML',
      }
      const newHistoryItem: ExportHistoryRecord = {
        id: `EXP-2026-0${history.length + 9}`,
        format: fmtLabelMap[exportFormat],
        region: selectedCity === 'all' ? (isEn ? 'Nationwide' : 'Toàn quốc') : selectedCity,
        totalFeatures: 2450,
        fileSize: '4.2 MB',
        exportedBy: 'admin@signtrustmap.site',
        createdAt: isEn ? 'Just now' : 'Vừa xong',
      }
      setHistory([newHistoryItem, ...history])
      setIsExporting(false)
      showToast(t('exports.toast_exported', { id: newHistoryItem.id }))
    }, 1200)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E4E3] dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider mb-1">
            <DownloadSimple size={16} weight="bold" />
            <span>{t('exports.tag')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('exports.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('exports.subtitle')}
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

      {/* Export Configuration Form */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          {t('exports.sec_filters')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-mono font-bold text-gray-500 uppercase">{t('exports.lbl_boundary')}</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl cursor-pointer"
            >
              <option value="all">{t('exports.boundary_all')}</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Hải Phòng">Hải Phòng</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-mono font-bold text-gray-500 uppercase">{t('exports.lbl_category')}</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl cursor-pointer"
            >
              <option value="all">{t('exports.cat_all')}</option>
              <option value="prohibition">{t('exports.cat_prohibition')}</option>
              <option value="warning">{t('exports.cat_warning')}</option>
              <option value="mandatory">{t('exports.cat_mandatory')}</option>
            </select>
          </div>
        </div>

        {/* Format Select Cards */}
        <div className="space-y-2">
          <label className="font-mono font-bold text-gray-500 uppercase text-xs">
            {t('exports.sec_format')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'geojson', name: 'GeoJSON (RFC 7946)', icon: <FileCode size={20} className="text-[#007b8b]" />, desc: isEn ? 'Standard spatial JSON' : 'Chuẩn web GIS phổ biến' },
              { id: 'shapefile', name: 'ESRI Shapefile (.shp)', icon: <MapPin size={20} className="text-purple-600" />, desc: isEn ? 'QGIS / ArcGIS zip' : 'Nén zip cho ArcGIS/QGIS' },
              { id: 'csv', name: 'Flat CSV (WGS84)', icon: <FileCsv size={20} className="text-emerald-600" />, desc: isEn ? 'Tabular GPS rows' : 'Bảng tọa độ và thuộc tính' },
              { id: 'osm', name: 'OpenStreetMap XML', icon: <FileCode size={20} className="text-amber-600" />, desc: isEn ? 'OSM XML Nodes' : 'Tệp Node OSM tag' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setExportFormat(fmt.id as any)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  exportFormat === fmt.id
                    ? 'border-[#007b8b] bg-[#d3f7ff]/40 dark:bg-[#00c4de]/10 shadow-xs'
                    : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {fmt.icon}
                  <span className="font-bold text-xs text-gray-900 dark:text-white">{fmt.name}</span>
                </div>
                <p className="text-[11px] text-gray-500">{fmt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-white/10">
          <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeConfidence}
              onChange={(e) => setIncludeConfidence(e.target.checked)}
              className="rounded accent-[#007b8b]"
            />
            <span>{t('exports.lbl_include_metadata')}</span>
          </label>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleStartExport}
            className="px-6 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <DownloadSimple size={18} weight="bold" />
            <span>{isExporting ? t('exports.btn_exporting') : t('exports.btn_export')}</span>
          </button>
        </div>
      </div>

      {/* Export History Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
          <ClockCounterClockwise size={18} className="text-gray-400" />
          <h3 className="font-bold text-xs uppercase font-mono text-gray-700 dark:text-gray-300">
            {t('exports.history_title')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{t('exports.th_job_id')}</th>
                <th className="py-3 px-4 font-semibold">{t('exports.th_format')}</th>
                <th className="py-3 px-4 font-semibold">{t('exports.th_region')}</th>
                <th className="py-3 px-4 font-semibold">{t('exports.th_records')}</th>
                <th className="py-3 px-4 font-semibold">{t('exports.th_created')}</th>
                <th className="py-3 px-4 font-semibold text-center">{t('exports.th_download')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">{h.id}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">{h.format}</td>
                  <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">{h.region}</td>
                  <td className="py-3.5 px-4 font-mono">{h.totalFeatures.toLocaleString()} ({h.fileSize})</td>
                  <td className="py-3.5 px-4 font-mono text-gray-400">{h.createdAt}</td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => showToast(t('exports.toast_downloading', { id: h.id }))}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white rounded-lg font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <DownloadSimple size={13} />
                      <span>{t('exports.btn_download')}</span>
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
