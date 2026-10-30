export type ReportStatus = 'Chưa xử lý' | 'Đang xử lý' | 'Đã giải quyết' | 'Bác bỏ' | string
export type IssueType = 'damaged' | 'missing' | 'obscured' | 'incorrect' | string
export type ReportPriority = 'Cao' | 'Vừa' | 'Thấp' | string

export interface SignReportItem {
  id: string
  signId: string
  reportedBy: string
  reportedDate: string
  issueType: IssueType
  status: ReportStatus
  priority: ReportPriority
  description: string
  location: string
  lat?: number
  lng?: number
  photoUrl?: string
  assignedTo?: string
  resolutionNotes?: string
}
