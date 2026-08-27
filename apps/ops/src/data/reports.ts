export type ReportStatus = 'Pending' | 'Investigating' | 'Resolved'

export interface SignReportItem {
  id: string
  location: string
  reporter: {
    name: string
    initials: string
    avatarBg: string
  }
  dateSubmitted: string
  status: ReportStatus
}

export const mockSignReports: SignReportItem[] = [
  {
    id: '#REP-2049',
    location: 'Đường Nguyễn Huệ, Quận 1, TP.HCM',
    reporter: { name: 'Nguyễn Văn Hùng', initials: 'NH', avatarBg: 'bg-[#dbeafe] text-[#1d4ed8]' },
    dateSubmitted: '24/10/2023',
    status: 'Pending',
  },
  {
    id: '#REP-2048',
    location: 'Ngã tư Trần Phú - Điện Biên Phủ, Hà Nội',
    reporter: { name: 'Trần Thị Mai', initials: 'TM', avatarBg: 'bg-[#ffedd5] text-[#c2410c]' },
    dateSubmitted: '23/10/2023',
    status: 'Investigating',
  },
  {
    id: '#REP-2045',
    location: 'Cầu Rồng, Đường Bạch Đằng, Đà Nẵng',
    reporter: { name: 'Lê Hoàng Nam', initials: 'LN', avatarBg: 'bg-gray-200 text-gray-700' },
    dateSubmitted: '20/10/2023',
    status: 'Resolved',
  },
]
