import type { IconName } from '../common/BrandLogo';

export interface CriterionItem {
  number: string;
  title: string;
  description: string;
  icon: IconName;
  tone: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: IconName;
}

export interface GalleryItem {
  src: string;
  alt: string;
  label: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const landingStats: StatItem[] = [
  { value: '2.000+', label: 'Sinh viên tham gia' },
  { value: '10.000+', label: 'Minh chứng đã nộp' },
  { value: '85%', label: 'Hoàn thành đúng hạn' },
  { value: '98%', label: 'Sinh viên hài lòng' },
];

export const landingCriteria: CriterionItem[] = [
  { number: '01', title: 'Đạo đức tốt', description: 'Rèn luyện bản lĩnh, trách nhiệm và lối sống đẹp trong cộng đồng.', icon: 'heart', tone: 'violet' },
  { number: '02', title: 'Học tập tốt', description: 'Không ngừng học hỏi, sáng tạo và chinh phục những mục tiêu mới.', icon: 'book', tone: 'blue' },
  { number: '03', title: 'Thể lực tốt', description: 'Duy trì thể chất bền bỉ, tinh thần tích cực và lối sống lành mạnh.', icon: 'activity', tone: 'green' },
  { number: '04', title: 'Tình nguyện tốt', description: 'Lan tỏa sự tử tế bằng những hành động ý nghĩa vì cộng đồng.', icon: 'users', tone: 'orange' },
  { number: '05', title: 'Hội nhập tốt', description: 'Chủ động ngoại ngữ, kỹ năng số và tư duy công dân toàn cầu.', icon: 'trend', tone: 'cyan' },
];

export const landingFeatures: FeatureItem[] = [
  { title: 'Hồ sơ số thông minh', description: 'Tất cả thành tích, hoạt động và minh chứng được lưu trữ tập trung, dễ dàng tra cứu.', icon: 'cloud' },
  { title: 'Theo dõi tiến độ', description: 'Biết chính xác tiêu chí đã đạt và nội dung cần bổ sung qua bảng tiến độ trực quan.', icon: 'target' },
  { title: 'Nộp minh chứng online', description: 'Tải lên tài liệu mọi lúc, mọi nơi và nhận phản hồi trực tiếp từ hội đồng.', icon: 'upload' },
  { title: 'Xét duyệt minh bạch', description: 'Quy trình rõ ràng, trạng thái cập nhật theo thời gian thực và bảo mật dữ liệu.', icon: 'shield' },
  { title: 'Nhắc việc đúng lúc', description: 'Thông báo mốc thời gian, hồ sơ cần bổ sung và kết quả mới để bạn không bỏ lỡ cơ hội.', icon: 'bell' },
  { title: 'Kết quả dễ tra cứu', description: 'Xem lịch sử xét duyệt, phản hồi và kết quả công nhận trong cùng một không gian.', icon: 'file-check' },
];

export const landingGallery: GalleryItem[] = [
  { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=82', alt: 'Sinh viên tham gia hoạt động tình nguyện', label: 'Mùa hè xanh' },
  { src: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=800&q=82', alt: 'Nhóm sinh viên trẻ cùng hoạt động', label: 'Sức trẻ tình nguyện' },
  { src: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=82', alt: 'Sinh viên học tập tại trường', label: 'Học tập và sáng tạo' },
  { src: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=82', alt: 'Khuôn viên trường đại học', label: 'Hội nhập và trưởng thành' },
];

export const landingFaqs: FaqItem[] = [
  { question: 'Sinh viên 5 Tốt là danh hiệu gì?', answer: 'Đây là danh hiệu cao quý ghi nhận sinh viên phát triển toàn diện ở 5 tiêu chí: đạo đức, học tập, thể lực, tình nguyện và hội nhập.' },
  { question: 'Làm thế nào để đăng ký tham gia?', answer: 'Bạn chỉ cần tạo tài khoản bằng email sinh viên, hoàn thiện hồ sơ cá nhân và đăng ký tham gia chương trình trên hệ thống.' },
  { question: 'Minh chứng cần nộp ở định dạng nào?', answer: 'Hệ thống hỗ trợ hình ảnh và PDF. Mỗi tệp có dung lượng tối đa 10 MB để quá trình tải lên luôn nhanh chóng.' },
  { question: 'Thời gian xét duyệt minh chứng là bao lâu?', answer: 'Thông thường hội đồng sẽ phản hồi trong vòng 5–7 ngày làm việc. Bạn có thể theo dõi trạng thái ngay trên hồ sơ.' },
  { question: 'Tôi có thể chỉnh sửa minh chứng sau khi nộp không?', answer: 'Có. Bạn có thể cập nhật minh chứng trước thời điểm hội đồng bắt đầu xét duyệt hồ sơ.' },
];
