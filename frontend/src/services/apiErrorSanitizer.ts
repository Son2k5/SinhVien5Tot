/**
 * Lớp bảo vệ & chuẩn hóa thông điệp lỗi từ Backend/Network.
 * Đảm bảo TUYỆT ĐỐI không để lộ stack trace, SQL query, lỗi DB hoặc mã lỗi nội bộ backend.
 */
export function sanitizeApiError(error: any): string {
  if (!error) {
    return 'Có lỗi xảy ra, vui lòng thử lại sau.';
  }

  // Nếu là lỗi string đã được format sạch
  if (typeof error === 'string') {
    return cleanMessage(error);
  }

  // Nếu là response từ Axios / Fetch
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Nếu backend trả về message hợp lệ
    if (data && typeof data.message === 'string') {
      return cleanMessage(data.message);
    }

    // ASP.NET Core ProblemDetails sử dụng trường `detail` cho lỗi nghiệp vụ.
    if (data && typeof data.detail === 'string') {
      return cleanMessage(data.detail);
    }

    // Áp dụng thông điệp an toàn theo HTTP Status Code
    switch (status) {
      case 400:
        return 'Thông tin yêu cầu không hợp lệ. Vui lòng kiểm tra lại.';
      case 401:
        return 'Email hoặc mật khẩu không chính xác.';
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này.';
      case 404:
        return 'Không tìm thấy dữ liệu yêu cầu.';
      case 409:
        return 'Email này đã được sử dụng trong hệ thống.';
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

  // Lỗi mất kết nối mạng
  if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  }

  return 'Có lỗi bất ngờ xảy ra, vui lòng thử lại.';
}

/**
 * Loại bỏ các từ khóa nhạy cảm kỹ thuật (SQL, Exception, Stack, NullReference, v.v.)
 */
function cleanMessage(msg: string): string {
  const sensitivePatterns = [
    /exception/i,
    /sql/i,
    /database/i,
    /stack trace/i,
    /nullreference/i,
    /system\./i,
    /ef core/i,
    /entity framework/i,
    /connection/i
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(msg)) {
      return 'Thao tác không thành công. Vui lòng thử lại sau.';
    }
  }

  return msg;
}
