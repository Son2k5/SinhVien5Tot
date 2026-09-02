import { NavLink } from 'react-router-dom';
import { KeyRound, LogOut, UserRound } from 'lucide-react';
import type { User } from '../../../types/auth';
import { roleLabel } from './adminNavConfig';

interface AdminUserMenuProps {
  user: User;
  displayName: string;
  onLogout: () => void;
  onClose: () => void;
}

export function AdminUserMenu({
  user,
  displayName,
  onLogout,
  onClose,
}: AdminUserMenuProps) {
  return (
    <div className="absolute z-50 top-full right-0 mt-2 w-64 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xl animate-fade-in text-xs">
      <div className="p-2.5 border-b border-slate-100 mb-1">
        <div className="font-bold text-slate-900">{displayName}</div>
        <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
        <div className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-semibold text-[10px]">
          {roleLabel(user.role)}
        </div>
      </div>

      <NavLink
        to="/admin/account"
        onClick={onClose}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
      >
        <UserRound size={15} />
        <span>Thông tin tài khoản</span>
      </NavLink>

      <NavLink
        to="/admin/change-password"
        onClick={onClose}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
      >
        <KeyRound size={15} />
        <span>Đổi mật khẩu</span>
      </NavLink>

      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100 mt-1 font-semibold cursor-pointer"
      >
        <LogOut size={15} />
        <span>Đăng xuất</span>
      </button>
    </div>
  );
}
