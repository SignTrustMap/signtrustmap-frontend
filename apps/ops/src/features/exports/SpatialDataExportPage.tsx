import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import CustomSelect from '@/components/common/CustomSelect'
import PageHeader from '@/components/common/PageHeader'
import {
  DownloadSimple,
  FileCode,
  FileCsv,
  MapPin,
  ClockCounterClockwise,
  CheckCircle,
  CircleNotch,
  SlidersHorizontal,
  Compass,
} from '@phosphor-icons/react'
import { mockExportHistory, type ExportHistoryRecord } from '@/data/adminGovernanceData'

export default function SpatialDataExportPage() {
  const { t } = useTranslation('ops')
  const toast = useToast()

  const [exportFormat, setExportFormat] = useState<'geojson' | 'shapefile' | 'csv' | 'osm'>('geojson')
  const [selectedCity, setSelectedCity] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCrs, setSelectedCrs] = useState('wgs84')
  const [includeConfidence, setIncludeConfidence] = useState(true)
  const [includeAzimuth, setIncludeAzimuth] = useState(true)
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const [history, setHistory] = useState<ExportHistoryRecord[]>(mockExportHistory)
  const [isExporting, setIsExporting] = useState(false)

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
        id: `EXP-2026-10${history.length + 5}`,
        format: fmtLabelMap[exportFormat],
        region: selectedCity === 'all' ? t('exports.region_nationwide') : selectedCity,
        totalFeatures: Math.floor(Math.random() * 8000) + 3200,
        fileSize: exportFormat === 'shapefile' ? '18.4 MB' : exportFormat === 'geojson' ? '9.6 MB' : '3.2 MB',
        exportedBy: 'admin@signtrustmap.site',
        createdAt: t('exports.just_now'),
      }
      setHistory([newHistoryItem, ...history])
      setIsExporting(false)
      toast.success(t('exports.toast_exported', { id: newHistoryItem.id }))
    }, 1200)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full">
      {/* ─── Header: Clean & Minimalist, no subtitle, action on right ─── */}
      <PageHeader
        title={t('exports.title')}
        actions={
          <button
            type="button"
            disabled={isExporting}
            onClick={handleStartExport}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#007b8b] hover:bg-[#006272] disabled:opacity-60 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            {isExporting ? (
              <>
                <CircleNotch size={16} weight="bold" className="animate-spin" />
                <span>{t('exports.btn_exporting')}</span>
              </>
            ) : (
              <>
                <DownloadSimple size={16} weight="bold" />
                <span>{t('exports.btn_export')}</span>
              </>
            )}
          </button>
        }
      />

      {/* ─── Card 1: Filter & Extraction Criteria ─── */}
      <div className="bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#007b8b]/10 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center">
            <SlidersHorizontal size={18} weight="bold" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            {t('exports.sec_filters')}
          </h2>
        </div>

        {/* 3 Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold text-gray-700 dark:text-gray-300">
              {t('exports.lbl_boundary')}
            </label>
            <CustomSelect
              value={selectedCity}
              onChange={setSelectedCity}
              className="w-full"
              buttonClassName="w-full text-xs"
              options={[
                { value: 'all', label: t('exports.boundary_all') },
                { value: 'Hà Nội', label: t('exports.reg_hn') },
                { value: 'TP. Hồ Chí Minh & Thủ Đức', label: t('exports.reg_hcm') },
                { value: 'Đà Nẵng', label: t('exports.reg_dn') },
                { value: 'Hải Phòng', label: t('exports.reg_hp') },
                { value: 'Cần Thơ', label: t('exports.reg_ct') },
                { value: 'Quốc lộ 1A (Tuyến Bắc - Nam)', label: t('exports.reg_ql1a') },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-gray-700 dark:text-gray-300">
              {t('exports.lbl_category')}
            </label>
            <CustomSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              className="w-full"
              buttonClassName="w-full text-xs"
              options={[
                { value: 'all', label: t('exports.cat_all') },
                { value: 'prohibition', label: t('exports.cat_prohibition') },
                { value: 'warning', label: t('exports.cat_warning') },
                { value: 'mandatory', label: t('exports.cat_mandatory') },
                { value: 'indication', label: t('exports.cat_indication') },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-gray-700 dark:text-gray-300">
              {t('exports.lbl_crs')}
            </label>
            <CustomSelect
              value={selectedCrs}
              onChange={setSelectedCrs}
              className="w-full"
              buttonClassName="w-full text-xs"
              options={[
                { value: 'wgs84', label: t('exports.crs_wgs84') },
                { value: 'vn2000', label: t('exports.crs_vn2000') },
              ]}
            />
          </div>
        </div>

        {/* Checkbox Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-white/5 text-xs">
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded text-[#007b8b] focus:ring-[#007b8b] border-gray-300 dark:border-white/20 cursor-pointer"
            />
            <span>{t('exports.chk_verified_only')}</span>
          </label>

          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeConfidence}
              onChange={(e) => setIncludeConfidence(e.target.checked)}
              className="w-4 h-4 rounded text-[#007b8b] focus:ring-[#007b8b] border-gray-300 dark:border-white/20 cursor-pointer"
            />
            <span>{t('exports.lbl_include_metadata')}</span>
          </label>

          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeAzimuth}
              onChange={(e) => setIncludeAzimuth(e.target.checked)}
              className="w-4 h-4 rounded text-[#007b8b] focus:ring-[#007b8b] border-gray-300 dark:border-white/20 cursor-pointer"
            />
            <span>{t('exports.chk_azimuth')}</span>
          </label>
        </div>
      </div>

      {/* ─── Card 2: GIS Formats (4-card selectable grid) ─── */}
      <div className="bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center">
            <Compass size={18} weight="bold" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            {t('exports.sec_format')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              id: 'geojson',
              name: 'GeoJSON (RFC 7946)',
              icon: <FileCode size={22} weight="duotone" className="text-[#007b8b] dark:text-[#00c4de]" />,
              desc: t('exports.desc_geojson'),
            },
            {
              id: 'shapefile',
              name: 'ESRI Shapefile (.shp)',
              icon: <MapPin size={22} weight="duotone" className="text-purple-600 dark:text-purple-400" />,
              desc: t('exports.desc_shapefile'),
            },
            {
              id: 'csv',
              name: 'Flat CSV (WGS84)',
              icon: <FileCsv size={22} weight="duotone" className="text-emerald-600 dark:text-emerald-400" />,
              desc: t('exports.desc_csv'),
            },
            {
              id: 'osm',
              name: 'OpenStreetMap XML (.osm)',
              icon: <FileCode size={22} weight="duotone" className="text-amber-600 dark:text-amber-400" />,
              desc: t('exports.desc_osm'),
            },
          ].map((fmt) => {
            const isSelected = exportFormat === fmt.id
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setExportFormat(fmt.id as any)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#007b8b] bg-[#007b8b]/5 dark:bg-[#00c4de]/10 shadow-xs ring-1 ring-[#007b8b]/40'
                    : 'border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50/50 dark:bg-white/[0.02]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {fmt.icon}
                    {isSelected && (
                      <CheckCircle size={16} weight="fill" className="text-[#007b8b] dark:text-[#00c4de]" />
                    )}
                  </div>
                  <h3 className="font-bold text-xs text-gray-900 dark:text-white mb-1">
                    {fmt.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                    {fmt.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Card 3: Recent Export History Table ─── */}
      <div className="bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockCounterClockwise size={18} className="text-[#007b8b] dark:text-[#00c4de]" />
            <h3 className="font-bold text-xs uppercase font-mono text-gray-800 dark:text-gray-200">
              {t('exports.history_title')}
            </h3>
          </div>
          <span className="text-xs font-mono text-gray-400">
            {history.length} {t('exports.th_records').toLowerCase()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400 font-mono uppercase text-[11px] border-b border-gray-200/80 dark:border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{t('exports.th_job_id')}</th>
                <th className="py-3 px-4 font-semibold">{t('exports.th_format')}</th>
                <th className="py-3 px-4 font-semibold">{t('exports.th_region')}</th>
                <th className="py-3 px-4 font-semibold">{t('exports.th_records')}</th>
                <th className="py-3 px-4 font-semibold">{t('exports.th_created')}</th>
                <th className="py-3 px-4 font-semibold text-right">{t('exports.th_download')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {history.map((h) => (
                <tr
                  key={h.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                    {h.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[11px] font-semibold text-[#007b8b] dark:text-[#00c4de] bg-[#007b8b]/10 dark:bg-[#00c4de]/10 px-2 py-0.5 rounded-md">
                      {h.format}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300 font-medium">
                    {h.region}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-gray-300">
                    {h.totalFeatures.toLocaleString()} ({h.fileSize})
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-400">
                    {h.createdAt}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => toast.success(t('exports.toast_downloading', { id: h.id }))}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white rounded-lg font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer text-xs"
                    >
                      <DownloadSimple size={13} weight="bold" />
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
