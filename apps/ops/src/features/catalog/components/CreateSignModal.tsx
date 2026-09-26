import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from '@phosphor-icons/react'
import { ModalPortal } from '@/components/common/ModalPortal'
import CustomSelect from '@/components/common/CustomSelect'
import type { CatalogCategory, CatalogEntry } from '@/data/catalogData'

export interface CreateSignModalProps {
  /** Controls modal visibility. */
  isOpen: boolean
  /** Callback fired to close modal without saving. */
  onClose: () => void
  /** Callback fired with the validated new CatalogEntry to publish. */
  onCreate: (newEntry: CatalogEntry) => void
}

/**
 * Modal dialog enabling Administrators to publish a new traffic sign specification
 * into the QCVN 41:2019 reference catalog with AI CLIP vector prompt and OSM tagging rules.
 */
export const CreateSignModal: React.FC<CreateSignModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const { t } = useTranslation('ops')

  const [newCode, setNewCode] = useState('')
  const [newNameVi, setNewNameVi] = useState('')
  const [newNameEn, setNewNameEn] = useState('')
  const [newCategory, setNewCategory] = useState<CatalogCategory>('prohibitory')
  const [newShape, setNewShape] = useState<'Circle' | 'Triangle' | 'Rectangle' | 'Octagon' | 'Diamond'>('Circle')
  const [newColor, setNewColor] = useState('Red-White')
  const [newDescriptionVi, setNewDescriptionVi] = useState('')
  const [newDescriptionEn, setNewDescriptionEn] = useState('')
  const [newAiPrompt, setNewAiPrompt] = useState('')
  const [newOsmMapping, setNewOsmMapping] = useState('')

  if (!isOpen) return null

  const resetForm = () => {
    setNewCode('')
    setNewNameVi('')
    setNewNameEn('')
    setNewDescriptionVi('')
    setNewDescriptionEn('')
    setNewAiPrompt('')
    setNewOsmMapping('')
    setNewCategory('prohibitory')
    setNewShape('Circle')
    setNewColor('Red-White')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim()) return

    const newEntry: CatalogEntry = {
      id: `CAT-${newCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`,
      code: newCode.trim(),
      name: newNameVi.trim() || newNameEn.trim(),
      nameVi: newNameVi.trim() || newCode.trim(),
      nameEn: newNameEn.trim() || newNameVi.trim(),
      category: newCategory,
      shape: newShape,
      color: newColor,
      description: newDescriptionVi.trim() || 'Standard road sign regulation definition',
      descriptionVi: newDescriptionVi.trim() || 'Mô tả quy chuẩn kỹ thuật theo QCVN 41:2019/BGTVT.',
      descriptionEn: newDescriptionEn.trim() || 'Standard technical traffic regulation definition.',
      aiPrompt: newAiPrompt.trim() || `${newShape.toLowerCase()} road traffic sign for ${newCode}`,
      clipPrompt: newAiPrompt.trim() || `${newShape.toLowerCase()} road traffic sign for ${newCode}`,
      osmMapping: newOsmMapping.trim() || `traffic_sign=VN:${newCode}`,
      standardRef: 'QCVN 41:2019/BGTVT',
      status: 'Active',
      version: 'v2.5',
    }

    onCreate(newEntry)
    resetForm()
    onClose()
  }

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200 text-left"
        >
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              {t('catalog.modal_title')}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_code')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. P.106a"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_category')} *
                </label>
                <CustomSelect
                  value={newCategory}
                  onChange={(val) => setNewCategory(val as CatalogCategory)}
                  className="w-full"
                  buttonClassName="w-full"
                  options={[
                    { value: 'prohibitory', label: t('catalog.cat_prohibitory') },
                    { value: 'warning', label: t('catalog.cat_warning') },
                    { value: 'mandatory', label: t('catalog.cat_mandatory') },
                    { value: 'speed_limit', label: t('catalog.cat_speed_limit') },
                    { value: 'guide', label: t('catalog.cat_guide') },
                    { value: 'additional', label: t('catalog.cat_additional') },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_name')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('catalog.field_name_placeholder')}
                  value={newNameVi}
                  onChange={(e) => setNewNameVi(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_name_en')}
                </label>
                <input
                  type="text"
                  placeholder={t('catalog.field_name_en_placeholder')}
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_shape')}
                </label>
                <CustomSelect
                  value={newShape}
                  onChange={(val) => setNewShape(val as any)}
                  className="w-full"
                  buttonClassName="w-full"
                  options={[
                    { value: 'Circle', label: t('catalog.shape_circle') },
                    { value: 'Triangle', label: t('catalog.shape_triangle') },
                    { value: 'Rectangle', label: t('catalog.shape_rectangle') },
                    { value: 'Octagon', label: t('catalog.shape_octagon') },
                    { value: 'Diamond', label: t('catalog.shape_diamond') },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_color')}
                </label>
                <CustomSelect
                  value={newColor}
                  onChange={(val) => setNewColor(val)}
                  className="w-full"
                  buttonClassName="w-full"
                  options={[
                    { value: 'Red-White', label: t('catalog.colors_red_white') },
                    { value: 'Yellow-Black', label: t('catalog.colors_yellow_black') },
                    { value: 'Blue-White', label: t('catalog.colors_blue_white') },
                    { value: 'Green-White', label: t('catalog.colors_green_white') },
                    { value: 'Black-White', label: t('catalog.colors_black_white') },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t('catalog.field_ai_prompt')}
              </label>
              <textarea
                rows={2}
                placeholder="a circular red traffic sign with a black truck silhouette indicating no trucks"
                value={newAiPrompt}
                onChange={(e) => setNewAiPrompt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-mono text-[11px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t('catalog.field_osm_mapping')}
              </label>
              <input
                type="text"
                placeholder="hgv=no; traffic_sign=VN:P.106a"
                value={newOsmMapping}
                onChange={(e) => setNewOsmMapping(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-mono text-[11px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                {t('catalog.btn_cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>{t('catalog.btn_publish')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}
