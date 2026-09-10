import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface SurveySubmission {
  id: string
  userId: string
  fileType: 'video' | 'photo' | 'gpx'
  fileName: string
  status: 'Processing' | 'Completed' | 'Failed'
  detectedSignsCount: number
  rewardCreditsEarned: number
  createdAt: string
}

export const surveyService = {
  /**
   * Upload dashcam video file for AI telemetry sync & sign detection
   */
  uploadVideo: (formData: FormData) => {
    return http.post<ApiResponse<{ jobId: string }>>(API_ENDPOINTS.SURVEY.UPLOAD_VIDEO, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Upload single sign photo with GPS metadata
   */
  uploadPhoto: (formData: FormData) => {
    return http.post<ApiResponse<{ candidateId: string }>>(API_ENDPOINTS.SURVEY.UPLOAD_PHOTO, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Upload standalone GPX trajectory file
   */
  uploadGpx: (formData: FormData) => {
    return http.post<ApiResponse<{ trajectoryId: string }>>(API_ENDPOINTS.SURVEY.UPLOAD_GPX, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Get user survey submission history
   */
  getSubmissions: () => {
    return http.get<ApiResponse<SurveySubmission[]>>(API_ENDPOINTS.SURVEY.SUBMISSIONS)
  },
}
