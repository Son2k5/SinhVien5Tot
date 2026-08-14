import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Bell,
  Bookmark,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  FileCheck2,
  Flag,
  GraduationCap,
  HeartHandshake,
  Home,
  Landmark,
  LogOut,
  Newspaper,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  UserRound,
  X,
} from 'lucide-react';
import type { SystemFeature } from '../../types/welcome';

interface SystemLauncherProps {
  open: boolean;
  searchValue: string;
  featureGroups: Record<string, SystemFeature[]>;
  filteredCount: number;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onLogout: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  newspaper: Newspaper,
  award: Award,
  'file-check': FileCheck2,
  flag: Flag,
  chart: ChartNoAxesColumnIncreasing,
  users: Users,
  bookmark: Bookmark,
  sparkles: Sparkles,
  bell: Bell,
  'shield-check': ShieldCheck,
  landmark: Landmark,
  'graduation-cap': GraduationCap,
  'heart-handshake': HeartHandshake,
  'user-round': UserRound,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Sparkles;
}

export function SystemLauncher({
  open,
  searchValue,
  featureGroups,
  filteredCount,
  searchInputRef,
  onSearchChange,
  onClose,
  onLogout,
}: SystemLauncherProps) {
  return (
    <>
      <button
        type='button'
        aria-label='Đóng danh sách chức năng'
        tabIndex={open ? 0 : -1}
        className={'sv2-launcher-scrim' + (open ? ' is-open' : '')}
        onClick={onClose}
      />
      <aside aria-label='Danh sách chức năng hệ thống' aria-hidden={!open} inert={!open} className={'sv2-launcher' + (open ? ' is-open' : '')}>
        <div className='sv2-launcher__top'>
          <div><span>Menu</span><h2>Chức năng hệ thống</h2></div>
          <button type='button' className='sv2-icon-button' onClick={onClose} aria-label='Đóng'><X size={20} /></button>
        </div>
        <div className='sv2-launcher__search'>
          <Search size={18} />
          <input ref={searchInputRef} type='search' value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder='Tìm kiếm nhanh...' aria-label='Tìm chức năng' />
          <span>{filteredCount}</span>
        </div>
        <div className='sv2-launcher__body'>
          {filteredCount === 0 ? (
            <div className='sv2-empty-state'><Search size={25} /><strong>Không tìm thấy chức năng</strong><p>Thử một từ khóa khác nhé.</p></div>
          ) : Object.entries(featureGroups).map(([group, features]) => (
            <section key={group} className='sv2-launcher__group'>
              <h3>{group}</h3>
              <div>{features.map((feature) => {
                const FeatureIcon = getIcon(feature.icon);
                return feature.isAvailable ? (
                  <Link key={feature.key} to={feature.route} onClick={onClose} className='sv2-launcher-item'>
                    <span><FeatureIcon size={18} /></span>
                    <span><strong>{feature.title}</strong><small>{feature.description}</small></span>
                    <ChevronRight size={16} />
                  </Link>
                ) : (
                  <button key={feature.key} type='button' disabled className='sv2-launcher-item is-disabled'>
                    <span><FeatureIcon size={18} /></span>
                    <span><strong>{feature.title}</strong><small>{feature.description}</small></span>
                    <em>{feature.badge}</em>
                  </button>
                );
              })}</div>
            </section>
          ))}
        </div>
        <div className='sv2-launcher__footer'><button type='button' onClick={onLogout}><LogOut size={17} /> Đăng xuất</button></div>
      </aside>
    </>
  );
}
