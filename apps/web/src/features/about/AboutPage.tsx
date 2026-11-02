import { useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { CheckCircle, Sparkle } from '@phosphor-icons/react'

interface Person {
  name: string
  role: string
}

const SUPERVISORS: Person[] = [
  {
    name: 'ThS. Đặng Ngọc Minh Đức',
    role: 'Giảng viên hướng dẫn',
  },
  {
    name: 'ThS. Thân Thị Ngọc Vân',
    role: 'Giảng viên đồng hướng dẫn',
  },
]

const TEAM_MEMBERS: Person[] = [
  {
    name: 'Phan Tài Đức',
    role: 'Trưởng nhóm',
  },
  {
    name: 'Nguyễn Phúc Khang',
    role: 'Thành viên',
  },
  {
    name: 'Lương Minh Nhật',
    role: 'Thành viên',
  },
  {
    name: 'Nguyễn Lê Quang Hưng',
    role: 'Thành viên',
  },
  {
    name: 'Nguyễn Long Vũ',
    role: 'Thành viên',
  },
]

export default function AboutPage() {
  const { isDark } = useTheme()

  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Giới thiệu - SignTrustMap'
    return () => {
      document.title = prevTitle
    }
  }, [])

  return (
    <div
      className={`min-h-screen w-full transition-colors ${
        isDark ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
              SignTrustMap
            </h1>

            <p className="max-w-3xl text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal mb-8">
              Nền tảng kiểm kê biển báo giao thông tin cậy kết hợp sức mạnh cộng đồng và trí tuệ nhân tạo
            </p>

            {/* Project Metadata Chips */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
              <span
                className={`px-3.5 py-1.5 rounded-lg border font-mono font-medium ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                Mã đồ án: FA26SE003
              </span>
              <span
                className={`px-3.5 py-1.5 rounded-lg border font-mono font-medium ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                Mã nhóm: GFA26SE83
              </span>
              <span
                className={`px-3.5 py-1.5 rounded-lg border font-medium ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                Học kỳ: Fall 2026
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Project Team ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Đội ngũ Phát triển
          </h2>
        </div>

        {/* Supervisors */}
        <div className="mb-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-4 text-center sm:text-left">
            Giảng viên hướng dẫn
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {SUPERVISORS.map((sup) => (
              <div
                key={sup.name}
                className={`p-5 sm:p-6 rounded-2xl border transition-colors ${
                  isDark
                    ? 'bg-slate-800/40 border-slate-800'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {sup.name}
                </h4>
                <p className="text-xs sm:text-sm font-medium text-teal-600 dark:text-teal-400 mt-1">
                  {sup.role}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Members */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-4 text-center sm:text-left">
            Thành viên nhóm
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.name}
                className={`p-5 sm:p-6 rounded-2xl border transition-colors ${
                  isDark
                    ? 'bg-slate-800/40 border-slate-800'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {member.name}
                </h4>
                <p className="text-xs sm:text-sm font-semibold text-teal-600 dark:text-teal-400 mt-1">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Project Vision & Background ─────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            className={`p-6 sm:p-8 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-slate-800/50 border-slate-800'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2.5 rounded-xl ${
                  isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                }`}
              >
                <Sparkle size={22} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Bối cảnh và Động lực
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Biển báo giao thông tại Việt Nam thường xuyên được bổ sung, điều chỉnh hoặc hư hại theo thời gian.
              Phương pháp khảo sát định kỳ bằng xe chuyên dụng hoặc thiết bị quét đắt đỏ rất khó đáp ứng trên quy mô
              mạng lưới đường bộ rộng lớn. Việc ứng dụng dữ liệu đóng góp từ camera hành trình của người lái xe mang
              lại tiềm năng thu thập quy mô lớn nhưng đối mặt với thách thức về nhiễu GPS, ảnh trùng lặp và tính
              chính xác của vị trí.
            </p>
          </div>

          <div
            className={`p-6 sm:p-8 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-slate-800/50 border-slate-800'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2.5 rounded-xl ${
                  isDark ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-700'
                }`}
              >
                <CheckCircle size={22} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Mục tiêu Giải pháp
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              SignTrustMap giải quyết bài toán này bằng mô hình cộng tác giữa cộng đồng và trí tuệ nhân tạo.
              Hệ thống tự động phát hiện, định vị không gian và trích xuất biển báo từ hình ảnh hành trình,
              sau đó chuyển giao đến cơ chế thẩm định đồng thuận của các kiểm duyệt viên độc lập.
              Kho dữ liệu biển báo chuẩn hóa được duy trì liên tục và phục vụ trực tiếp cho dịch vụ bản đồ số,
              dẫn đường thông minh và nghiên cứu giao thông vận tải.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
