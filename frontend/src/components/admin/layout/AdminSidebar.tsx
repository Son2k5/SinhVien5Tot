import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import sv5tLogo from '../../../assets/home-page/layer-2.png';
import type { MenuGroup } from './adminNavConfig';

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

  return (
    <aside
      className={`fixed lg:sticky top-0 z-50 h-screen bg-gradient-to-b from-[#EEF6FF] via-[#EAF2FC] to-[#F2F7FD] text-slate-700 border-r border-blue-200/70 shadow-[2px_0_16px_rgba(22,131,255,0.05)] flex flex-col justify-between transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[76px]' : 'w-[260px]'
      } ${
        mobileOpen ? 'translate-x-0 !w-[270px]' : '-translate-x-full lg:translate-x-0'
      } print:hidden`}
      aria-label="Điều hướng quản trị"
    >
      {/* Top Brand & Header inside Sidebar */}
      <div className="h-16 px-4 flex items-center justify-between flex-shrink-0">
        <Link
          to="/admin"
          className={`flex items-center gap-3 transition-transform hover:scale-[1.01] active:scale-[0.99] ${
            collapsed ? 'justify-center w-full' : ''
          }`}
          title="Sinh Viên 5 Tốt"
        >
          <div className="w-10 h-10 rounded-2xl bg-white p-1 shadow-sm border border-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src={sv5tLogo} alt="SV5T Logo" className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <span className="text-[14.5px] font-extrabold text-slate-900 tracking-tight leading-tight select-none">
              Sinh Viên 5 Tốt
            </span>
          )}
        </Link>

        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-7 h-7 text-slate-400 hover:text-blue-600 hover:bg-blue-100/70 rounded-lg transition-all hidden lg:flex items-center justify-center cursor-pointer active:scale-95"
            aria-label="Thu gọn sidebar"
            title="Thu gọn sidebar"
          >
            <ChevronsLeft size={16} />
          </button>
        )}

        {/* Close button on mobile */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="w-7 h-7 text-slate-400 hover:text-blue-600 hover:bg-blue-100/70 rounded-lg lg:hidden flex items-center justify-center cursor-pointer"
          aria-label="Đóng menu"
        >
          <X size={17} />
        </button>
      </div>

      {/* Sidebar Nav Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-blue-200/70 scrollbar-track-transparent">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed ? (
              <div className="px-3 pb-1.5 text-[10.5px] font-extrabold tracking-wider text-blue-600/90 uppercase select-none">
                {group.label}
              </div>
            ) : (
              <div className="h-2" />
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
                        title={collapsed ? item.label : undefined}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all cursor-pointer group ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-md shadow-blue-500/25'
                            : 'text-slate-600 hover:text-blue-900 hover:bg-white/80 hover:shadow-2xs'
                        } ${collapsed ? 'justify-center px-2' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            size={18}
                            strokeWidth={isActive ? 2.2 : 1.8}
                            className={`flex-shrink-0 transition-colors ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                            }`}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!collapsed && (
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
                        title={collapsed ? item.label : undefined}
                        className={({ isActive: navActive }) =>
                          `flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all group ${
                            navActive
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-md shadow-blue-500/25'
                              : 'text-slate-600 hover:text-blue-900 hover:bg-white/80 hover:shadow-2xs'
                          } ${collapsed ? 'justify-center px-2' : ''}`
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
                              {!collapsed && <span className="truncate">{item.label}</span>}
                            </div>
                            {!collapsed && item.badge && (
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
                    {hasChildren && !collapsed && isSubMenuOpen && (
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

      {/* Expand button if collapsed */}
      {collapsed && (
        <div className="p-3 border-t border-blue-200/60 flex justify-center bg-white/50">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all cursor-pointer shadow-xs border border-blue-200 bg-white"
            title="Mở rộng sidebar"
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      )}
    </aside>
  );
}
