import {
  Briefcase,
  Calendar,
  Clock,
  IdCard,
  Lock,
  Mail,
  Shield,
  UserCheck,
} from 'lucide-react';
import { normalizeRole } from '../../../utils/authorization';
import type { StaffProfile } from '../types/staff-me.types';
import { StaffAvatarUploader } from './StaffAvatarUploader';

export interface StaffAccountOverviewCardProps {
  profile: StaffProfile;
  isUpdatingAvatar: boolean;
  isRemovingAvatar: boolean;
  uploadProgress: number | null;
  onUploadAvatar: (file: File) => Promise<void>;
  onRemoveAvatarRequest: () => void;
}

export function StaffAccountOverviewCard({
  profile,
  isUpdatingAvatar,
  isRemovingAvatar,
  uploadProgress,
  onUploadAvatar,
  onRemoveAvatarRequest,
}: StaffAccountOverviewCardProps) {
  const role = normalizeRole(profile.role);
  const displayRoleLabel =
    role === 'Admin'
      ? 'Quản trị viên'
      : role === 'Mentor'
      ? 'Cán bộ xét duyệt'
      : 'Cán bộ';

  const staffCodeDisplay = profile.staffCode || profile.id.slice(0, 8).toUpperCase();
  const positionDisplay =
    profile.position || (role === 'Admin' ? 'Quản trị hệ thống' : 'Cán bộ thẩm định');

  const formattedCreatedAt = (() => {
    try {
      return new Date(profile.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return profile.createdAt;
    }
  })();

  const formattedLastLogin = profile.lastLoginAt
    ? (() => {
        try {
          return new Date(profile.lastLoginAt).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          return profile.lastLoginAt;
        }
      })()
    : 'Phiên hiện tại';

  return (
    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Shield size={16} className="text-blue-600" />
          <span>Tài khoản & Phân quyền</span>
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Thông tin định danh và vai trò tài khoản được phân quyền bởi hệ thống.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <StaffAvatarUploader
          avatarUrl={profile.avatarUrl}
          fullName={profile.fullName}
          isUpdating={isUpdatingAvatar}
          isRemoving={isRemovingAvatar}
          uploadProgress={uploadProgress}
          onUpload={onUploadAvatar}
          onRemoveRequest={onRemoveAvatarRequest}
        />

        {/* Name & Role in Left Card */}
        <div className="text-center space-y-1">
          <div className="text-base font-bold text-slate-900 tracking-tight">
            {profile.fullName}
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            <UserCheck size={13} className="text-blue-600" />
            <span>{displayRoleLabel}</span>
          </div>
        </div>

        {/* Read-only Information Section */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Thông tin hệ thống quản trị
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
            <div className="flex items-center gap-2.5 text-slate-500">
              <Mail size={15} className="text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700">Email</span>
            </div>
            <div
              className="flex items-center gap-2 font-mono text-slate-900 font-semibold truncate max-w-[200px]"
              title={profile.email}
            >
              <span className="truncate">{profile.email}</span>
              <span title="Chỉ đọc" className="inline-flex items-center">
                <Lock size={12} className="text-slate-400 shrink-0" />
              </span>
            </div>
          </div>

          {/* Staff Code */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
            <div className="flex items-center gap-2.5 text-slate-500">
              <IdCard size={15} className="text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700">Mã cán bộ</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-slate-900 font-semibold">
              <span>{staffCodeDisplay}</span>
              <span title="Chỉ đọc" className="inline-flex items-center">
                <Lock size={12} className="text-slate-400 shrink-0" />
              </span>
            </div>
          </div>

          {/* Position */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
            <div className="flex items-center gap-2.5 text-slate-500">
              <Briefcase size={15} className="text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700">Chức vụ</span>
            </div>
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <span>{positionDisplay}</span>
              <span title="Chỉ đọc" className="inline-flex items-center">
                <Lock size={12} className="text-slate-400 shrink-0" />
              </span>
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
            <div className="flex items-center gap-2.5 text-slate-500">
              <Calendar size={15} className="text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700">Ngày tạo</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-slate-900 font-semibold">
              <span>{formattedCreatedAt}</span>
              <span title="Chỉ đọc" className="inline-flex items-center">
                <Lock size={12} className="text-slate-400 shrink-0" />
              </span>
            </div>
          </div>

          {/* Last Login */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
            <div className="flex items-center gap-2.5 text-slate-500">
              <Clock size={15} className="text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700">Đăng nhập gần nhất</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-slate-900 font-semibold">
              <span>{formattedLastLogin}</span>
              <span title="Chỉ đọc" className="inline-flex items-center">
                <Lock size={12} className="text-slate-400 shrink-0" />
              </span>
            </div>
          </div>
        </div>

        {/* Readonly explanatory note */}
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
          <Lock size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            Các trường email, vai trò, mã cán bộ và chức vụ do Quản trị viên cấp cao phân quyền.
            Liên hệ Quản trị viên hệ thống nếu cần điều chỉnh.
          </span>
        </div>
      </div>
    </div>
  );
}

export default StaffAccountOverviewCard;
