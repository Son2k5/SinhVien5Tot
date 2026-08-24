import type { User } from '../types/auth';
import type { CriterionProgress, PortalContent, PortalContentSource, SystemFeature, WelcomeDashboard, YouthGalleryItem } from '../types/welcome';
import welcomeHero from '../assets/welcome-hero.jpg';
import campusActivity from '../assets/home-page/artboard-1.png';
import studentActivity from '../assets/hero.png';
import youthUnionCommunity from '../assets/home-page/youth-union-community-2026.jpg';

export interface WelcomeNewsItem extends PortalContent {
  imageUrl: string;
  category: string;
  eventStartAtUtc: string;
  location: string;
  content: string[];
}

const sourceLabels: Record<PortalContentSource, string> = {
  System: 'Hệ thống SV5T',
  University: 'Nhà trường',
  Faculty: 'Khoa',
  YouthUnion: 'Đoàn Thanh niên',
};

const fallbackImages = [welcomeHero, campusActivity, studentActivity];

export const mockSystemFeatures: SystemFeature[] = [
  { key: 'overview', title: 'Trang chào mừng', description: 'Tổng quan thông tin và cập nhật mới', route: '/dashboard', icon: 'home', group: 'Tổng quan', isAvailable: true },
  { key: 'profile', title: 'Hồ sơ cá nhân', description: 'Cập nhật thông tin và ảnh đại diện', route: '/dashboard/profile', icon: 'user-round', group: 'Cá nhân', isAvailable: true },
  { key: 'feed', title: 'Bảng tin', description: 'Theo dõi hoạt động cộng đồng SV5T', route: '/dashboard?view=feed', icon: 'newspaper', group: 'Tổng quan', isAvailable: false, badge: 'Sắp mở' },
  { key: 'achievements', title: 'Thành tích', description: 'Quản lý tiến độ 5 tiêu chí', route: '/dashboard?view=achievements', icon: 'award', group: 'Hồ sơ 5 tốt', isAvailable: false, badge: 'Sắp mở' },
  { key: 'evidence', title: 'Minh chứng', description: 'Nộp và theo dõi minh chứng', route: '/dashboard?view=evidence', icon: 'file-check', group: 'Hồ sơ 5 tốt', isAvailable: false, badge: 'Sắp mở' },
  { key: 'campaigns', title: 'Chiến dịch', description: 'Tham gia các đợt xét duyệt', route: '/dashboard?view=campaigns', icon: 'flag', group: 'Hoạt động', isAvailable: false, badge: 'Sắp mở' },
  { key: 'clubs', title: 'Nhóm & CLB', description: 'Kết nối cộng đồng sinh viên', route: '/dashboard?view=clubs', icon: 'users', group: 'Cộng đồng', isAvailable: false, badge: 'Sắp mở' },
];

export const mockCriteriaProgress: CriterionProgress[] = [
  { key: 'ethics', progress: 82, status: 'Đang hoàn thiện', completedRequirements: 9, totalRequirements: 11 },
  { key: 'study', progress: 74, status: 'Cần bổ sung', completedRequirements: 7, totalRequirements: 10 },
  { key: 'fitness', progress: 68, status: 'Đang rèn luyện', completedRequirements: 4, totalRequirements: 6 },
  { key: 'volunteer', progress: 90, status: 'Tiến độ tốt', completedRequirements: 9, totalRequirements: 10 },
  { key: 'integration', progress: 61, status: 'Cần cố gắng', completedRequirements: 5, totalRequirements: 8 },
];

export const mockYouthGallery: YouthGalleryItem[] = [
  {
    id: 'youth-union-green-sunday',
    title: 'Ngày chủ nhật xanh',
    caption: 'Đoàn viên cùng chuẩn bị sách và cây xanh trao tặng cộng đồng.',
    imageUrl: youthUnionCommunity,
    capturedAtUtc: '2026-08-13T16:20:00+07:00',
    location: 'Sân trường khu A',
  },
  {
    id: 'youth-union-summer-campaign',
    title: 'Sắc xanh tình nguyện',
    caption: 'Những khoảnh khắc đầy năng lượng trước giờ xuất quân.',
    imageUrl: welcomeHero,
    capturedAtUtc: '2026-08-10T07:30:00+07:00',
    location: 'Nhà văn hóa sinh viên',
  },
  {
    id: 'youth-union-campus-day',
    title: 'Kết nối tuổi trẻ',
    caption: 'Gặp gỡ, sẻ chia và cùng nhau tạo nên một ngày hội đáng nhớ.',
    imageUrl: campusActivity,
    capturedAtUtc: '2026-08-08T09:15:00+07:00',
    location: 'Khuôn viên trung tâm',
  },
  {
    id: 'youth-union-five-good',
    title: 'Khoảnh khắc 5 tốt',
    caption: 'Sinh viên lưu lại dấu ấn trên hành trình rèn luyện toàn diện.',
    imageUrl: studentActivity,
    capturedAtUtc: '2026-08-05T17:40:00+07:00',
    location: 'Hội trường lớn',
  },
];

export const mockNews: WelcomeNewsItem[] = [
  {
    id: 'mock-summer-campaign',
    type: 'News',
    source: 'YouthUnion',
    title: 'Chiến dịch Mùa hè xanh 2026',
    summary: 'Cùng lan tỏa tinh thần xung kích, tình nguyện và kiến tạo những giá trị tích cực cho cộng đồng.',
    route: '/news/mock-summer-campaign',
    icon: 'heart-handshake',
    isFeatured: true,
    publishedAtUtc: '2026-08-12T07:30:00Z',
    imageUrl: welcomeHero,
    category: 'Hoạt động tình nguyện',
    eventStartAtUtc: '2026-08-25T07:30:00+07:00',
    location: 'Nhà văn hóa sinh viên',
    content: [
      'Chiến dịch Mùa hè xanh là cơ hội để sinh viên đóng góp sức trẻ vào các hoạt động cộng đồng thiết thực.',
      'Chương trình năm nay tập trung vào hỗ trợ học tập, xây dựng không gian xanh và đồng hành cùng thanh thiếu nhi tại địa phương.',
      'Thông tin đăng ký và lịch hoạt động chi tiết sẽ được cập nhật trên hệ thống Sinh viên 5 tốt.',
    ],
  },
  {
    id: 'mock-research-workshop',
    type: 'News',
    source: 'University',
    title: 'Workshop: Kỹ năng nghiên cứu dành cho sinh viên',
    summary: 'Trang bị phương pháp xây dựng đề tài, tìm kiếm tài liệu và trình bày kết quả nghiên cứu khoa học.',
    route: '/news/mock-research-workshop',
    icon: 'graduation-cap',
    isFeatured: true,
    publishedAtUtc: '2026-08-10T09:00:00Z',
    imageUrl: campusActivity,
    category: 'Học thuật',
    eventStartAtUtc: '2026-08-28T18:00:00+07:00',
    location: 'Hội trường A',
    content: [
      'Workshop mang đến lộ trình thực hành từ việc lựa chọn vấn đề đến cách trình bày một báo cáo nghiên cứu hoàn chỉnh.',
      'Sinh viên được trao đổi trực tiếp với giảng viên và các nhóm nghiên cứu giàu kinh nghiệm.',
      'Số lượng tham dự có giới hạn và được ưu tiên theo thời gian đăng ký.',
    ],
  },
  {
    id: 'mock-sv5t-festival',
    type: 'News',
    source: 'YouthUnion',
    title: 'Ngày hội Sinh viên 5 tốt',
    summary: 'Không gian kết nối, trải nghiệm và ghi nhận những nỗ lực rèn luyện toàn diện của sinh viên.',
    route: '/news/mock-sv5t-festival',
    icon: 'award',
    isFeatured: true,
    publishedAtUtc: '2026-08-08T08:00:00Z',
    imageUrl: studentActivity,
    category: 'Sự kiện',
    eventStartAtUtc: '2026-09-01T08:00:00+07:00',
    location: 'Sân vận động trường',
    content: [
      'Ngày hội Sinh viên 5 tốt quy tụ nhiều hoạt động trải nghiệm gắn với năm nhóm tiêu chí rèn luyện.',
      'Người tham dự có thể gặp gỡ các sinh viên tiêu biểu, câu lạc bộ và đội nhóm đang hoạt động tại trường.',
      'Chương trình mở cửa miễn phí cho toàn thể sinh viên.',
    ],
  },
  {
    id: 'mock-integration-seminar',
    type: 'News',
    source: 'Faculty',
    title: 'Hội thảo kỹ năng hội nhập và phát triển bản thân',
    summary: 'Cập nhật kỹ năng cần thiết để sinh viên tự tin thích nghi trong môi trường học tập và làm việc hiện đại.',
    route: '/news/mock-integration-seminar',
    icon: 'users',
    isFeatured: false,
    publishedAtUtc: '2026-08-05T08:00:00Z',
    imageUrl: campusActivity,
    category: 'Kỹ năng',
    eventStartAtUtc: '2026-09-05T13:30:00+07:00',
    location: 'Phòng hội thảo B2',
    content: [
      'Hội thảo tập trung vào tư duy chủ động, kỹ năng giao tiếp và khả năng làm việc trong môi trường đa văn hóa.',
      'Các tình huống thực tế giúp sinh viên nhìn rõ điểm mạnh và xây dựng kế hoạch phát triển cá nhân.',
    ],
  },
  {
    id: 'mock-honour-ceremony',
    type: 'News',
    source: 'University',
    title: 'Tuyên dương Sinh viên 5 tốt tiêu biểu năm học 2025–2026',
    summary: 'Những gương mặt xuất sắc lan tỏa giá trị tốt đẹp và tinh thần nỗ lực đến cộng đồng sinh viên.',
    route: '/news/mock-honour-ceremony',
    icon: 'award',
    isFeatured: false,
    publishedAtUtc: '2026-08-02T08:00:00Z',
    imageUrl: studentActivity,
    category: 'Tuyên dương',
    eventStartAtUtc: '2026-09-10T18:30:00+07:00',
    location: 'Hội trường lớn',
    content: [
      'Lễ tuyên dương là dịp ghi nhận những sinh viên có thành tích nổi bật trên cả năm tiêu chí.',
      'Các câu chuyện truyền cảm hứng sẽ được giới thiệu xuyên suốt chương trình.',
    ],
  },
  {
    id: 'mock-club-fair',
    type: 'News',
    source: 'YouthUnion',
    title: 'Ngày hội câu lạc bộ: Tìm cộng đồng dành cho bạn',
    summary: 'Khám phá các câu lạc bộ học thuật, nghệ thuật, thể thao và hoạt động xã hội ngay trong khuôn viên trường.',
    route: '/news/mock-club-fair',
    icon: 'users',
    isFeatured: false,
    publishedAtUtc: '2026-08-01T08:30:00Z',
    imageUrl: campusActivity,
    category: 'Cộng đồng',
    eventStartAtUtc: '2026-09-15T08:00:00+07:00',
    location: 'Quảng trường sinh viên',
    content: [
      'Ngày hội quy tụ các câu lạc bộ và đội nhóm đang hoạt động tại trường, mang đến không gian trải nghiệm cởi mở cho sinh viên.',
      'Bạn có thể gặp gỡ thành viên, thử sức với hoạt động mẫu và đăng ký đồng hành cùng cộng đồng phù hợp với sở thích.',
    ],
  },
  {
    id: 'mock-campus-run',
    type: 'News',
    source: 'University',
    title: 'Campus Run 2026: Chạy cùng nhau, khỏe mỗi ngày',
    summary: 'Đường chạy trẻ trung kết nối sinh viên và lan tỏa thói quen vận động tích cực trong toàn trường.',
    route: '/news/mock-campus-run',
    icon: 'activity',
    isFeatured: false,
    publishedAtUtc: '2026-07-30T07:00:00Z',
    imageUrl: studentActivity,
    category: 'Thể thao',
    eventStartAtUtc: '2026-09-20T06:00:00+07:00',
    location: 'Sân vận động trường',
    content: [
      'Campus Run mở nhiều cự ly phù hợp cho cả người mới bắt đầu lẫn sinh viên đã duy trì thói quen chạy bộ.',
      'Hoàn thành đường chạy cũng là cơ hội tích lũy trải nghiệm cho tiêu chí Thể lực tốt trong hành trình Sinh viên 5 tốt.',
    ],
  },
  {
    id: 'mock-book-exchange',
    type: 'News',
    source: 'Faculty',
    title: 'Trạm sách sẻ chia: Trao một cuốn, nhận nhiều cảm hứng',
    summary: 'Mang sách cũ đến trao đổi và cùng xây dựng một góc đọc mở dành cho cộng đồng sinh viên.',
    route: '/news/mock-book-exchange',
    icon: 'graduation-cap',
    isFeatured: false,
    publishedAtUtc: '2026-07-27T09:00:00Z',
    imageUrl: youthUnionCommunity,
    category: 'Học tập',
    eventStartAtUtc: '2026-09-24T09:00:00+07:00',
    location: 'Sảnh thư viện trung tâm',
    content: [
      'Mỗi cuốn sách được trao đi sẽ tiếp tục hành trình mới và góp phần tạo nên văn hóa đọc gần gũi trong sinh viên.',
      'Chương trình tiếp nhận sách giáo trình, kỹ năng, văn học và ngoại ngữ còn trong tình trạng sử dụng tốt.',
    ],
  },
];

export function resolveCriteriaProgress(criteria?: CriterionProgress[]): CriterionProgress[] {
  return criteria?.length ? criteria : mockCriteriaProgress;
}

export function resolveNewsItems(news?: PortalContent[]): WelcomeNewsItem[] {
  const source = news?.length ? news : mockNews;
  return source.map((item, index) => ({
    ...item,
    imageUrl: item.imageUrl || fallbackImages[index % fallbackImages.length],
    category: item.category || sourceLabels[item.source],
    eventStartAtUtc: item.eventStartAtUtc || item.publishedAtUtc,
    location: item.location || 'Khuôn viên trường',
    content: item.content?.length ? item.content : [
      item.summary,
      'Nội dung chi tiết đang được cập nhật từ hệ thống. Bạn có thể quay lại sau để theo dõi thông tin mới nhất.',
    ],
  }));
}

export function resolveYouthGallery(items?: YouthGalleryItem[]): YouthGalleryItem[] {
  return items?.length ? items : mockYouthGallery;
}

export function createMockWelcomeDashboard(user: User): WelcomeDashboard {
  return {
    user: {
      id: user.id,
      displayName: user.name || user.email.split('@')[0],
      email: user.email,
      avatarUrl: user.avatarUrl,
      faculty: 'Sinh viên',
    },
    features: mockSystemFeatures,
    notifications: [],
    news: mockNews,
    criteriaProgress: mockCriteriaProgress,
    youthGallery: mockYouthGallery,
    updatedAtUtc: new Date().toISOString(),
  };
}
