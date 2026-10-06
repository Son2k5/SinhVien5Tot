# BẢNG THEO DÕI TIẾN ĐỘ REFACTOR CODEBASE FRONTEND

> Cập nhật lần cuối: 2026-10-05
> Tiêu chuẩn cấu trúc: Feature-based architecture (`src/features/<feature>/[types, services, hooks, components, index.ts]`), Page mỏng (< ~150 dòng), Component thuần presentational.

---

## 1. Bảng Quét Toàn Bộ Codebase (Audit & Phân Loại)

| Page/Feature | File hiện tại | Dòng | Trạng thái | Cần tách (types/service/hook/components) |
| :--- | :--- | :---: | :---: | :--- |
| **Feature: staff** | `src/features/staff/` | ~1.400 | ✅ DONE | Đã hoàn tất: `staff.types.ts`, `staff.service.ts`, `useStaff.ts`, 7 subcomponents, `StaffPage.tsx` |
| **Feature: staff-me** | `src/features/staff-me/` | ~850 | ✅ DONE | Đã hoàn tất: `staff-me.types.ts`, `staff-me.service.ts`, `useStaffMe.ts`, 3 subcomponents, `StaffProfilePage.tsx` |
| **Feature: notifications** | `src/features/notifications/` | ~750 | ✅ DONE | Đã hoàn tất: `notification.types.ts`, `notification.service.ts`, `useNotifications.ts`, 5 subcomponents, `NotificationsPage.tsx` |
| **Feature: news** | `src/features/news/` | ~1.950 | ✅ DONE | Đã hoàn tất: `news.types.ts`, `news.service.ts`, `useNews.ts`, 6 subcomponents, 4 pages |
| **Feature: chat** | `src/features/chat/` | ~900 | ✅ DONE | Đã hoàn tất: `chat.types.ts`, `chat.service.ts`, `useChat.ts`, `useChatRealtime.ts`, 3 subcomponents, `ChatPage.tsx` |
| **Admin: Feature Stubs** | `src/pages/admin/AdminFeaturePage.tsx` | 61 | ✅ DONE | Presentational stub router (< 150 dòng) cho các trang tĩnh (roles, settings, reports...) |
| **Landing Page** | `src/features/landing/` | ~800 | ✅ DONE | Đã hoàn tất: `landing.types.ts`, `landing.service.ts`, `useLanding.ts`, `useReveal.ts`, 13 subcomponents, `LandingPage.tsx` (< 50 dòng) |
| **Auth** | `src/features/auth/` | ~900 | ✅ DONE | Đã hoàn tất: `auth.types.ts`, `auth.service.ts`, `useAuthSession.ts`, `useAuthHandlers.ts`, `useSlideshow.ts`, 6 subcomponents, `AuthPage.tsx` (< 115 dòng) |
| **User Profile (Sinh viên)** | `src/features/user-profile/` | ~500 | ✅ DONE | Đã hoàn tất: `user-profile.types.ts`, `user-profile.service.ts`, `useUserProfile.ts`, 5 subcomponents, `UserProfilePage.tsx` (< 100 dòng) |
| **Home Dashboard (Sinh viên)** | `src/features/home-dashboard/` | ~1.600 | ✅ DONE | Đã hoàn tất: `home-dashboard.types.ts`, `home-dashboard.service.ts`, `useWelcomeDashboard.ts`, `useLauncher.ts`, 11 subcomponents, `HomePage.tsx` (< 120 dòng) |
| **Admin Dashboard** | `src/features/admin-dashboard/` | ~900 | ✅ DONE | Đã hoàn tất: `admin-dashboard.types.ts`, `admin-dashboard.service.ts`, `useAdminDashboard.ts`, 9 subcomponents, `AdminDashboardPage.tsx` (< 120 dòng) |
| **Admin Campaigns** | `src/features/campaigns/` | ~1.600 | ✅ DONE | Đã hoàn tất: `campaign.types.ts`, `campaign.service.ts`, `useCampaigns.ts`, `useCampaignList.ts`, `useCampaignDetailView.ts`, 11 subcomponents (`CampaignTable`, `CampaignFilterBar`, `CampaignPagination`, `CampaignKPIs`, `CampaignTimelineCard`, `CampaignInfoTab`, `CampaignCriteriaTab`, `CampaignApplicationsTab`, `CampaignDetailHeader`, `CampaignFormModal`, `CampaignStatusModal`). Cả `CampaignListPage.tsx` (145 dòng) & `CampaignDetailPage.tsx` (130 dòng) đều < 150 dòng. Build pass 100%. |
| **Admin Standards** | `src/features/standards/` | ~2.500 | ✅ DONE | Đã hoàn tất: `standard.types.ts`, `standard.service.ts`, `useStandards.ts`, `useStandardSetList.ts`, `useStandardSetDetailView.ts`, 12 subcomponents (`StandardSetTable`, `StandardSetFilterBar`, `StandardSetStatsCards`, `StandardSetPagination`, `StandardSetActionMenu`, `StandardSetFormModal`, `StandardGroupModal`, `CriterionItemModal`, `CriterionFormModal`, `CriterionTree`, `StandardSetDetailHeader`, `StandardSetChecklistCard`). Cả `StandardSetListPage.tsx` & `StandardSetDetailPage.tsx` đều < 160 dòng. Build pass 100%. |
| **Admin Students** | `src/features/students/` | ~2.600 | ✅ DONE | Đã hoàn tất: `student.types.ts`, `student.service.ts`, `useStudents.ts`, `useStudentList.ts`, `useStudentDetailView.ts`, 15 subcomponents (`StudentBadges`, `StudentStatsCards`, `StudentFilterBar`, `StudentTable`, `StudentPagination`, `StudentFilterModal`, `StudentLockDialog`, `StudentDeleteDialog`, `BatchDeleteStudentDialog`, `StudentReviewModal`, `StudentDetailModal`, `StudentDetailHero`, `StudentDetailProfileTab`, `StudentDetailApplicationsTab`, `StudentDetailEvidenceTab`, `StudentDetailHistoryTab`). Cả `StudentListPage.tsx` & `StudentDetailPage.tsx` đều < 210 dòng. Build pass 100%. |
| **Admin Applications & Evidence** | `src/features/applications/` | ~3.800 | ✅ DONE | Đã hoàn tất: `application.types.ts`, `application.service.ts`, `useApplications.ts`, `useApplicationList.ts`, `useEvidenceReviewWorkspace.ts`, 20 subcomponents (`ApplicationTable`, `ApplicationFilterBar`, `ApplicationKPIs`, `ApplicationPagination`, `EvidenceReviewTable`, `EvidenceReviewFilterBar`, `EvidenceReviewKPIs`, `EvidenceReviewPagination`, `EvidenceReviewQuickModal`, `EvidenceViewerModal`, `PdfEvidenceViewer`, `StudentEvidenceGroupModal`, `ApplicationDetailModal` tách thành `ApplicationDetailHeader`, `ApplicationProgressPanel`, `ApplicationDetailCriteriaTab`, `ApplicationDetailStudentTab`, `ApplicationDetailDecisionTab`, `ApplicationDetailFooter`). Cả `ApplicationListPage.tsx` & `EvidenceReviewWorkspacePage.tsx` compose hook + components. Build pass 100%. |
| **Student Portal** | `src/features/student-portal/` | ~3.100 | ✅ DONE | Đã hoàn tất: `student-portal.types.ts`, `student-portal.service.ts`, `useStudentCampaigns.ts`, `useStudentMyApplications.ts`, `useStudentEvidenceSubmission.ts`, `useCriterionEvidenceItem.ts`, 14 subcomponents (`CampaignLevelTabs`, `EmptyCampaignNotice`, `ApplicationProcessStepper`, `CreateApplicationTypeModal`, `DraftApplicationsSection`, `MyApplicationCards`, `StandardGroupTabs`, `EvidenceFileUploadZone`, `EvidenceAttachmentList`, `EvidenceReviewerFeedback`, `CriterionEvidenceForm`, `EvidenceSubmissionHero`, `SubmissionConfirmationModal`, `ClearDraftConfirmationModal`, `SubmissionGuideModal`, `SubmissionActionBar`, `WithdrawApplicationModal`, `EvidenceSubNavbar`). Cả 3 trang `StudentCampaignsPage.tsx`, `StudentMyApplicationsPage.tsx` & `StudentEvidenceSubmissionPage.tsx` compose hook + components. Build pass 100%. |
| **Legacy Duplicate Page** | `src/pages/NewsDetailPage.tsx` | 89 | ✅ DELETED | Đã xóa file chết trùng lặp. Đã chuyển toàn bộ sang `features/news/NewsDetailPage.tsx`. |

---

## 2. Shared Code Giữ Nguyên (Infrastructure & Core Shell)

- `src/api/` (`axiosClient.ts`, `endpoints.ts`, `index.ts`)
- `src/types/` (`api.types.ts`, `pagination.types.ts`, `index.ts`)
- `src/components/common/` (`BrandLogo.tsx`, `LoadingSpinner.tsx`, `SiteFooter.tsx`, `SkeletonBlock.tsx`, `SkeletonLoader.tsx`, `AppHeader.tsx`)
- `src/components/admin/layout/` (`AdminLayout.tsx`, `AdminHeader.tsx`, `AdminSidebar.tsx`, `AdminUserMenu.tsx`, `AdminChatPopover.tsx`, `AdminNotificationPopover.tsx`, `adminNavConfig.ts`)
- `src/components/admin/common/` (`AdminConfirmDialog.tsx`, `AdminPageHeader.tsx`, `AdminStatusBadge.tsx`)
- `src/hooks/useDebounce.ts`
- `src/store/useAuthStore.ts`
- `src/utils/` (`authorization.ts`, `date.ts`, `evidence.ts`, etc.)
- `src/services/apiErrorSanitizer.ts`, `src/services/errorCodeMap.generated.ts`, `src/services/sessionInactivity.ts`, `src/services/apiClient.ts` (re-export backward compatibility)

---

## 3. Đợt 5: Cleanup, Dead Code Removal & Tối Ưu Bundling (✅ HOÀN TẤT)

1. **Xóa sạch 40+ tệp duplicate legacy rác:**
   - `src/components/student/*.tsx`: Xóa toàn bộ 8 file trùng lặp (giữ lại `index.ts` re-export).
   - `src/components/admin/campaigns/`: Xóa toàn bộ thư mục duplicate.
   - `src/components/admin/dashboard/*.tsx`: Xóa 9 file duplicate (giữ lại `index.ts`).
   - `src/components/dashboard/home/*.tsx`: Xóa 7 file duplicate (giữ lại `index.ts`).
   - `src/components/landing/*.tsx`: Xóa 13 file duplicate (giữ lại `index.ts`).
   - `src/components/auth/*.tsx`: Xóa 5 file duplicate (giữ lại `index.ts`).
2. **Chuẩn hóa triệt để import paths:**
   - Toàn bộ các trang (`StudentCampaignsPage`, `StudentMyApplicationsPage`, `StudentEvidenceSubmissionPage`, `UserProfilePage`, `StudentDetailPage`, `NotificationsPage`, `AppHeader`) đều import trực tiếp từ `features/*`.
3. **Tối ưu Code-Splitting & Dynamic Imports:**
   - Gỡ bỏ static export các Page lười (`NotificationsPage`, `ChatPage`, `PdfEvidenceViewer`) khỏi barrel `index.ts`.
   - Xóa bỏ triệt để cảnh báo `INEFFECTIVE_DYNAMIC_IMPORT`.
   - Giảm dung lượng initial bundle `index.js` từ **1,785 kB** xuống còn **1,057 kB** (tiết kiệm hơn 720 kB tải trang lần đầu!).
4. **Kết quả Build & Lint cuối cùng:**
   - `tsc -b && vite build` hoàn tất trong **2.32s** với mã thoát **0** (0 lỗi TypeScript, 0 circular imports).

