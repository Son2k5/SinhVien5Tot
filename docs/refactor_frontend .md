1. REFACTOR_PROGRESS.md (Bảng scan toàn bộ codebase)
File tiến độ đã được tạo tại 

REFACTOR_PROGRESS.md
. Dưới đây là bảng tổng hợp trạng thái các module:

Page / Feature	File hiện tại	Số dòng	Trạng thái	Cần tách (types / service / hook / components)
Feature: staff	src/features/staff/	~1.400	✅ DONE	Đã hoàn tất: staff.types.ts, staff.service.ts, useStaff.ts, 7 subcomponents, StaffPage.tsx
Feature: staff-me	src/features/staff-me/	~850	✅ DONE	Đã hoàn tất: staff-me.types.ts, staff-me.service.ts, useStaffMe.ts, 3 subcomponents, StaffProfilePage.tsx
Feature: notifications	src/features/notifications/	~750	✅ DONE	Đã hoàn tất: notification.types.ts, notification.service.ts, useNotifications.ts, 5 subcomponents, NotificationsPage.tsx
Feature: news	src/features/news/	~1.950	✅ DONE	Đã hoàn tất: news.types.ts, news.service.ts, useNews.ts, 6 subcomponents, 4 pages
Feature: chat	src/features/chat/	~900	✅ DONE	Đã hoàn tất: chat.types.ts, chat.service.ts, useChat.ts, useChatRealtime.ts, 3 subcomponents, ChatPage.tsx
Admin: Feature Stubs	src/pages/admin/AdminFeaturePage.tsx	61	✅ DONE	Router stub tĩnh hiển thị placeholder cho roles, settings, reports... (< 150 dòng)
Feature: landing	src/pages/LandingPage.tsx
src/components/landing/* (13 files)
src/hooks/landing/useReveal.ts	55
~750
22	⚠️ PARTIAL	Gom về features/landing: landing.types.ts, useReveal.ts, components, index.ts. pages/LandingPage.tsx mỏng chỉ compose
Feature: auth	src/pages/AuthPage.tsx
src/components/auth/* (5 files)
src/hooks/auth/* (3 files)
src/services/authService.ts
src/types/auth.ts	165
415
221
179
59	⚠️ PARTIAL	Gom về features/auth: auth.types.ts, auth.service.ts, useAuthSession, useAuthHandlers, useAuthSlideshow, components, index.ts. Rút gọn AuthPage.tsx < 120 dòng
Feature: user-profile	src/pages/UserProfilePage.tsx
src/components/profile/UserProfileForm.tsx
src/hooks/profile/useUserProfile.ts
src/services/userProfileService.ts
src/types/userProfile.ts	92
303
38
43
48	⚠️ PARTIAL	Gom về features/user-profile: user-profile.types.ts, user-profile.service.ts, useUserProfile.ts, chia nhỏ UserProfileForm (303 dòng), index.ts. UserProfilePage.tsx < 80 dòng
Feature: home-dashboard	src/pages/HomePage.tsx
src/components/dashboard/home/* (9 files)
src/components/dashboard/SystemLauncher.tsx
src/hooks/dashboard/* (2 files)
src/services/welcomeService.ts
src/types/welcome.ts	112
~1.450
195
130
13
45	⚠️ PARTIAL	Gom về features/home-dashboard: home-dashboard.types.ts, home-dashboard.service.ts, hooks, components, index.ts. HomePage.tsx < 100 dòng
Feature: admin-dashboard	src/pages/admin/AdminDashboardPage.tsx
src/components/admin/dashboard/* (10 files)
src/hooks/admin/useAdminDashboard.ts
src/services/admin/adminDashboardService.ts	127
~720
171
58	⚠️ PARTIAL	Gom về features/admin-dashboard: admin-dashboard.types.ts, admin-dashboard.service.ts, useAdminDashboard.ts, components, index.ts. AdminDashboardPage.tsx < 90 dòng
Feature: campaigns (Admin)	src/pages/admin/CampaignListPage.tsx
src/pages/admin/CampaignDetailPage.tsx
src/components/admin/campaigns/CampaignFormModal.tsx
src/components/admin/campaigns/CampaignStatusModal.tsx
src/hooks/admin/useCampaigns.ts
src/services/admin/campaignService.ts
src/types/admin/campaign.ts	922
432
705
188
80
50
39	❌ TODO	Monolith khổng lồ: tách features/campaigns: campaign.types.ts, campaign.service.ts, useCampaigns.ts. Tách CampaignTable, CampaignFilterBar, CampaignStatsCards, CampaignPagination, tách nhỏ CampaignFormModal (705 dòng) & CampaignDetail. Rút gọn 2 page < 120 dòng
Feature: standards (Admin)	src/pages/admin/StandardSetListPage.tsx
src/pages/admin/StandardSetDetailPage.tsx
src/components/admin/standards/CriterionFormModal.tsx
src/components/admin/standards/CriterionItemModal.tsx
src/components/admin/standards/CriterionTree.tsx
src/components/admin/standards/StandardSetFormModal.tsx
src/components/admin/standards/StandardGroupModal.tsx
src/hooks/admin/useStandards.ts
src/services/admin/standardService.ts
src/services/admin/criterionService.ts
src/types/admin/standard.ts	1.417
571
745
684
349
332
287
180
80
40
85	❌ TODO	Monolith cực lớn: tách features/standards: standard.types.ts, standard.service.ts, useStandards.ts. Tách StandardSetTable, StandardSetFilterBar, StandardSetStatsCards, tách nhỏ các Modal > 600 dòng. Rút gọn 2 page < 120 dòng
Feature: students (Admin)	src/pages/admin/StudentListPage.tsx
src/pages/admin/StudentDetailPage.tsx
src/components/admin/students/StudentDetailModal.tsx
src/components/admin/students/StudentFilterModal.tsx
src/components/admin/students/StudentLockDialog.tsx
src/components/admin/students/BatchDeleteStudentDialog.tsx
src/components/admin/students/StudentBadges.tsx
src/components/admin/students/StudentReviewModal.tsx
src/components/admin/students/StudentDeleteDialog.tsx
src/hooks/admin/useStudents.ts
src/services/admin/studentService.ts
src/types/admin/student.ts	958
467
693
142
127
112
111
58
44
70
57
45	❌ TODO	Monolith lớn: tách features/students: student.types.ts, student.service.ts, useStudents.ts. Tách StudentTable, StudentFilterBar, StudentStatsCards, StudentPagination, tách nhỏ StudentDetailModal (693 dòng) & DetailPage. Rút gọn 2 page < 120 dòng
Feature: applications (Admin)	src/pages/admin/ApplicationListPage.tsx
src/pages/admin/EvidenceReviewWorkspacePage.tsx
src/components/admin/applications/ApplicationDetailModal.tsx
src/components/admin/applications/EvidenceViewerModal.tsx
src/components/admin/evidence/StudentEvidenceGroupModal.tsx
src/components/admin/applications/EvidenceReviewQuickModal.tsx
src/components/admin/applications/PdfEvidenceViewer.tsx
src/hooks/admin/useApplicationReview.ts
src/services/admin/applicationReviewService.ts
src/types/admin/application.ts	1.095
1.328
1.465
583
412
241
86
95
64
103	❌ TODO	Monolith phức tạp nhất: tách features/applications: application.types.ts, application.service.ts, useApplications.ts, useEvidenceReview.ts. Tách ApplicationTable, ApplicationFilterBar, ApplicationStatsCards, EvidenceReviewTable, EvidenceReviewFilterBar. Tách nhỏ ApplicationDetailModal (1.465 dòng) & EvidenceViewerModal (583 dòng). Rút gọn 2 page < 130 dòng
Feature: student-portal	src/pages/student/StudentEvidenceSubmissionPage.tsx
src/pages/student/StudentMyApplicationsPage.tsx
src/pages/student/StudentCampaignsPage.tsx
src/components/student/CriterionEvidenceForm.tsx
src/components/student/MyApplicationCards.tsx
src/components/student/CreateApplicationTypeModal.tsx
src/components/student/DraftApplicationsSection.tsx
src/components/student/StandardGroupTabs.tsx
src/components/student/ApplicationProcessStepper.tsx
src/components/student/CampaignLevelTabs.tsx
src/components/student/EmptyCampaignNotice.tsx
src/services/studentService.ts
src/types/student.ts	756
304
243
724
227
202
185
136
104
42
38
150
124	❌ TODO	Monolith nộp minh chứng sinh viên: gom về features/student-portal: student-portal.types.ts, student-portal.service.ts, useStudentPortal.ts. Tách nhỏ CriterionEvidenceForm (724 dòng), tổ chức lại components. Rút gọn 3 page < 120 dòng
Legacy Code Chết	src/pages/NewsDetailPage.tsx	89	❌ DEAD CODE	File trùng lặp không được import ở đâu (đã có features/news/NewsDetailPage.tsx), xóa trong bước cleanup
2. Convention Rút Ra Từ Feature Mẫu (staff & notifications)
Naming & Filesystem: Mỗi feature đặt tại src/features/<feature>/ với 4 thư mục con bắt buộc: types/<feature>.types.ts, services/<feature>.service.ts, hooks/use<Feature>.ts, components/ (kèm index.ts), và index.ts public exports toàn module.
Types: Chỉ khai báo interface, type, enum, class <Feature>ApiError kế thừa Error và hàm pure parse<Feature>ApiError(err: unknown).
Services: 1 hàm = 1 HTTP call, sử dụng axiosClient từ src/api/axiosClient và hằng số endpoint từ src/api/endpoints.ts. Không gọi hook, không toast, bắt lỗi bằng try/catch và ném ra <Feature>ApiError.
Hooks: Sử dụng TanStack Query (useQuery, useMutation), khai báo query key factory tập trung (<feature>QueryKeys = { ... } as const). Hook trả về object chứa data, loading, error và mutation triggers; tự động invalidate cache qua queryClient.
Components & Pages: Component nhận props thuần túy, phát sự kiện qua callback props, tuyệt đối không import service. Page chỉ quản lý URL search params, compose hook và components, giữ độ dài < ~150 dòng.
3. Plan Mapping File Cũ → File Mới (Sắp xếp theo thứ tự thực thi)
Thứ tự thực hiện: Bắt đầu từ feature độc lập, ít phụ thuộc → feature phức tạp, dùng chung nhiều nơi sau.

🔹 Đợt 1: Các Feature Độc Lập & Xác Thực
Feature landing

File cũ: src/components/landing/* (13 files), src/hooks/landing/useReveal.ts
File mới:
src/features/landing/types/landing.types.ts
src/features/landing/hooks/useReveal.ts
src/features/landing/components/* (LandingHero, Features, Stats, Faq, Process, v.v.)
src/features/landing/index.ts
Page: src/pages/LandingPage.tsx (< 60 dòng) compose từ src/features/landing.
Feature auth

File cũ: src/types/auth.ts, src/services/authService.ts, src/hooks/auth/*, src/components/auth/*, src/pages/AuthPage.tsx (165 dòng)
File mới:
src/features/auth/types/auth.types.ts
src/features/auth/services/auth.service.ts
src/features/auth/hooks/useAuthSession.ts, useAuthHandlers.ts, useSlideshow.ts
src/features/auth/components/LoginForm.tsx, RegisterForm.tsx, ForgotPasswordForm.tsx, ResetPasswordForm.tsx, OtpModal.tsx
src/features/auth/index.ts
Page: src/pages/AuthPage.tsx (< 110 dòng) compose từ src/features/auth.
Feature user-profile

File cũ: src/types/userProfile.ts, src/services/userProfileService.ts, src/hooks/profile/useUserProfile.ts, src/components/profile/UserProfileForm.tsx (303 dòng)
File mới:
src/features/user-profile/types/user-profile.types.ts
src/features/user-profile/services/user-profile.service.ts
src/features/user-profile/hooks/useUserProfile.ts
src/features/user-profile/components/ProfileGeneralForm.tsx, ProfileSecurityForm.tsx, ProfileHeaderCard.tsx
src/features/user-profile/index.ts
Page: src/pages/UserProfilePage.tsx (< 80 dòng) compose từ src/features/user-profile.
🔹 Đợt 2: Các Dashboard
Feature home-dashboard

File cũ: src/types/welcome.ts, src/types/feedback.ts, src/services/welcomeService.ts, src/hooks/dashboard/*, src/components/dashboard/home/*, SystemLauncher.tsx, VerificationModal.tsx
File mới:
src/features/home-dashboard/types/home-dashboard.types.ts
src/features/home-dashboard/services/home-dashboard.service.ts
src/features/home-dashboard/hooks/useWelcomeDashboard.ts, useLauncher.ts
src/features/home-dashboard/components/* (WelcomeBanner, CriteriaSections, DiscoverySections, SystemLauncher, v.v.)
src/features/home-dashboard/index.ts
Page: src/pages/HomePage.tsx (< 90 dòng) compose từ src/features/home-dashboard.
Feature admin-dashboard

File cũ: src/services/admin/adminDashboardService.ts, src/hooks/admin/useAdminDashboard.ts, src/components/admin/dashboard/* (10 files)
File mới:
src/features/admin-dashboard/types/admin-dashboard.types.ts
src/features/admin-dashboard/services/admin-dashboard.service.ts
src/features/admin-dashboard/hooks/useAdminDashboard.ts
src/features/admin-dashboard/components/* (KpiGrid, FilterBar, RankingsTable, DonutChart, BottleneckCard...)
src/features/admin-dashboard/index.ts
Page: src/pages/admin/AdminDashboardPage.tsx (< 80 dòng) compose từ src/features/admin-dashboard.
🔹 Đợt 3: Các Monolith Quản Trị Admin
Feature campaigns (Admin)

File cũ: src/types/admin/campaign.ts, src/services/admin/campaignService.ts, src/hooks/admin/useCampaigns.ts, CampaignListPage.tsx (922 dòng), CampaignDetailPage.tsx (432 dòng), CampaignFormModal.tsx (705 dòng), CampaignStatusModal.tsx (188 dòng)
File mới:
src/features/campaigns/types/campaign.types.ts
src/features/campaigns/services/campaign.service.ts
src/features/campaigns/hooks/useCampaigns.ts
src/features/campaigns/components/CampaignTable.tsx, CampaignFilterBar.tsx, CampaignStatsCards.tsx, CampaignPagination.tsx, CampaignFormModal.tsx, CampaignStatusModal.tsx, CampaignDetailInfo.tsx, CampaignTimelineCard.tsx
src/features/campaigns/index.ts
Pages: src/pages/admin/CampaignListPage.tsx (< 110 dòng) và CampaignDetailPage.tsx (< 100 dòng).
Feature standards (Admin)

File cũ: src/types/admin/standard.ts, src/services/admin/standardService.ts, src/services/admin/criterionService.ts, src/hooks/admin/useStandards.ts, StandardSetListPage.tsx (1.417 dòng), StandardSetDetailPage.tsx (571 dòng), CriterionFormModal.tsx (745 dòng), CriterionItemModal.tsx (684 dòng), CriterionTree.tsx (349 dòng), StandardSetFormModal.tsx (332 dòng), StandardGroupModal.tsx (287 dòng)
File mới:
src/features/standards/types/standard.types.ts
src/features/standards/services/standard.service.ts
src/features/standards/hooks/useStandards.ts
src/features/standards/components/StandardSetTable.tsx, StandardSetFilterBar.tsx, StandardSetStatsCards.tsx, StandardSetFormModal.tsx, StandardGroupModal.tsx, CriterionTree.tsx, CriterionFormModal.tsx, CriterionItemModal.tsx, StandardSetHeader.tsx, StandardSetDetailView.tsx
src/features/standards/index.ts
Pages: src/pages/admin/StandardSetListPage.tsx (< 120 dòng) và StandardSetDetailPage.tsx (< 110 dòng).
Feature students (Admin)

File cũ: src/types/admin/student.ts, src/services/admin/studentService.ts, src/hooks/admin/useStudents.ts, StudentListPage.tsx (958 dòng), StudentDetailPage.tsx (467 dòng), StudentDetailModal.tsx (693 dòng), StudentFilterModal.tsx, StudentLockDialog.tsx, BatchDeleteStudentDialog.tsx, v.v.
File mới:
src/features/students/types/student.types.ts
src/features/students/services/student.service.ts
src/features/students/hooks/useStudents.ts
src/features/students/components/StudentTable.tsx, StudentFilterBar.tsx, StudentStatsCards.tsx, StudentPagination.tsx, StudentDetailModal.tsx, StudentFilterModal.tsx, StudentLockDialog.tsx, StudentDeleteDialog.tsx, BatchDeleteStudentDialog.tsx, StudentBadges.tsx, StudentProfileInfoCard.tsx, StudentApplicationsHistoryTable.tsx
src/features/students/index.ts
Pages: src/pages/admin/StudentListPage.tsx (< 110 dòng) và StudentDetailPage.tsx (< 100 dòng).
🔹 Đợt 4: Các Monolith Phức Tạp Nhất (Hồ Sơ & Minh Chứng)
Feature applications (Admin Duyệt Hồ Sơ & Thẩm Định)

File cũ: src/types/admin/application.ts, src/services/admin/applicationReviewService.ts, src/hooks/admin/useApplicationReview.ts, ApplicationListPage.tsx (1.095 dòng), EvidenceReviewWorkspacePage.tsx (1.328 dòng), ApplicationDetailModal.tsx (1.465 dòng), EvidenceViewerModal.tsx (583 dòng), StudentEvidenceGroupModal.tsx (412 dòng), EvidenceReviewQuickModal.tsx (241 dòng)
File mới:
src/features/applications/types/application.types.ts
src/features/applications/services/application.service.ts
src/features/applications/hooks/useApplications.ts, useEvidenceReview.ts
src/features/applications/components/ApplicationTable.tsx, ApplicationFilterBar.tsx, ApplicationStatsCards.tsx, ApplicationPagination.tsx, ApplicationDetailModal.tsx (tách: DetailHeader, CriteriaReviewTree, StudentProfileCard, ReviewDecisionBox), EvidenceReviewTable.tsx, EvidenceReviewFilterBar.tsx, EvidenceViewerModal.tsx, EvidenceReviewQuickModal.tsx, StudentEvidenceGroupModal.tsx, PdfEvidenceViewer.tsx
src/features/applications/index.ts
Pages: src/pages/admin/ApplicationListPage.tsx (< 120 dòng) và EvidenceReviewWorkspacePage.tsx (< 130 dòng).
Feature student-portal (Cổng Nộp Hồ Sơ Sinh Viên)

File cũ: src/types/student.ts, src/services/studentService.ts, StudentEvidenceSubmissionPage.tsx (756 dòng), CriterionEvidenceForm.tsx (724 dòng), StudentMyApplicationsPage.tsx (304 dòng), StudentCampaignsPage.tsx (243 dòng), MyApplicationCards.tsx, CreateApplicationTypeModal.tsx, DraftApplicationsSection.tsx, StandardGroupTabs.tsx, ApplicationProcessStepper.tsx, v.v.
File mới:
src/features/student-portal/types/student-portal.types.ts
src/features/student-portal/services/student-portal.service.ts
src/features/student-portal/hooks/useStudentPortal.ts
src/features/student-portal/components/StudentCampaignList.tsx, CampaignLevelTabs.tsx, EmptyCampaignNotice.tsx, MyApplicationCards.tsx, DraftApplicationsSection.tsx, CreateApplicationTypeModal.tsx, ApplicationProcessStepper.tsx, StandardGroupTabs.tsx, CriterionEvidenceForm.tsx (tách: FileUploadZone, EvidenceItemList, StatusInfoBox)
src/features/student-portal/index.ts
Pages: src/pages/student/StudentCampaignsPage.tsx (< 100 dòng), StudentMyApplicationsPage.tsx (< 110 dòng), StudentEvidenceSubmissionPage.tsx (< 120 dòng).
🔹 Đợt 5: Cleanup & Verification
Xóa code chết: src/pages/NewsDetailPage.tsx.
Dọn dẹp re-export tương thích ngược cũ sau khi chuyển đổi import path an toàn.
Kiểm tra toàn diện tsc -b && vite build (pass 100%), 0 any, 0 circular dependency.
Tôi đã dừng lại theo đúng yêu cầu. Xin vui lòng xác nhận hoặc cho ý kiến về Plan trên để tôi bắt đầu thực hiện Bước 4 (refactor tuần tự từng feature và chạy kiểm tra build sau mỗi bước).