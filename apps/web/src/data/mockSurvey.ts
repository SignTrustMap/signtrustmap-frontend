export interface SurveySubmissionItem {
  id: string
  tripName: string
  route: string
  mediaType: 'video_gpx' | 'photo_gps'
  videoFileName?: string
  gpxFileName?: string
  photoFileName?: string
  fileSizeMb: number
  durationSec?: number
  uploadDate: string
  status: 'Completed' | 'Processing' | 'PartiallyProcessed' | 'Queued'
  stage: 'sync' | 'yolo_detect' | 'botsort_track' | 'geo_project' | 'clip_classify'
  progressPercent: number
  detectedSignsCount: number
  validatedSignsCount: number
  rewardCredits: number
  gpxPointsCount?: number
}

export const mockSurveySubmissions: SurveySubmissionItem[] = [
  {
    id: 'SURV-2026-001',
    tripName: 'Vo Van Kiet Highway - Morning Survey',
    route: 'District 1 ➔ Binh Chanh District (Vo Van Kiet Corridor)',
    mediaType: 'video_gpx',
    videoFileName: 'dashcam_vovankiet_20260828.mp4',
    gpxFileName: 'vovankiet_telemetry.gpx',
    fileSizeMb: 450.2,
    durationSec: 1200,
    uploadDate: '28/08/2026 08:30',
    status: 'Completed',
    stage: 'clip_classify',
    progressPercent: 100,
    detectedSignsCount: 18,
    validatedSignsCount: 16,
    rewardCredits: 320,
    gpxPointsCount: 2400,
  },
  {
    id: 'SURV-2026-002',
    tripName: 'Thu Thiem Tunnel & Mai Chi Tho Survey',
    route: 'Mai Chi Tho Boulevard (District 1 to Thu Duc City)',
    mediaType: 'video_gpx',
    videoFileName: 'dashcam_maichitho_20260830.mp4',
    gpxFileName: 'maichitho_telemetry.gpx',
    fileSizeMb: 320.5,
    durationSec: 900,
    uploadDate: '30/08/2026 14:15',
    status: 'Processing',
    stage: 'botsort_track',
    progressPercent: 65,
    detectedSignsCount: 9,
    validatedSignsCount: 4,
    rewardCredits: 140,
    gpxPointsCount: 1800,
  },
  {
    id: 'SURV-2026-003',
    tripName: 'Pham Van Dong Boulevard - Section A',
    route: 'Pham Van Dong (Go Vap to Binh Thanh)',
    mediaType: 'video_gpx',
    videoFileName: 'dashcam_phamvandong_20260901.mp4',
    gpxFileName: 'phamvandong_telemetry.gpx',
    fileSizeMb: 580.0,
    durationSec: 1500,
    uploadDate: '01/09/2026 09:45',
    status: 'Completed',
    stage: 'clip_classify',
    progressPercent: 100,
    detectedSignsCount: 24,
    validatedSignsCount: 22,
    rewardCredits: 440,
    gpxPointsCount: 3000,
  },
]
