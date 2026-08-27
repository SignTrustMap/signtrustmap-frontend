import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import {
  Users,
  WarningCircle,
  FolderSimple,
  ArrowUpRight,
  DotsThreeVertical,
  DownloadSimple,
  CalendarBlank,
  ShieldCheck,
  HardDrives,
  CheckSquare,
  Flag,
} from '@phosphor-icons/react'
import {
  adminKpisData,
  staffKpisData,
  adminActivitiesData,
  staffActivitiesData,
  type KpiItem,
} from '@/data'

export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [timeRange, setTimeRange] = useState('30 ngày qua')
  const [feedFilter, setFeedFilter] = useState('Tất cả sự kiện')

  // Icons map for KPIs
  const adminIcons = [
    <Users size={22} weight="bold" />,
    <ShieldCheck size={22} weight="bold" />,
    <HardDrives size={22} weight="bold" />,
    <WarningCircle size={22} weight="bold" />,
  ]

  const staffIcons = [
    <FolderSimple size={22} weight="bold" />,
    <Flag size={22} weight="bold" />,
    <CheckSquare size={22} weight="bold" />,
    <Users size={22} weight="bold" />,
  ]

  const currentKpis: KpiItem[] = isAdmin ? adminKpisData : staffKpisData
  const currentIcons = isAdmin ? adminIcons : staffIcons
  const recentActivities = isAdmin ? adminActivitiesData : staffActivitiesData

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {isAdmin ? 'Tổng quan Quản trị Hệ thống' : 'Tổng quan Nghiệp vụ Vận hành'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? 'Theo dõi trạng thái tài khoản, an ninh, tham số hệ thống và phân quyền.'
              : 'Theo dõi tiến độ kiểm duyệt hồ sơ, sự cố biển báo và nhiệm vụ tái xác thực.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Time Range Dropdown */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg font-semibold text-gray-700 focus:outline-none focus:border-[#007b8b] shadow-xs cursor-pointer"
            >
              <option value="7 ngày qua">7 ngày qua</option>
              <option value="30 ngày qua">30 ngày qua</option>
              <option value="90 ngày qua">90 ngày qua</option>
            </select>
            <CalendarBlank
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Export Button */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E8E4E3] bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <DownloadSimple size={16} />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {currentKpis.map((kpi, idx) => (
          <div
            key={kpi.label}
            className="bg-white border border-[#E8E4E3] rounded-[18px] p-5 shadow-xs flex flex-col justify-between hover:border-[#007b8b]/40 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500">{kpi.label}</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 font-mono tracking-tight">
                  {kpi.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}
              >
                {currentIcons[idx]}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold">
              {kpi.isPositive && (
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold inline-flex items-center">
                  <ArrowUpRight size={13} weight="bold" />
                  {kpi.change}
                </span>
              )}
              {kpi.isWarning && (
                <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-bold inline-flex items-center">
                  <ArrowUpRight size={13} weight="bold" />
                  {kpi.change}
                </span>
              )}
              {kpi.isNeutral && (
                <span className="text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded font-bold">
                  {kpi.change}
                </span>
              )}
              <span className="text-gray-400 font-normal">{kpi.changeText}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Growth / Workflow Pipeline Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#E8E4E3] rounded-[18px] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isAdmin ? 'Tăng trưởng người dùng & Lưu lượng' : 'Tiến độ xử lý hồ sơ & Báo cáo'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isAdmin ? 'Đăng ký mới so với tài khoản kích hoạt' : 'Hồ sơ tiếp nhận so với đã xử lý xong'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-[#007b8b] bg-white" />
                {isAdmin ? 'Đăng ký mới' : 'Hồ sơ tiếp nhận'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-gray-500 bg-white" />
                {isAdmin ? 'Đang hoạt động' : 'Đã hoàn tất'}
              </span>
              <button className="text-gray-400 hover:text-gray-700 p-1">
                <DotsThreeVertical size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* SVG Area & Line Chart */}
          <div className="w-full h-64 relative pt-2">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 700 220"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#007b8b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#007b8b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 50, 100, 150, 200].map((y) => (
                <line
                  key={y}
                  x1="40"
                  y1={y}
                  x2="690"
                  y2={y}
                  stroke="#E8E4E3"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              ))}

              {/* Y Axis Labels */}
              <text x="5" y="10" fill="#9ca3af" fontSize="10" fontFamily="monospace">3,000</text>
              <text x="5" y="60" fill="#9ca3af" fontSize="10" fontFamily="monospace">2,000</text>
              <text x="5" y="110" fill="#9ca3af" fontSize="10" fontFamily="monospace">1,500</text>
              <text x="5" y="160" fill="#9ca3af" fontSize="10" fontFamily="monospace">500</text>
              <text x="25" y="205" fill="#9ca3af" fontSize="10" fontFamily="monospace">0</text>

              {/* Area Under Curve 1 */}
              <path
                d="M 50 145 C 130 110, 180 125, 210 120 C 270 110, 320 150, 360 145 C 420 140, 480 90, 520 85 C 580 80, 630 40, 670 45 L 670 200 L 50 200 Z"
                fill="url(#growthGradient)"
              />

              {/* Line 1 (Solid Teal) */}
              <path
                d="M 50 145 C 130 110, 180 125, 210 120 C 270 110, 320 150, 360 145 C 420 140, 480 90, 520 85 C 580 80, 630 40, 670 45"
                fill="none"
                stroke="#007b8b"
                strokeWidth="2.5"
              />

              {/* Points on Line 1 */}
              {[[50, 145], [210, 120], [360, 145], [520, 85], [670, 45]].map(([cx, cy], i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="4"
                  fill="#ffffff"
                  stroke="#007b8b"
                  strokeWidth="2"
                />
              ))}

              {/* Line 2 (Dashed Blue-Gray) */}
              <path
                d="M 50 170 C 130 160, 180 150, 210 150 C 270 150, 320 165, 360 160 C 420 155, 480 135, 520 130 C 580 125, 630 105, 670 100"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Points on Line 2 */}
              {[[50, 170], [210, 150], [360, 160], [520, 130], [670, 100]].map(([cx, cy], i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#64748b"
                  strokeWidth="2"
                />
              ))}
            </svg>

            {/* X Axis Labels */}
            <div className="flex justify-between pl-10 pr-2 pt-2 text-[11px] font-mono text-gray-400">
              <span>Tuần 1</span>
              <span>Tuần 2</span>
              <span>Tuần 3</span>
              <span>Tuần 4</span>
              <span>Tuần 5</span>
            </div>
          </div>
        </div>

        {/* Right: Category Donut Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E8E4E3] rounded-[18px] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isAdmin ? 'Phân loại tài khoản' : 'Phân loại vi phạm nghiệp vụ'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isAdmin ? 'Theo nhóm vai trò' : 'Theo mức độ nghiêm trọng'}
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-700 p-1">
              <DotsThreeVertical size={18} weight="bold" />
            </button>
          </div>

          {/* SVG Donut */}
          <div className="relative flex items-center justify-center my-4">
            <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke="#f1f5f9"
                strokeWidth="22"
                fill="transparent"
              />
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke="#007b8b"
                strokeWidth="22"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset="264"
                strokeLinecap="round"
              />
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke="#dc2626"
                strokeWidth="22"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset="316"
                strokeLinecap="round"
                className="transform rotate-144 origin-center"
              />
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke="#d97706"
                strokeWidth="22"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset="360"
                strokeLinecap="round"
                className="transform rotate-245 origin-center"
              />
            </svg>
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E8E4E3]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007b8b] shrink-0" />
              <span className="text-gray-700 truncate">{isAdmin ? 'Tài xế / Driver' : 'Sai lệch thông tin'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] shrink-0" />
              <span className="text-gray-700 truncate">{isAdmin ? 'Tài khoản vi phạm' : 'Lo ngại an toàn'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] shrink-0" />
              <span className="text-gray-700 truncate">{isAdmin ? 'Khảo sát viên' : 'Chất lượng kém'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0" />
              <span className="text-gray-700 truncate">Khác</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Recent Activity Feed */}
      <div className="bg-white border border-[#E8E4E3] rounded-[18px] p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E8E4E3] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">
              Nhật ký hoạt động gần đây
            </h2>
          </div>

          <select
            value={feedFilter}
            onChange={(e) => setFeedFilter(e.target.value)}
            className="text-xs border border-[#E8E4E3] rounded-lg px-3 py-1.5 bg-[#F8F7F7] text-gray-700 font-semibold focus:outline-none focus:border-[#007b8b]"
          >
            <option value="Tất cả sự kiện">Tất cả sự kiện</option>
            <option value="Chỉ cảnh báo nghiêm trọng">Chỉ cảnh báo nghiêm trọng</option>
            <option value="Chỉ hoạt động người dùng">Chỉ hoạt động người dùng</option>
          </select>
        </div>

        {/* Activity Feed Table */}
        <div className="divide-y divide-[#E8E4E3]">
          {recentActivities.map((act) => (
            <div
              key={act.id}
              className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#F8F7F7]/50 rounded-lg px-2 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${act.dotColor}`} />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {act.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {act.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0 text-xs">
                <div className="flex items-center gap-2">
                  {act.avatar ? (
                    <span className="w-6 h-6 rounded-full bg-[#d3f7ff] text-[#007b8b] font-bold text-[10px] flex items-center justify-center">
                      {act.avatar}
                    </span>
                  ) : null}
                  <span className="font-semibold text-gray-700">{act.user}</span>
                </div>
                <span className="font-mono text-gray-400 w-16 text-right">
                  {act.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
