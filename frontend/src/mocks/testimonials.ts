import type { Testimonial } from '../types/testimonial';

// Dữ liệu tạm thời cho landing page. Khi backend sẵn sàng, thay mảng này
// bằng dữ liệu API và truyền vào TestimonialsSection qua prop `testimonials`.
export const testimonialMockData: Testimonial[] = [
  {
    id: 'testimonial-minh-anh',
    message: 'Hệ thống giúp mình sắp xếp minh chứng khoa học và không còn bỏ lỡ bất kỳ cột mốc quan trọng nào.',
    studentName: 'Nguyễn Minh Anh',
    faculty: 'Khoa Công nghệ thông tin',
    initials: 'MA',
  },
  {
    id: 'testimonial-bao-ngoc',
    message: 'Giao diện rất trực quan. Mình luôn biết cần hoàn thiện tiêu chí nào tiếp theo để đạt danh hiệu.',
    studentName: 'Trần Bảo Ngọc',
    faculty: 'Khoa Kinh tế',
    initials: 'BN',
  },
  {
    id: 'testimonial-hoang-phuc',
    message: 'Chỉ sau một học kỳ sử dụng, mình đã tự tin hoàn thiện hồ sơ Sinh viên 5 Tốt cấp trường.',
    studentName: 'Lê Hoàng Phúc',
    faculty: 'Khoa Ngoại ngữ',
    initials: 'HP',
  },
];
