export type TaskPriority = 'Cao' | 'Vừa' | 'Thấp' | 'High' | 'Normal' | 'Urgent'
export type TaskStatus = 'Chưa nhận' | 'Đang xử lý' | 'Đã hoàn thành' | 'Available' | 'In_Progress' | 'Completed'

export interface RevalidationTask {
  id: string
  title: string
  assignedTo: string
  assigneeAvatar?: string
  priority: TaskPriority
  status: TaskStatus
  dueDate: string
  location: string
  signCount: number
  description: string
  area: string
}

export interface RevalidationTaskItem {
  id: string
  title: string
  roadName: string
  district: string
  targetSignCount: number
  rewardCredits: number
  distanceKm: number
  priority: 'High' | 'Normal' | 'Urgent'
  status: 'Available' | 'In_Progress' | 'Completed'
  estimatedMinutes: number
  signPreviewCodes: string[]
}
