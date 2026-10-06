import { useEffect, useState } from 'react';
import { Navigate, useBlocker } from 'react-router-dom';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { AdminConfirmDialog } from '../../components/admin/common/AdminConfirmDialog';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import { SkeletonBlock } from '../../components/common/SkeletonBlock';
import { useAuthStore } from '../../store/useAuthStore';
import { canAccessAdmin } from '../../utils/authorization';
import {
  useRemoveAvatar,
  useStaffMe,
  useUpdateStaffMe,
  useUploadAvatar,
} from './hooks/useStaffMe';
import {
  StaffAccountOverviewCard,
  StaffProfileForm,
} from './components';

export function StaffProfilePage() {
  const user = useAuthStore((state) => state.user);

  // Guard: if role is student, redirect to student profile
  if (user && !canAccessAdmin(user)) {
    return <Navigate to="/dashboard/profile" replace />;
  }

  return <StaffProfileContent />;
}

function StaffProfileContent() {
  const { data: profile, isLoading, isError, error, refetch } = useStaffMe();
  const updateMutation = useUpdateStaffMe();
  const uploadAvatarMutation = useUploadAvatar();
  const removeAvatarMutation = useRemoveAvatar();

  const [isDirty, setIsDirty] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isRemoveAvatarDialogOpen, setIsRemoveAvatarDialogOpen] = useState(false);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

  // Block route navigation when form is dirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Browser beforeunload protection
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleUploadAvatar = async (file: File) => {
    setUploadProgress(0);
    try {
      await uploadAvatarMutation.mutateAsync({
        file,
        onProgress: (percent) => setUploadProgress(percent),
      });
      setUploadProgress(null);
    } catch (e) {
      setUploadProgress(null);
      throw e;
    }
  };

  const handleConfirmRemoveAvatar = async () => {
    setIsRemoveAvatarDialogOpen(false);
    await removeAvatarMutation.mutateAsync();
  };

  const handleConfirmConflictReload = async () => {
    setIsConflictDialogOpen(false);
    await refetch();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <AdminPageHeader
          title="Hồ sơ cá nhân"
          description="Xem và cập nhật thông tin tài khoản của bạn trong hệ thống quản trị SV5T."
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col items-center space-y-3">
              <SkeletonBlock className="w-28 h-28 rounded-full" />
              <SkeletonBlock className="h-6 w-40 rounded-md" />
              <SkeletonBlock className="h-5 w-24 rounded-full" />
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <SkeletonBlock className="h-10 w-full rounded-xl" />
              <SkeletonBlock className="h-10 w-full rounded-xl" />
              <SkeletonBlock className="h-10 w-full rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <SkeletonBlock className="h-6 w-48 rounded-md" />
            <SkeletonBlock className="h-12 w-full rounded-xl" />
            <SkeletonBlock className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    const errorMsg = error instanceof Error ? error.message : 'Không thể tải thông tin hồ sơ.';
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <AdminPageHeader
          title="Hồ sơ cá nhân"
          description="Xem và cập nhật thông tin tài khoản của bạn trong hệ thống quản trị SV5T."
        />
        <div className="p-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle size={26} />
          </div>
          <div className="max-w-md space-y-1">
            <h2 className="text-base font-semibold text-slate-900">Không thể tải hồ sơ cá nhân</h2>
            <p className="text-xs text-slate-500 leading-relaxed">{errorMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <AdminPageHeader
        title="Hồ sơ cá nhân"
        description="Xem và quản lý hồ sơ nhân sự của chính bạn trong bảng điều khiển quản trị."
        breadcrumbs={[
          { label: 'Bảng điều khiển', to: '/admin' },
          { label: 'Hồ sơ cá nhân' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <StaffAccountOverviewCard
          profile={profile}
          isUpdatingAvatar={uploadAvatarMutation.isPending}
          isRemovingAvatar={removeAvatarMutation.isPending}
          uploadProgress={uploadProgress}
          onUploadAvatar={handleUploadAvatar}
          onRemoveAvatarRequest={() => setIsRemoveAvatarDialogOpen(true)}
        />

        <StaffProfileForm
          profile={profile}
          isUpdating={updateMutation.isPending}
          updateError={updateMutation.error}
          onUpdate={async (payload) => { await updateMutation.mutateAsync(payload); }}
          onConflict={() => setIsConflictDialogOpen(true)}
          onDirtyChange={setIsDirty}
        />
      </div>

      {/* Remove Avatar Dialog */}
      <AdminConfirmDialog
        isOpen={isRemoveAvatarDialogOpen}
        onClose={() => setIsRemoveAvatarDialogOpen(false)}
        onConfirm={handleConfirmRemoveAvatar}
        title="Xoá ảnh đại diện"
        description="Bạn có chắc chắn muốn xoá ảnh đại diện hiện tại? Ảnh sẽ được thay thế bằng biểu tượng chữ cái mặc định."
        confirmText="Xoá ảnh"
        cancelText="Hủy"
        variant="danger"
        isLoading={removeAvatarMutation.isPending}
      />

      {/* 409 Conflict Dialog */}
      <AdminConfirmDialog
        isOpen={isConflictDialogOpen}
        onClose={() => setIsConflictDialogOpen(false)}
        onConfirm={handleConfirmConflictReload}
        title="Hồ sơ đã được cập nhật ở nơi khác"
        description="Hồ sơ nhân sự của bạn đã được thay đổi từ một phiên làm việc khác. Bạn có muốn tải lại bản mới nhất hay ở lại giữ nội dung hiện tại?"
        confirmText="Tải lại bản mới"
        cancelText="Ở lại"
        variant="warning"
      />

      {/* Route Blocker Dialog */}
      {blocker.state === 'blocked' && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => blocker.reset?.()}
          onConfirm={() => blocker.proceed?.()}
          title="Bạn có thay đổi chưa lưu"
          description="Bạn đang có thay đổi chưa được lưu trên hồ sơ cá nhân. Bạn có chắc chắn muốn rời khỏi trang này? Mọi thay đổi chưa lưu sẽ bị mất."
          confirmText="Rời khỏi"
          cancelText="Ở lại"
          variant="danger"
        />
      )}
    </div>
  );
}

export default StaffProfilePage;
