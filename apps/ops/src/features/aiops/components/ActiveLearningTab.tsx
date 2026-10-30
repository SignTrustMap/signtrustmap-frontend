import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SlidersHorizontal,
  CaretDown,
  Check,
  Sparkle,
  FloppyDisk,
} from '@phosphor-icons/react'
import type { ActiveLearningStrategiesResponse } from '@/api/services/aiops.service'

interface ActiveLearningTabProps {
  strategiesData: ActiveLearningStrategiesResponse | null
  selectedStrategy: string
  setSelectedStrategy: React.Dispatch<React.SetStateAction<string>>
  selectedAggregation: string
  setSelectedAggregation: React.Dispatch<React.SetStateAction<string>>
  topK: number
  setTopK: React.Dispatch<React.SetStateAction<number>>
  uncertaintyMargin: string
  setUncertaintyMargin: React.Dispatch<React.SetStateAction<string>>
  onSave: () => void
}

export function ActiveLearningTab({
  strategiesData,
  selectedStrategy,
  setSelectedStrategy,
  selectedAggregation,
  setSelectedAggregation,
  topK,
  setTopK,
  uncertaintyMargin,
  setUncertaintyMargin,
  onSave,
}: ActiveLearningTabProps) {
  const { t } = useTranslation('ops')

  const [strategyDropdownOpen, setStrategyDropdownOpen] = useState(false)
  const [aggDropdownOpen, setAggDropdownOpen] = useState(false)
  const strategyRef = useRef<HTMLDivElement>(null)
  const aggRef = useRef<HTMLDivElement>(null)

  // Click outside listener for custom dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (strategyRef.current && !strategyRef.current.contains(event.target as Node)) {
        setStrategyDropdownOpen(false)
      }
      if (aggRef.current && !aggRef.current.contains(event.target as Node)) {
        setAggDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider mb-1">
            <SlidersHorizontal size={16} weight="bold" />
            <span>{t('mlops.tab_active_learning')}</span>
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {t('mlops.al_sec_sampling')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('mlops.al_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          {/* Strategy Algorithm Custom Dropdown */}
          <div className="space-y-1.5" ref={strategyRef}>
            <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wide">
              {t('mlops.al_lbl_strategy')}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStrategyDropdownOpen(!strategyDropdownOpen)
                  setAggDropdownOpen(false)
                }}
                className={`w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-[#061115] border rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                  strategyDropdownOpen
                    ? 'border-[#007b8b] ring-2 ring-[#007b8b]/20 dark:border-[#00c4de] dark:ring-[#00c4de]/20'
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <span className="font-bold text-gray-900 dark:text-white">
                  {selectedStrategy === 'least_confidence' ? 'Least Confidence' : selectedStrategy}
                </span>
                <CaretDown
                  size={14}
                  weight="bold"
                  className={`text-gray-400 transition-transform duration-200 ${
                    strategyDropdownOpen ? 'rotate-180 text-[#007b8b] dark:text-[#00c4de]' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {strategyDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-xl shadow-xl z-50 overflow-hidden py-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                  {(strategiesData?.strategies || ['least_confidence']).map((s) => {
                    const isSelected = selectedStrategy === s
                    return (
                      <div
                        key={s}
                        onClick={() => {
                          setSelectedStrategy(s)
                          setStrategyDropdownOpen(false)
                        }}
                        className={`px-3.5 py-2.5 flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] font-bold'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span>{s === 'least_confidence' ? 'Least Confidence' : s}</span>
                        {isSelected && <Check size={14} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <span className="text-[11px] text-gray-400 block">{t('mlops.al_strategy_least_confidence_desc')}</span>
          </div>

          {/* Aggregation Method Custom Dropdown */}
          <div className="space-y-1.5" ref={aggRef}>
            <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wide">
              {t('mlops.al_lbl_aggregation')}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAggDropdownOpen(!aggDropdownOpen)
                  setStrategyDropdownOpen(false)
                }}
                className={`w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-[#061115] border rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                  aggDropdownOpen
                    ? 'border-[#007b8b] ring-2 ring-[#007b8b]/20 dark:border-[#00c4de] dark:ring-[#00c4de]/20'
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <span className="font-bold text-gray-900 dark:text-white uppercase">
                  {selectedAggregation}
                </span>
                <CaretDown
                  size={14}
                  weight="bold"
                  className={`text-gray-400 transition-transform duration-200 ${
                    aggDropdownOpen ? 'rotate-180 text-[#007b8b] dark:text-[#00c4de]' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {aggDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-xl shadow-xl z-50 overflow-hidden py-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                  {(strategiesData?.aggregation_methods || ['avg', 'max', 'min', 'sum']).map((m) => {
                    const isSelected = selectedAggregation === m
                    return (
                      <div
                        key={m}
                        onClick={() => {
                          setSelectedAggregation(m)
                          setAggDropdownOpen(false)
                        }}
                        className={`px-3.5 py-2.5 flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] font-bold'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="uppercase">{m}</span>
                        {isSelected && <Check size={14} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <span className="text-[11px] text-gray-400 block">{t('mlops.al_agg_desc')}</span>
          </div>

          {/* Top-K Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center font-mono">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('mlops.al_lbl_top_k')}</label>
              <span className="font-bold text-[#007b8b] dark:text-[#00c4de] text-sm tabular-nums">
                {topK} {t('mlops.al_samples_unit')}
              </span>
            </div>
            <div className="pt-2">
              <input
                type="range"
                min={10}
                max={200}
                step={10}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full accent-[#007b8b] cursor-pointer"
              />
            </div>
            <span className="text-[11px] text-gray-400 block pt-0.5">{t('mlops.al_top_k_desc')}</span>
          </div>
        </div>

        {/* Uncertainty Formula & Threshold */}
        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/60 dark:border-white/10 space-y-2.5">
          <label className="block font-mono font-bold text-gray-500 uppercase text-xs tracking-wide">
            {t('mlops.al_lbl_uncertainty')}
          </label>
          <input
            type="text"
            value={uncertaintyMargin}
            onChange={(e) => setUncertaintyMargin(e.target.value)}
            className="w-full px-3.5 py-2.5 font-mono text-xs bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-purple-600 dark:text-purple-400 font-bold focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
          />
          <p className="text-[11px] text-gray-400 pt-0.5">
            {t('mlops.al_uncertainty_desc')}
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
          <span className="text-xs font-mono text-emerald-600 flex items-center gap-1.5">
            <Sparkle size={14} weight="fill" />
            {t('mlops.al_active_strategy_prefix')} {selectedStrategy} ({selectedAggregation}) • Top {topK}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              className="px-5 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FloppyDisk size={16} weight="bold" />
              <span>{t('mlops.al_btn_save')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
