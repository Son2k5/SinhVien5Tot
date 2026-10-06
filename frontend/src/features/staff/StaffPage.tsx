import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AdminConfirmDialog } from '../../components/admin/common/AdminConfirmDialog';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { isAdmin } from '../../utils/authorization';
import {
  type Staff,
  type StaffApiError,
  type StaffFilterParams,
  type StaffStatus,
} from './types/staff.types';
import {
  useDeleteStaff,
  useSendInvitation,
  useSetStaffActive,
  useStaffList,
} from './hooks/useStaff';
import {
  StaffDeleteDialog,
  StaffFilterBar,
  StaffFormDialog,
  StaffPagination,
  StaffStatsCards,
  StaffTable,
  StaffToast,
  type ToastMessage,
} from './components';

export function StaffPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL State
  const roleParam = searchParams.get('role') ?? '';
  const statusParam = (searchParams.get('status') as StaffStatus | null) ?? '';
  const qParam = searchParams.get('q') ?? '';
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSizeParam = Number(searchParams.get('pageSize')) || 20;

  const [searchInput, setSearchInput] = useState(qParam);

  const currentUser = useAuthStore((s) => s.user);
  const userIsAdmin = isAdmin(currentUser);

  // Filters & Query
  const filters: StaffFilterParams = useMemo(
    () => ({
      role: roleParam || undefined,
      status: (statusParam as StaffStatus) || undefined,
      q: searchInput,
      page: pageParam,
      pageSize: pageSizeParam,
    }),
    [roleParam, statusParam, searchInput, pageParam, pageSizeParam]
  );

  const { data, isPending, isPlaceholderData, isError, error, refetch } = useStaffList(filters);

  // Mutations
  const setStaffActive = useSetStaffActive();
  const sendInvitation = useSendInvitation();
  const deleteStaff = useDeleteStaff();

  const isAnyMutationPending =
    setStaffActive.isPending || sendInvitation.isPending || deleteStaff.isPending;

  // Dialog & Toast States
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [lockTarget, setLockTarget] = useState<Staff | null>(null);
  const [invitationTarget, setInvitationTarget] = useState<Staff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [typedEmail, setTypedEmail] = useState('');
  const [deleteErrorDetail, setDeleteErrorDetail] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast((cur) => (cur?.text === text ? null : cur)), 4500);
  };

  const updateUrlParams = (updates: Partial<Record<string, string | number | undefined>>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => (v ? next.set(k, String(v)) : next.delete(k)));
    setSearchParams(next, { replace: true });
  };

  // Actions
  const handleConfirmLock = async () => {
    if (!lockTarget || isAnyMutationPending) return;
    const willActive = !lockTarget.isActive;
    try {
      await setStaffActive.mutateAsync({ id: lockTarget.id, rowVersion: lockTarget.rowVersion, active: willActive });
      showToast('success', willActive ? `Đã mở khóa cho ${lockTarget.fullName}.` : `Đã khóa ${lockTarget.fullName}.`);
      setLockTarget(null);
    } catch (err) {
      showToast('error', (err as StaffApiError).message);
    }
  };

  const handleConfirmInvite = async () => {
    if (!invitationTarget || isAnyMutationPending) return;
    try {
      await sendInvitation.mutateAsync(invitationTarget.id);
      showToast('success', `Đã gửi lại email đặt mật khẩu tới ${invitationTarget.email}.`);
      setInvitationTarget(null);
    } catch (err) {
      showToast('error', (err as StaffApiError).message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isAnyMutationPending) return;
    try {
      await deleteStaff.mutateAsync({ id: deleteTarget.id, rowVersion: deleteTarget.rowVersion });
      showToast('success', `Đã xóa nhân sự ${deleteTarget.fullName || deleteTarget.email}.`);
      setDeleteTarget(null);
      setTypedEmail('');
    } catch (err) {
      const apiErr = err as StaffApiError;
      if (apiErr.isConflict) setDeleteErrorDetail(apiErr.message);
      else { showToast('error', apiErr.message); setDeleteTarget(null); }
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSizeParam));

  return (
    <div className="space-y-5 pb-12">
      <AdminPageHeader
        title="Quản lý nhân sự"
        description="Quản lý danh sách cán bộ, giảng viên và phân quyền trong hệ thống"
        actions={
          userIsAdmin ? (
            <button
              type="button"
              onClick={() => { setEditingStaff(null); setFormDialogOpen(true); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Thêm cán bộ / giảng viên</span>
            </button>
          ) : undefined
        }
      />

      <StaffToast toast={toast} onClose={() => setToast(null)} />

      <StaffStatsCards
        total={total}
        activeCount={items.filter((i) => i.isActive).length}
        lockedCount={items.filter((i) => !i.isActive).length}
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.12)] overflow-hidden">
        <StaffFilterBar
          searchInput={searchInput}
          roleParam={roleParam}
          statusParam={statusParam}
          isPending={isPending}
          onSearchChange={(q) => { setSearchInput(q); updateUrlParams({ q: q || undefined, page: 1 }); }}
          onRoleChange={(r) => updateUrlParams({ role: r || undefined, page: 1 })}
          onStatusChange={(s) => updateUrlParams({ status: s || undefined, page: 1 })}
          onRefresh={() => void refetch()}
          onResetFilters={() => { setSearchInput(''); setSearchParams({}, { replace: true }); }}
        />

        <StaffTable
          items={items}
          page={pageParam}
          pageSize={pageSizeParam}
          isPending={isPending}
          isPlaceholderData={isPlaceholderData}
          isError={isError}
          error={error}
          userIsAdmin={userIsAdmin}
          isAnyMutationPending={isAnyMutationPending}
          hasActiveFilters={Boolean(roleParam || statusParam || searchInput.trim())}
          onEdit={(s) => { setEditingStaff(s); setFormDialogOpen(true); }}
          onSendInvite={(s) => setInvitationTarget(s)}
          onToggleLock={(s) => setLockTarget(s)}
          onDelete={(s) => { setDeleteTarget(s); setTypedEmail(''); setDeleteErrorDetail(null); }}
          onRetry={() => void refetch()}
          onResetFilters={() => { setSearchInput(''); setSearchParams({}, { replace: true }); }}
        />

        <StaffPagination
          total={total}
          page={pageParam}
          pageSize={pageSizeParam}
          totalPages={totalPages}
          isPending={isPending}
          onPageChange={(p) => updateUrlParams({ page: p })}
          onPageSizeChange={(s) => updateUrlParams({ pageSize: s, page: 1 })}
        />
      </div>

      <StaffFormDialog
        isOpen={formDialogOpen}
        onClose={() => { setFormDialogOpen(false); setEditingStaff(null); }}
        staff={editingStaff}
        onSuccess={(saved, inviteSent) => {
          showToast('success', !editingStaff ? (inviteSent ? `Đã tạo nhân sự ${saved.fullName}.` : `Đã tạo nhân sự ${saved.fullName}.`) : `Đã cập nhật ${saved.fullName}.`);
        }}
      />

      <AdminConfirmDialog
        isOpen={Boolean(invitationTarget)}
        title="Gửi lại lời mời đặt mật khẩu"
        description={`Bạn có chắc muốn gửi email hướng dẫn thiết lập mật khẩu tới "${invitationTarget?.email}"?`}
        confirmText="Gửi email"
        cancelText="Hủy"
        variant="info"
        isLoading={sendInvitation.isPending}
        onConfirm={handleConfirmInvite}
        onClose={() => setInvitationTarget(null)}
      />

      <AdminConfirmDialog
        isOpen={Boolean(lockTarget)}
        title={lockTarget?.isActive ? 'Khóa tài khoản nhân sự' : 'Mở khóa tài khoản nhân sự'}
        description={
          lockTarget?.isActive
            ? `Bạn có chắc muốn khóa tài khoản "${lockTarget?.fullName || lockTarget?.email}"?\nNhân sự sẽ bị đăng xuất khỏi mọi thiết bị.`
            : `Bạn có chắc muốn mở khóa tài khoản cho "${lockTarget?.fullName || lockTarget?.email}"?`
        }
        confirmText={lockTarget?.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
        cancelText="Hủy"
        variant={lockTarget?.isActive ? 'warning' : 'info'}
        isLoading={setStaffActive.isPending}
        onConfirm={handleConfirmLock}
        onClose={() => setLockTarget(null)}
      />

      <StaffDeleteDialog
        isOpen={Boolean(deleteTarget)}
        target={deleteTarget}
        typedEmail={typedEmail}
        deleteErrorDetail={deleteErrorDetail}
        isDeleting={deleteStaff.isPending}
        isLocking={setStaffActive.isPending}
        onTypedEmailChange={setTypedEmail}
        onClose={() => { setDeleteTarget(null); setTypedEmail(''); setDeleteErrorDetail(null); }}
        onConfirmDelete={handleDelete}
        onLockInstead={async () => {
          if (!deleteTarget) return;
          try {
            await setStaffActive.mutateAsync({ id: deleteTarget.id, rowVersion: deleteTarget.rowVersion, active: false });
            showToast('success', `Đã khóa tài khoản thay thế cho ${deleteTarget.fullName || deleteTarget.email}.`);
            setDeleteTarget(null);
          } catch (e) { showToast('error', (e as StaffApiError).message); }
        }}
      />
    </div>
  );
}

export default StaffPage;
