import axios from 'axios';

/**
 * Bảng ánh xạ Whitelist: Error Code chuẩn từ Backend -> Thông điệp tiếng Việt an toàn
 */
const KNOWN_ERROR_CODES: Record<string, string> = {
  invalid_session: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
  idle_timeout: 'Phiên đăng nhập đã kết thúc do không hoạt động.',
  unauthorized: 'Yêu cầu đăng nhập để tiếp tục.',
  forbidden: 'Bạn không có quyền thực hiện thao tác này.',
  not_found: 'Không tìm thấy dữ liệu yêu cầu.',
  user_not_found: 'Không tìm thấy thông tin tài khoản.',
  profile_not_found: 'Hồ sơ cá nhân chưa được tạo.',
  student_code_taken: 'Mã sinh viên đã được sử dụng trong hệ thống.',
  invalid_challenge: 'Mã xác thực không hợp lệ hoặc đã hết hạn.',
  invalid_avatar_size: 'Kích thước ảnh đại diện không hợp lệ (tối đa 5 MB).',
  unsupported_avatar_format: 'Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.',
  rate_limited: 'Bạn đã thao tác quá nhiều lần. Vui lòng đợi trong giây lát.',
  email_queue_full: 'Hệ thống gửi email đang bận. Vui lòng thử lại sau.',
  email_queue_unavailable: 'Dịch vụ gửi email tạm thời gián đoạn. Vui lòng thử lại sau.',
  avatar_storage_unavailable: 'Dịch vụ lưu trữ ảnh tạm thời không khả dụng. Vui lòng thử lại sau.',
  validation_error: 'Thông tin cung cấp không đúng định dạng yêu cầu.',
  internal_error: 'Hệ thống đang bảo trì hoặc có sự cố tạm thời. Vui lòng thử lại sau.',
};

/**
 * Fallback Generic messages an toàn theo HTTP Status Code (ngữ cảnh chung)
 */
function getGenericStatusMessage(status: number, requestUrl?: string): string {
  switch (status) {
    case 400:
      return 'Thông tin yêu cầu không hợp lệ. Vui lòng kiểm tra lại.';
    case 401:
      // Phân biệt ngữ cảnh: Endpoint đăng nhập vs Endpoint yêu cầu phiên làm việc
      return requestUrl?.includes('/auth/login')
        ? 'Email hoặc mật khẩu không chính xác.'
        : 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
    case 403:
      return 'Bạn không có quyền thực hiện thao tác này.';
    case 404:
      return 'Không tìm thấy dữ liệu yêu cầu.';
    case 409:
      return 'Dữ liệu bị trùng lặp hoặc xung đột.';
    case 429:
      return 'Bạn đã thao tác quá nhiều lần. Vui lòng đợi trong giây lát.';
    case 500:
    case 502:
    case 503:
    case 504:
    default:
      return 'Hệ thống đang bảo trì hoặc có sự cố tạm thời. Vui lòng thử lại sau.';
  }
}

/**
 * Kiểm tra Whitelist độ an toàn của chuỗi văn bản:
 * Chỉ cho phép các câu thuần túy tiếng Việt/chữ thông thường, không chứa bất kỳ dấu vết kỹ thuật/stack trace/path/SQL.
 */
function isSafeUserFacingMessage(text: unknown): text is string {
  if (typeof text !== 'string') return false;
  const str = text.trim();
  if (str.length === 0 || str.length > 250) return false;

  // Nếu chứa các ký tự/cấu trúc của file path, code, url, json object, stack trace -> KHÔNG AN TOÀN
  const unsafePatterns = [
    /[\\/{}[\]<>|]/,             // Ký tự path, code, json, tag
    /at\s+[A-Za-z0-9_.]+\(/i,     // Stack trace: "at Program.Main("
    /\b(exception|error|stack|trace|nullreference|unhandled|econn|timeout|socket|refused)\b/i,
    /\b(sql|mysql|npgsql|oracle|ora-|select|insert|update|delete|table|column|database|query)\b/i,
    /\b(system\.|microsoft\.|sv5t\.|aspnet|kestrel|efcore|entityframework)\b/i,
    /https?:\/\//i,               // URL
    /\bline\s+\d+\b/i,            // "Line 0"
    /\bbyteposition\b/i,          // "BytePosition"
  ];

  for (const pattern of unsafePatterns) {
    if (pattern.test(str)) {
      return false;
    }
  }

  return true;
}

/**
 * Bộ lọc bảo vệ & chuẩn hóa thông điệp lỗi (Whitelist Architecture).
 * Đảm bảo 100% không bao giờ để lọt chi tiết kỹ thuật/hệ thống ra giao diện người dùng.
 */
export function sanitizeApiError(error: unknown): string {
  if (!error) {
    return 'Có lỗi xảy ra, vui lòng thử lại sau.';
  }

  // Nếu là lỗi Axios response từ server
  if (axios.isAxiosError(error) && error.response) {
    const status = error.response.status;
    const data = error.response.data as Record<string, unknown> | undefined;
    const requestUrl = error.config?.url;

    // 1. Ưu tiên Whitelist theo Error Code chuẩn từ backend
    const errorCode = typeof data?.code === 'string' ? data.code : undefined;
    if (errorCode && KNOWN_ERROR_CODES[errorCode]) {
      return KNOWN_ERROR_CODES[errorCode];
    }

    // 2. Nếu Backend trả về detail / message thỏa mãn Whitelist an toàn
    const detail = typeof data?.detail === 'string' ? data.detail : undefined;
    if (detail && isSafeUserFacingMessage(detail)) {
      return detail;
    }

    const message = typeof data?.message === 'string' ? data.message : undefined;
    if (message && isSafeUserFacingMessage(message)) {
      return message;
    }

    // 3. Fallback an toàn theo HTTP Status Code & Ngữ cảnh request
    return getGenericStatusMessage(status, requestUrl);
  }

  // Lỗi mất kết nối mạng hoặc timeout
  if (axios.isAxiosError(error)) {
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Yêu cầu quá thời gian chờ. Vui lòng thử lại sau.';
    }
  }

  // Nếu là chuỗi string truyền trực tiếp
  if (typeof error === 'string' && isSafeUserFacingMessage(error)) {
    return error;
  }

  if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
    return error.message;
  }

  // Fallback tối thượng an toàn
  return 'Có lỗi xảy ra, vui lòng thử lại sau.';
}
