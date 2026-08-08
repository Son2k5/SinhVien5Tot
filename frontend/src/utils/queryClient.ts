import { QueryClient } from '@tanstack/react-query';

/**
 * Cấu hình React Query Client được tối ưu cho tải cao (300-500 users đồng thời).
 * Giúp Cache dữ liệu trong RAM client, chống Spam Request và làm dịu tải Backend API.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Dữ liệu coi là mới trong 5 phút (tránh gọi API lại liên tục)
      gcTime: 10 * 60 * 1000,    // Giữ Cache trong bộ nhớ RAM 10 phút trước khi dọn dẹp
      refetchOnWindowFocus: false, // Tránh tự động reload dữ liệu khi chuyển Tab trình duyệt
      refetchOnReconnect: true,  // Tự làm tươi dữ liệu khi khôi phục mạng
      retry: 1,                  // Chỉ thử lại 1 lần nếu lỗi mạng nhẹ, tránh quá tải server
    },
    mutations: {
      retry: 0,                  // Không thử lại tự động khi gửi form sai
    },
  },
});
