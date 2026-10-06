import {
  AlertCircle,
  Edit2,
  Lock,
  LockOpen,
  Mail,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import type { Staff, StaffApiError } from '../types/staff.types';

function formatDateTime(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export interface StaffTableProps {
  items: Staff[];
  page: number;
  pageSize: number;
  isPending: boolean;
  isPlaceholderData: boolean;
  isError: boolean;
  error: unknown;
  userIsAdmin: boolean;
  isAnyMutationPending: boolean;
  hasActiveFilters: boolean;
  onEdit: (staff: Staff) => void;
  onSendInvite: (staff: Staff) => void;
  onToggleLock: (staff: Staff) => void;
  onDelete: (staff: Staff) => void;
  onRetry: () => void;
  onResetFilters: () => void;
}

export function StaffTable({
  items,
  page,
  pageSize,
  isPending,
  isPlaceholderData,
  isError,
  error,
  userIsAdmin,
  isAnyMutationPending,
  hasActiveFilters,
  onEdit,
  onSendInvite,
  onToggleLock,
  onDelete,
  onRetry,
  onResetFilters,
}: StaffTableProps) {
  const queryApiError = error as StaffApiError | null;
  const is403Error = queryApiError?.isForbidden || queryApiError?.status === 403;

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse text-xs">
        {/* Table Header */}
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 select-none">
            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] w-12 text-center">
              STT
            </th>
            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
              Nhân sự
            </th>
            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
              Email
            </th>
            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
              Số điện thoại
            </th>
            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">
              Vai trò
            </th>
            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">
              Trạng thái
            </th>
            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">
              Ngày tạo
            </th>
            <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center w-28">
              Thao tác
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody
          className={`divide-y divide-slate-100 transition-opacity duration-150 ${
            isPlaceholderData ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {/* Loading Skeleton */}
          {isPending && (
            <>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 px-4 text-center">
                    <div className="w-4 h-4 bg-slate-200 rounded mx-auto" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 bg-slate-200 rounded w-28" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-3.5 bg-slate-200 rounded w-40" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-3.5 bg-slate-200 rounded w-24" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-5 bg-slate-200 rounded-full w-16 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-5 bg-slate-200 rounded-full w-20 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-3.5 bg-slate-200 rounded w-20 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-7 bg-slate-200 rounded-lg w-20 mx-auto" />
                  </td>
                </tr>
              ))}
            </>
          )}

          {/* 403 Forbidden State */}
          {!isPending && is403Error && (
            <tr>
              <td colSpan={8} className="py-12 text-center">
                <div className="space-y-2 max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Shield size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Không có quyền truy cập
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tài khoản của bạn không có quyền xem hoặc quản lý nhân sự trên hệ thống.
                  </p>
                </div>
              </td>
            </tr>
          )}

          {/* Other Error State */}
          {!isPending && isError && !is403Error && (
            <tr>
              <td colSpan={8} className="py-12 text-center">
                <div className="space-y-2 max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Không thể tải danh sách nhân sự
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {queryApiError?.message || 'Có lỗi xảy ra khi kết nối máy chủ.'}
                  </p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer shadow-xs transition-colors"
                  >
                    <RefreshCw size={13} />
                    <span>Thử lại</span>
                  </button>
                </div>
              </td>
            </tr>
          )}

          {/* Empty State */}
          {!isPending && !isError && items.length === 0 && (
            <tr>
              <td colSpan={8} className="py-14 text-center">
                <div className="space-y-2 max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200/60">
                    <Users size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">
                    Chưa có nhân sự phù hợp
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {hasActiveFilters
                      ? 'Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm nhân sự.'
                      : 'Hệ thống chưa ghi nhận nhân sự nào.'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}

          {/* Data Rows */}
          {!isPending &&
            !isError &&
            items.map((staff, idx) => {
              const initialLetter = (
                staff.fullName?.trim() || staff.email.split('@')[0]
              )
                .charAt(0)
                .toUpperCase();

              return (
                <tr
                  key={staff.id}
                  className="hover:bg-blue-50/40 transition-colors duration-150 group"
                >
                  {/* 1. STT */}
                  <td className="py-3 px-4 text-center font-mono text-slate-400 text-xs">
                    {(page - 1) * pageSize + idx + 1}
                  </td>

                  {/* 2. Avatar & Full Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {staff.avatarUrl ? (
                        <img
                          src={staff.avatarUrl}
                          alt={staff.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                          {initialLetter}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">
                          {staff.fullName || '—'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 3. Email */}
                  <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                    {staff.email}
                  </td>

                  {/* 4. Phone */}
                  <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                    {staff.phone || '—'}
                  </td>

                  {/* 5. Role Badge */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Shield size={11} className="shrink-0" />
                      <span>Mentor</span>
                    </span>
                  </td>

                  {/* 6. Status Badge */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {staff.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Hoạt động</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Đã khoá</span>
                      </span>
                    )}
                  </td>

                  {/* 7. Created At */}
                  <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {formatDateTime(staff.createdAt)}
                  </td>

                  {/* 8. Actions */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {userIsAdmin ? (
                      <div className="inline-flex items-center gap-1 justify-center">
                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onEdit(staff)}
                          disabled={isAnyMutationPending}
                          className="h-7 w-7 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                          title="Chỉnh sửa thông tin"
                          aria-label={`Chỉnh sửa ${staff.fullName || staff.email}`}
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Resend Invitation */}
                        <button
                          type="button"
                          onClick={() => onSendInvite(staff)}
                          disabled={isAnyMutationPending || !staff.isActive}
                          className="h-7 w-7 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                          title={
                            staff.isActive
                              ? 'Gửi lại email thiết lập mật khẩu'
                              : 'Chỉ gửi lời mời cho tài khoản đang hoạt động'
                          }
                          aria-label={`Gửi lại lời mời cho ${staff.fullName || staff.email}`}
                        >
                          <Mail size={13} />
                        </button>

                        {/* Lock / Unlock */}
                        <button
                          type="button"
                          onClick={() => onToggleLock(staff)}
                          disabled={isAnyMutationPending}
                          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 ${
                            staff.isActive
                              ? 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={staff.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          aria-label={`${
                            staff.isActive ? 'Khóa' : 'Mở khóa'
                          } tài khoản ${staff.fullName || staff.email}`}
                        >
                          {staff.isActive ? <Lock size={13} /> : <LockOpen size={13} />}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => onDelete(staff)}
                          disabled={isAnyMutationPending}
                          className="h-7 w-7 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                          title="Xóa nhân sự"
                          aria-label={`Xóa nhân sự ${staff.fullName || staff.email}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs select-none">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

export default StaffTable;
