// ============================================================================
// Core / Shared Error Messages
// ============================================================================
export const SAME_LOCATION_MESSAGE = 'Không thể chọn cùng một vị trí hai lần';
export const FINAL_ERROR_MESSAGE = 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu. Vui lòng thử lại sau.';
export const UNHANDLED_EXCEPTION_MESSAGE = 'Đã xảy ra lỗi không xác định.';
export const APPLICATION_ERROR_TITLE = 'Lỗi ứng dụng';
export const SESSION_PROVIDER_REQUIRED_MESSAGE = 'useSession phải được sử dụng bên trong SessionProvider';
export const UNAUTHENTICATED_MESSAGE = 'Chưa xác thực';

// ============================================================================
// GPS & Navigation Error Messages
// ============================================================================
export const GPS_UNAVAILABLE_MESSAGE =
  'Không thể lấy vị trí hiện tại của bạn. Vui lòng bật Vị trí/GPS và thử lại.';
export const UNABLE_TO_GET_CURRENT_LOCATION_MESSAGE = 'Không thể lấy vị trí hiện tại của bạn.';
export const GPS_NATIVE_BUILD_REQUIRED_MESSAGE = 'Vị trí GPS hiện tại yêu cầu bản build native.';
export const LOCATION_NATIVE_BUILD_REQUIRED_MESSAGE = 'Tính năng tìm vị trí yêu cầu bản build native.';
export const ALLOW_LOCATION_ACCESS_MESSAGE = 'Vui lòng cấp quyền truy cập vị trí để sử dụng vị trí hiện tại của bạn.';
export const ENABLE_LOCATION_SERVICE_MESSAGE = 'Bật dịch vụ định vị và thử lại.';
export const ROUTE_LOADING_MESSAGE = 'Đang tải tuyến đường. Vui lòng thử lại sau giây lát.';
export const LOCATION_PERMISSION_REQUIRED_NAVIGATION_MESSAGE = 'Cần cấp quyền truy cập vị trí để bắt đầu điều hướng.';
export const UNABLE_TO_LOAD_SIGNS_FOR_ROUTE_MESSAGE = 'Không thể tải danh sách biển báo cho tuyến đường này.';
export const UNABLE_TO_LOAD_SIGNS_MESSAGE = 'Không thể tải danh sách biển báo giao thông.';
export const CANNOT_SHARE_DESTINATION_MESSAGE = 'Không thể chia sẻ điểm đến này lúc này.';
export const MAP_BUILD_REQUIRED_TITLE = 'Yêu cầu bản build ứng dụng hỗ trợ bản đồ';
export const MAP_BUILD_REQUIRED_DESCRIPTION =
  'MapLibre đã được cài đặt nhưng bản cài đặt này chưa bao gồm native module. Vui lòng chạy lại bản build Expo development client để sử dụng bản đồ tương tác.';
export const INTERACTIVE_MAP_CLIENT_TITLE = 'Bản đồ tương tác';
export const MAPLIBRE_NOT_REGISTERED_MESSAGE =
  'Module MapLibre chưa được đăng ký trong môi trường này. Vui lòng kiểm tra trên bản dev client hoặc bản web.';
export const SIGN_IN_TO_SAVE_PLACES_MESSAGE = 'Vui lòng đăng nhập để lưu địa điểm gần đây.';
export const formatPhotonHttpErrorMessage = (status: number) => `Dịch vụ Photon trả về lỗi HTTP ${status}`;
export const formatNominatimHttpErrorMessage = (status: number) => `Dịch vụ Nominatim trả về lỗi HTTP ${status}`;

// ============================================================================
// Survey & Upload Error Messages
// ============================================================================
export const SIGN_IN_TO_CREATE_SURVEY_MESSAGE = 'Vui lòng đăng nhập để tạo khảo sát.';
export const SIGN_IN_TO_UPDATE_SURVEY_MESSAGE = 'Vui lòng đăng nhập để cập nhật khảo sát.';
export const SIGN_IN_TO_SUBMIT_SURVEY_MESSAGE = 'Vui lòng đăng nhập để nộp khảo sát.';
export const SIGN_IN_TO_UPLOAD_SURVEY_MESSAGE = 'Vui lòng đăng nhập để tải lên khảo sát.';
export const SIGN_IN_TO_SAVE_DRAFT_MESSAGE = 'Vui lòng đăng nhập để lưu bản nháp.';
export const UPLOAD_SESSION_UNAVAILABLE_MESSAGE = 'Phiên tải lên không khả dụng. Vui lòng thử lại.';
export const GPX_UPLOAD_SESSION_UNAVAILABLE_MESSAGE = 'Phiên tải lên GPX không khả dụng. Vui lòng thử lại.';
export const LOCATION_NOT_AVAILABLE_IN_BROWSER_MESSAGE = 'Tính năng định vị không khả dụng trên trình duyệt này.';
export const UNABLE_TO_LOAD_PHOTO_LIBRARY_MESSAGE = 'Không thể tải thư viện ảnh của bạn. Vui lòng thử lại.';
export const UNABLE_TO_LOAD_PHOTO_LIBRARY_SIMPLE_MESSAGE = 'Không thể tải thư viện ảnh. Vui lòng thử lại.';
export const MEDIA_LIBRARY_PERMISSION_REQUIRED_MESSAGE =
  'Cần cấp quyền truy cập thư viện đa phương tiện để chọn ảnh và video.';
export const MEDIA_LIBRARY_PERMISSION_REQUIRED_PHOTOS_MESSAGE =
  'Cần cấp quyền truy cập thư viện phương tiện để chọn ảnh.';
export const UNABLE_TO_READ_FILE_MESSAGE = 'Không thể đọc tệp này. Vui lòng chọn tệp khác.';
export const UNABLE_TO_RESTORE_DRAFT_MEDIA_MESSAGE =
  'Không thể khôi phục phương tiện bản nháp. Vui lòng mở lại trang này để thử lại.';
export const LIVE_GPS_UNAVAILABLE_MESSAGE = 'GPS trực tiếp không khả dụng. Vui lòng thử lại.';
export const UNABLE_TO_GET_LOCATION_FOR_END_POINT_MESSAGE = 'Không thể lấy vị trí cho điểm kết thúc.';
export const LOAD_EDITABLE_DRAFT_BEFORE_SUBMITTING_MESSAGE =
  'Vui lòng tải một bản nháp có thể chỉnh sửa trước khi nộp.';
export const SESSION_EXPIRED_MESSAGE = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại và thử lại.';
export const ENTER_MEDIA_DATETIME_MESSAGE =
  'Nhập ngày giờ ghi lại phương tiện, bao gồm cả múi giờ.';
export const USE_MEDIA_WITH_GPS_OR_LOCATION_MESSAGE =
  'Vui lòng sử dụng tệp có dữ liệu GPS hoặc chọn vị trí hiện tại của bạn.';
export const DRAFT_NO_VIDEO_MESSAGE = 'Bản nháp này không có video hợp lệ. Vui lòng chọn lại tệp.';
export const DRAFT_NO_UPLOADED_MEDIA_MESSAGE =
  'Bản nháp này không có phương tiện đã tải lên. Vui lòng chọn lại tệp.';
export const SURVEY_RESUBMITTED_SUCCESS_MESSAGE =
  'Gửi lại khảo sát thành công! Hồ sơ đang được đưa vào hàng đợi xử lý.';
export const UNABLE_TO_RESUBMIT_MESSAGE = 'Không thể gửi lại. Vui lòng thử chỉnh sửa thông tin trước.';
export const UPLOAD_ABORTED_BY_USER_MESSAGE = 'Tải lên bị hủy bởi người dùng.';
export const SERVER_NO_SUBMISSION_ID_MESSAGE = 'Máy chủ không trả về mã định danh hồ sơ khảo sát.';
export const SERVER_NO_SUBMISSION_STATUS_MESSAGE = 'Máy chủ không xác nhận trạng thái hồ sơ khảo sát.';
export const formatSubmissionNeedsAttentionMessage = (status: string) =>
  `Hồ sơ cần được xử lý (${status}). Vui lòng xem lại chi tiết và thử lại.`;
export const MEDIA_READ_FAILED_OR_EMPTY_MESSAGE = 'Tệp phương tiện đã chọn không thể đọc hoặc bị trống.';
export const MEDIA_READ_FAILED_MESSAGE = 'Không thể đọc tệp phương tiện đã chọn.';
export const MEDIA_EMPTY_MESSAGE = 'Tệp phương tiện đã chọn bị trống.';
export const GPX_READ_FAILED_MESSAGE = 'Không thể đọc tệp GPX đã chọn.';
export const GPX_EMPTY_MESSAGE = 'Tệp GPX đã chọn bị trống.';
export const UNABLE_TO_DETERMINE_VIDEO_SIZE_MESSAGE = 'Không thể xác định kích thước tệp video.';
export const VIDEO_FRAME_TIMEOUT_MESSAGE = 'Hết thời gian trích xuất khung hình video.';
export const VIDEO_ELEMENT_LOAD_FAILED_MESSAGE = 'Không thể tải đối tượng video để cắt khung hình.';
export const GALLERY_DEV_BUILD_REQUIRED_MESSAGE = 'Tính năng thư viện yêu cầu bản ứng dụng phát triển mới.';
export const CANNOT_OPEN_PHOTO_LIBRARY_MESSAGE = 'Không thể mở thư viện ảnh của bạn. Vui lòng thử lại.';
export const SELECT_VALID_GPX_FILE_MESSAGE = 'Vui lòng chọn tệp GPX hợp lệ (.gpx).';
export const CANNOT_OPEN_DOCUMENT_PICKER_MESSAGE = 'Không thể mở trình chọn tệp. Vui lòng thử lại.';
export const CANNOT_SAVE_DRAFT_MESSAGE = 'Không thể lưu bản nháp. Vui lòng thử lại.';

// ============================================================================
// Review & Revalidation Error Messages
// ============================================================================
export const SIGN_IN_TO_REVIEW_MESSAGE = 'Vui lòng đăng nhập để duyệt bài đóng góp.';
export const UNABLE_TO_LOAD_REVIEW_SUBMISSIONS_MESSAGE = 'Không thể tải danh sách bài đóng góp cần duyệt.';
export const REVIEW_WORKFLOW_PROVIDER_REQUIRED_MESSAGE =
  'useReviewWorkflow phải được sử dụng bên trong ReviewWorkflowProvider';
export const COULD_NOT_ACQUIRE_GPS_MESSAGE =
  'Không thể lấy tọa độ GPS hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.';
export const UNABLE_TO_GET_GPS_LOCATION_MESSAGE = 'Không thể lấy vị trí GPS hiện tại.';
export const CANNOT_READ_SELECTED_FILE_MESSAGE = 'Không thể đọc tệp đã chọn. Vui lòng chọn tệp khác.';
export const CAMERA_PERMISSION_REQUIRED_MESSAGE = 'Cần cấp quyền máy ảnh để chụp ảnh kiểm tra.';
export const CANNOT_OPEN_CAMERA_MESSAGE = 'Không thể mở máy ảnh.';
export const CANNOT_OPEN_MEDIA_LIBRARY_MESSAGE = 'Không thể mở thư viện phương tiện.';
export const COORDINATES_REQUIRED_EVIDENCE_MESSAGE = 'Cần có vị trí tọa độ để gửi bằng chứng.';
export const SUBMIT_EVIDENCE_FAILED_MESSAGE = 'Gửi bằng chứng thất bại. Vui lòng thử lại.';
export const CANNOT_RECORD_VOTE_MESSAGE = 'Không thể ghi nhận bình chọn. Vui lòng kiểm tra kết nối.';

// ============================================================================
// Wallet & Payment Messages
// ============================================================================
export const PAYMENT_FAILED_MESSAGE = 'Thanh toán thất bại. Vui lòng thử lại.';

// ============================================================================
// App Update Service Messages
// ============================================================================
export const formatGithubApiErrorMessage = (status: number, statusText: string) =>
  `API GitHub trả về mã trạng thái ${status}: ${statusText}`;
export const UNABLE_TO_CONNECT_UPDATE_SERVER_MESSAGE = 'Không thể kết nối đến máy chủ cập nhật.';

// ============================================================================
// API Client Error Messages
// ============================================================================
export const API_URL_NOT_CONFIGURED_MESSAGE = 'Chưa cấu hình EXPO_PUBLIC_API_URL.';
export const formatServerConnectionErrorMessage = (baseUrl: string, cause: string) =>
  `Không thể kết nối đến máy chủ tại ${baseUrl}: ${cause}`;