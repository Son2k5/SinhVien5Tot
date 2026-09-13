import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { MenuGroup } from './adminNavConfig';
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  groups: MenuGroup[];
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  groups,
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: AdminSidebarProps) {
  const location = useLocation();
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    '/admin/applications': true,
  });

  const toggleSubMenu = (to: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [to]: !prev[to] }));
  };

  // Khi mở drawer mobile thì luôn hiển thị dạng mở rộng
  const compact = collapsed && !mobileOpen;

  return (
    <aside
      className={`fixed lg:sticky top-0 lg:top-16 self-start shrink-0 z-50 lg:z-20 h-screen lg:h-[calc(100vh-4rem)] bg-gradient-to-b from-[#EEF6FF] via-[#EAF2FC] to-[#F2F7FD] text-slate-700 border-r border-blue-200/70 shadow-[2px_0_16px_rgba(22,131,255,0.05)] flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[76px]' : 'w-[260px]'
      } ${
        mobileOpen ? 'translate-x-0 !w-[270px]' : '-translate-x-full lg:translate-x-0'
      } print:hidden`}
      aria-label="Điều hướng quản trị"
    >
      {/* Mobile-only drawer bar (logo đã chuyển lên header) */}
      <div className="lg:hidden h-16 px-4 flex items-center justify-between flex-shrink-0">
        <span className="text-[13px] font-extrabold text-slate-800 tracking-tight select-none">
          Menu quản trị
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="w-7 h-7 text-slate-400 hover:text-blue-600 hover:bg-blue-100/70 rounded-lg flex items-center justify-center cursor-pointer"
          aria-label="Đóng menu"
        >
          <X size={17} />
        </button>
      </div>

      {/* Sidebar Nav Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-blue-200/70 scrollbar-track-transparent">
        {groups.map((group) => (
          <div key={group.label} className="space-y-2">
            {!compact ? (
              <div
                className="flex items-center gap-2 px-2 pb-0.5 select-none"
                aria-hidden="true"
              >
                <span className="h-[14px] w-[3px] rounded-full bg-gradient-to-b from-blue-600 via-blue-500 to-sky-400 shadow-[0_0_8px_rgba(37,99,235,0.35)]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">
                  {group.label}
                </span>
                <span className="h-px flex-1 rounded bg-gradient-to-r from-blue-200/90 via-blue-100/50 to-transparent" />
              </div>
            ) : (
              <div className="flex justify-center pb-1" title={group.label}>
                <span className="h-1 w-8 rounded-full bg-blue-200/80" />
              </div>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.to === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.to);
                const hasChildren = item.children && item.children.length > 0;
                const isSubMenuOpen = openSubMenus[item.to] ?? isActive;

                return (
                  <div key={item.to} className="space-y-1">
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleSubMenu(item.to)}
                        title={compact ? item.label : undefined}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all cursor-pointer group ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-md shadow-blue-500/25'
                            : 'text-slate-600 hover:text-blue-900 hover:bg-white/80 hover:shadow-2xs'
                        } ${compact ? 'justify-center px-2' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            size={18}
                            strokeWidth={isActive ? 2.2 : 1.8}
                            className={`flex-shrink-0 transition-colors ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                            }`}
                          />
                          {!compact && <span className="truncate">{item.label}</span>}
                        </div>
                        {!compact && (
                          <div className="flex items-center gap-1.5">
                            {item.badge && (
                              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                            <ChevronDown
                              size={14}
                              className={`transition-transform duration-200 ${
                                isSubMenuOpen
                                  ? 'rotate-180 text-blue-600'
                                  : 'text-slate-400 group-hover:text-slate-600'
                              }`}
                            />
                          </div>
                        )}
                      </button>
                    ) : (
                      <NavLink
                        to={item.to}
                        end={item.to === '/admin'}
                        title={compact ? item.label : undefined}
                        className={({ isActive: navActive }) =>
                          `flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all group ${
                            navActive
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-md shadow-blue-500/25'
                              : 'text-slate-600 hover:text-blue-900 hover:bg-white/80 hover:shadow-2xs'
                          } ${compact ? 'justify-center px-2' : ''}`
                        }
                      >
                        {({ isActive: navActive }) => (
                          <>
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon
                                size={18}
                                strokeWidth={navActive ? 2.2 : 1.8}
                                className={`flex-shrink-0 transition-colors ${
                                  navActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                                }`}
                              />
                              {!compact && <span className="truncate">{item.label}</span>}
                            </div>
                            {!compact && item.badge && (
                              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                navActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    )}

                    {/* Submenu links */}
                    {hasChildren && !compact && isSubMenuOpen && (
                      <div className="ml-5 pl-3 border-l-2 border-blue-200/80 space-y-1 py-1">
                        {item.children!.map((child) => {
                          const childActive =
                            location.pathname + location.search === child.to;
                          return (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              className={`flex items-center justify-between px-2.5 py-1.5 text-[11px] rounded-lg transition-all ${
                                childActive
                                  ? 'text-blue-700 font-bold bg-blue-100/90 shadow-2xs'
                                  : 'text-slate-600 hover:text-blue-700 hover:bg-white/70'
                              }`}
                            >
                              <span className="truncate">{child.label}</span>
                              {child.badge && (
                                <span className="text-[10px] font-bold text-slate-400">
                                  {child.badge}
                                </span>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Nút đóng / mở sidebar — cố định cuối sidebar, không dòng kẻ ngang */}
      <div className="p-3 hidden lg:block flex-shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/90 text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-blue-100/80 shadow-[0_2px_10px_rgba(22,131,255,0.08)] transition-all cursor-pointer active:scale-[0.98]"
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <ChevronsRight size={17} />
          ) : (
            <>
              <ChevronsLeft size={16} />
              <span>Thu gọn menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
