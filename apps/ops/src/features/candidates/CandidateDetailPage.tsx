import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CaretRight,
  WarningOctagon,
  User,
  FileText,
  ClockCounterClockwise,
  Prohibit,
  ArrowsClockwise,
  CheckCircle,
  FilePdf,
  FileImage,
  ArrowSquareOut,
  ShieldCheck,
} from '@phosphor-icons/react'

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const reportId = id ? `Report #${id}` : 'Report #RC-8924-A'

  const [currentStatus, setCurrentStatus] = useState<string>('Under Review')
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  function handleAction(action: string) {
    if (action === 'reject') {
      setCurrentStatus('Rejected & Removed')
      setActionNotice('Candidate has been rejected and removed from system.')
    } else if (action === 'resurvey') {
      setCurrentStatus('Re-survey Requested')
      setActionNotice('Re-survey request dispatched to field surveyor.')
    } else if (action === 'approve') {
      setCurrentStatus('Approved & Cleared')
      setActionNotice('Candidate record has been approved and flags cleared.')
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link
          to="/candidates"
          className="hover:text-[#007b8b] transition-colors"
        >
          Reported Candidates
        </Link>
        <CaretRight size={12} />
        <span className="text-gray-900 font-bold font-mono">{reportId}</span>
      </nav>

      {/* Page Title & Priority Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E4E3] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Investigation: falsified credentials
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-[#fee2e2] text-[#b91c1c] uppercase tracking-wider">
              <WarningOctagon size={14} weight="fill" /> HIGH PRIORITY
            </span>
            <span className="text-xs text-gray-500 font-mono">
              Submitted: Oct 24, 2023 at 14:30 PST
            </span>
          </div>
        </div>

        {/* Current status pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Status:</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#dbeafe] text-[#1d4ed8]">
            {currentStatus}
          </span>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} weight="fill" className="text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT COLUMN (8 cols) ─────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Candidate Profile Card */}
          <div className="bg-white border border-[#E8E4E3] rounded-[18px] p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E8E4E3] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <User size={20} className="text-[#007b8b]" weight="bold" />
                <h2 className="text-base font-bold text-gray-900">
                  Candidate Profile
                </h2>
              </div>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-xs font-semibold text-[#007b8b] hover:underline inline-flex items-center gap-1"
              >
                <span>View Full Profile</span>
                <ArrowSquareOut size={13} />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar placeholder / professional avatar */}
              <div className="w-20 h-20 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0 border border-gray-200">
                JD
              </div>

              {/* Grid info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-xs flex-1">
                <div>
                  <p className="text-gray-400 font-mono uppercase tracking-wider text-[10px]">
                    Full Name
                  </p>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">
                    Jonathan Doe
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 font-mono uppercase tracking-wider text-[10px]">
                    Candidate ID
                  </p>
                  <p className="font-bold font-mono text-gray-900 text-sm mt-0.5">
                    CD-99012-XT
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 font-mono uppercase tracking-wider text-[10px]">
                    Applied Role
                  </p>
                  <p className="font-medium text-gray-800 text-xs mt-0.5">
                    Senior Logistics Coordinator
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 font-mono uppercase tracking-wider text-[10px]">
                    Region
                  </p>
                  <p className="font-medium text-gray-800 text-xs mt-0.5">
                    Northwest Region (NW-01)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Report Details & Evidence Card */}
          <div className="bg-white border border-[#E8E4E3] rounded-[18px] p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#E8E4E3] pb-4">
              <FileText size={20} className="text-[#007b8b]" weight="bold" />
              <h2 className="text-base font-bold text-gray-900">
                Report Details & Evidence
              </h2>
            </div>

            {/* Reporter's Statement */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono mb-2">
                Reporter's Statement
              </p>
              <div className="p-4 rounded-xl bg-[#F8F7F7] border border-[#E8E4E3] text-gray-700 italic text-xs sm:text-sm leading-relaxed">
                "During the routine background check, we identified discrepancies
                in the provided certification documents for hazardous materials
                handling. The issuing authority stamp appears digitally altered,
                and the verification number does not match their official
                records."
              </div>
              <p className="text-right text-[11px] text-gray-400 mt-2 font-mono">
                Reported by: <strong>System Audit Bot (Auto-Flagged)</strong>
              </p>
            </div>

            {/* Flagged Documents */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono mb-3">
                Flagged Documents (2)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Doc 1 */}
                <div className="border border-[#E8E4E3] rounded-xl p-3 bg-white hover:border-[#007b8b]/50 transition-all group">
                  <div className="h-32 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center p-3 text-center mb-2 overflow-hidden relative">
                    <FilePdf size={36} className="text-red-500 mb-1" weight="duotone" />
                    <span className="text-[11px] text-gray-500 font-mono">
                      [Document Preview]
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Stamp Verification Stamp #4492
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800 truncate">
                      HazMat_Cert_JD.pdf
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">2.4 MB</span>
                  </div>
                </div>

                {/* Doc 2 */}
                <div className="border border-[#E8E4E3] rounded-xl p-3 bg-white hover:border-[#007b8b]/50 transition-all group">
                  <div className="h-32 rounded-lg bg-slate-900 text-emerald-400 flex flex-col items-center justify-center p-3 text-center mb-2 overflow-hidden font-mono text-[10px] leading-tight">
                    <FileImage size={28} className="text-emerald-400 mb-1" weight="duotone" />
                    <span>&gt; ERR_HASH_MISMATCH</span>
                    <span className="text-gray-500">Record #CD-99012</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800 truncate">
                      System_Verification_Log.png
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">840 KB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN (4 cols) ────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Resolution Actions Card */}
          <div className="bg-white border border-[#E8E4E3] rounded-[18px] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E8E4E3] pb-3">
              <ShieldCheck size={20} className="text-[#007b8b]" weight="bold" />
              <h2 className="text-base font-bold text-gray-900">
                Resolution Actions
              </h2>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Select an action to resolve this investigation. This will update the
              candidate's status globally.
            </p>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleAction('reject')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <Prohibit size={18} weight="bold" />
                <span>Reject & Remove</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction('resurvey')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0369a1] font-bold text-xs sm:text-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <ArrowsClockwise size={18} weight="bold" />
                <span>Request Re-survey</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E8E4E3]" />
                </div>
                <span className="relative px-3 bg-white text-[10px] font-mono text-gray-400 uppercase">
                  OR
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleAction('approve')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs sm:text-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle size={18} weight="bold" className="text-emerald-600" />
                <span>Approve Record (Clear Flag)</span>
              </button>
            </div>
          </div>

          {/* Audit Trail Card */}
          <div className="bg-white border border-[#E8E4E3] rounded-[18px] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E8E4E3] pb-3">
              <ClockCounterClockwise
                size={20}
                className="text-[#007b8b]"
                weight="bold"
              />
              <h2 className="text-base font-bold text-gray-900">Audit Trail</h2>
            </div>

            {/* Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 text-xs">
              {/* Event 1 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-4 border-[#007b8b]" />
                <p className="text-[11px] text-gray-400 font-mono">
                  Oct 25, 2023 - 09:15 AM
                </p>
                <p className="font-bold text-gray-900 mt-0.5">Under Review</p>
                <p className="text-gray-500 text-[11px]">
                  Status updated by Admin (A. Smith)
                </p>
              </div>

              {/* Event 2 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-4 border-amber-500" />
                <p className="text-[11px] text-gray-400 font-mono">
                  Oct 24, 2023 - 14:30 PM
                </p>
                <p className="font-bold text-gray-900 mt-0.5">Report Generated</p>
                <p className="text-gray-500 text-[11px]">
                  System Audit Bot flagged credentials.
                </p>
              </div>

              {/* Event 3 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-4 border-gray-300" />
                <p className="text-[11px] text-gray-400 font-mono">
                  Oct 20, 2023 - 11:00 AM
                </p>
                <p className="font-bold text-gray-900 mt-0.5">
                  Application Submitted
                </p>
                <p className="text-gray-500 text-[11px]">
                  Candidate submitted initial profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
