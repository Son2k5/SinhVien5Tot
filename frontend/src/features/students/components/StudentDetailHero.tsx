import type { ReactNode } from 'react';
import { Mail, FileText, ClipboardCheck, CheckCircle2, Clock3, User, History } from 'lucide-react';
import type { AdminStudentDetail } from '../types/student.types';
import { ActiveBadge } from './StudentBadges';

interface HeroStatProps {
  label: string;
  value: number;
  icon: ReactNode;
  valueClass?: string;
  chipClass?: string;
}

function HeroStat({ label, value, icon, valueClass, chipClass }: HeroStatProps) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur border border-white shadow-[0_8px_24px_-12px_rgba(30,100,200,0.25)] px-4 py-3 min-w-[132px] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_rgba(30,100,200,0.35)]">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${chipClass ?? 'bg-blue-50 text-blue-600'}`}>
        {icon}
      </span>
      <span className="min-w-0 text-left">
        <span className={`block text-[20px] leading-none font-bold tracking-tight tabular-nums ${valueClass ?? 'text-slate-900'}`}>
          {value.toLocaleString('vi-VN')}
        </span>
        <span className="mt-1 block text-[11px] font-medium text-slate-500 whitespace-nowrap">{label}</span>
      </span>
    </div>
  );
}

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count?: number;
}

function TabBtn({ active, onClick, icon, label, count }: TabBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3 h-10 rounded-xl text-[13px] cursor-pointer whitespace-nowrap transition-[background-color,color,box-shadow] ${
        active
          ? 'bg-[#0b63d6] text-white font-semibold shadow-[0_8px_18px_-8px_rgba(11,99,214,0.7)]'
          : 'text-slate-500 font-medium hover:bg-sky-50 hover:text-sky-700'
      }`}
    >
      <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center tabular-nums ${
            active ? 'bg-white/25 text-white' : 'bg-sky-50 text-sky-700 border border-sky-100'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

interface StudentDetailHeroProps {
  student: AdminStudentDetail;
  stats: {
    apps: number;
    evTotal: number;
    evOk: number;
    evWait: number;
    logs: number;
  };
  activeTab: 'profile' | 'applications' | 'evidence' | 'history';
  onTabChange: (tab: 'profile' | 'applications' | 'evidence' | 'history') => void;
}

export function StudentDetailHero({
  student,
  stats,
  activeTab,
  onTabChange,
}: StudentDetailHeroProps) {
  const p = student.profile;
  const fullName = p?.fullName || student.displayName || student.email;

  return (
    <div className="space-y-4">
      {/* HERO — light blue system */}
      <section className="relative overflow-hidden rounded-[20px] border border-sky-100 bg-gradient-to-br from-[#f0f7ff] via-[#e6f1fe] to-[#dbeafe] shadow-[0_16px_40px_-20px_rgba(30,120,220,0.35)]">
        {/* Soft decor */}
        <div className="pointer-events-none absolute -top-24 -right-20 w-[380px] h-[380px] rounded-full bg-gradient-to-br from-sky-200/60 via-blue-100/40 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-cyan-100/70 via-sky-100/40 to-transparent blur-2xl" />
        <div className="relative p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center gap-5">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={fullName}
                  className="w-[72px] h-[72px] rounded-full object-cover ring-4 ring-white shadow-[0_10px_24px_-10px_rgba(20,90,180,0.45)]"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#0b63d6] to-[#38bdf8] text-white border-4 border-white shadow-[0_10px_24px_-10px_rgba(20,90,180,0.45)] flex items-center justify-center text-[26px] font-bold">
                  {(fullName.trim().charAt(0) || 'S').toUpperCase()}
                </div>
              )}
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-[3px] border-white shadow ${
                  student.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                title={student.isActive ? 'Đang hoạt động' : 'Đã khóa'}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-[19px] font-normal tracking-tight text-[#0f2a52] truncate">{fullName}</h1>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500 min-w-0">
                <Mail size={13} className="shrink-0 text-sky-500" />
                <span className="truncate font-normal">{student.email}</span>
                {p?.studentCode && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-inter text-[13px] font-normal text-slate-500 truncate">
                      {p.studentCode}
                    </span>
                  </>
                )}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <ActiveBadge active={student.isActive} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <HeroStat label="Đơn đăng ký" value={stats.apps} icon={<FileText size={17} />} chipClass="bg-blue-50 text-[#0b63d6]" />
            <HeroStat label="Minh chứng" value={stats.evTotal} icon={<ClipboardCheck size={17} />} chipClass="bg-sky-50 text-sky-600" />
            <HeroStat label="Đã duyệt" value={stats.evOk} icon={<CheckCircle2 size={17} />} chipClass="bg-emerald-50 text-emerald-600" valueClass="text-emerald-600" />
            <HeroStat label="Chờ duyệt" value={stats.evWait} icon={<Clock3 size={17} />} chipClass="bg-amber-50 text-amber-600" valueClass="text-amber-600" />
          </div>
        </div>
      </section>

      {/* Tabs navigation */}
      <div className="flex gap-1.5 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-[0_8px_24px_-16px_rgba(15,42,82,0.25)] overflow-x-auto">
        <TabBtn active={activeTab === 'profile'} onClick={() => onTabChange('profile')} icon={<User size={14} />} label="Hồ sơ" />
        <TabBtn active={activeTab === 'applications'} onClick={() => onTabChange('applications')} icon={<FileText size={14} />} label="Đơn đăng ký" count={stats.apps} />
        <TabBtn active={activeTab === 'evidence'} onClick={() => onTabChange('evidence')} icon={<ClipboardCheck size={14} />} label="Minh chứng" count={stats.evTotal} />
        <TabBtn active={activeTab === 'history'} onClick={() => onTabChange('history')} icon={<History size={14} />} label="Lịch sử" count={stats.logs} />
      </div>
    </div>
  );
}
