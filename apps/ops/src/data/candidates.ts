export type CandidateStatus = 'Chưa xử lý' | 'Đang xem xét' | 'Đã giải quyết'
export type PriorityLevel = 'Cao' | 'Vừa' | 'Thấp'

export interface CandidateItem {
  id: string
  name: string
  reportedDate: string
  reason: string
  priority: PriorityLevel
  status: CandidateStatus
}

export const mockCandidates: CandidateItem[] = [
  {
    id: '#RC-8924-A',
    name: 'Jonathan Doe (CD-99012-XT)',
    reportedDate: '24/10/2023',
    reason: 'Nghi vấn sai lệch tài liệu xử lý vật chất nguy hiểm',
    priority: 'Cao',
    status: 'Đang xem xét',
  },
  {
    id: '#RC-8925-B',
    name: 'Maria Garcia (CD-44210-VN)',
    reportedDate: '23/10/2023',
    reason: 'Phát hiện sự không nhất quán trong nhật ký GPS hành trình',
    priority: 'Vừa',
    status: 'Chưa xử lý',
  },
  {
    id: '#RC-8926-C',
    name: 'Liam Smith (CD-10294-UK)',
    reportedDate: '22/10/2023',
    reason: 'Thời hạn hiệu lực chứng chỉ hành nghề đã hết hạn',
    priority: 'Thấp',
    status: 'Đã giải quyết',
  },
]
