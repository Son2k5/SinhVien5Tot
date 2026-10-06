import { useState, type ReactNode } from 'react';
import {
  GraduationCap,
  Hash,
  FileText,
  User,
  CalendarDays,
  Award,
  VenetianMask,
  Phone,
  Mail,
  IdCard,
  BadgeCheck,
  ShieldCheck,
  Fingerprint,
  Clock3,
  AlertCircle,
  MapPin,
  Check,
  Copy,
} from 'lucide-react';
import type { AdminStudentDetail } from '../types/student.types';
import {
  ADDRESS_TYPE_LABELS,
  GENDER_LABELS,
  POLITICAL_LABELS,
  ROLE_LABELS,
} from '../types/student.types';

function fmtDT(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function fmtD(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function InfoRow(p: { icon: ReactNode; label: string; value?: string | null; copy?: string | null }) {
  const [copied, setCopied] = useState(false);
  const display = p.value && p.value.trim() ? p.value : '—';
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0 font-inter text-[13px]">
      <span className="inline-flex items-center gap-2 text-slate-500 shrink-0 font-normal text-[13px]">
        <span className="text-sky-500/80">{p.icon}</span>
        {p.label}
      </span>
      <span className="min-w-0 flex-1 flex items-center gap-1.5 justify-end">
        <span className="flex-1 min-w-0 text-[13px] font-normal text-slate-800 text-right break-words whitespace-normal leading-relaxed">
          {display}
        </span>
        {p.copy && (
          <button
            type="button"
            title="Sao chép"
            onClick={() => {
              void navigator.clipboard
                ?.writeText(p.copy ?? '')
                .then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                })
                .catch(() => undefined);
            }}
            className="w-6 h-6 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 inline-flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
          </button>
        )}
      </span>
    </div>
  );
}

function SectionCard(p: {
  icon: ReactNode;
  title: string;
  sub?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-white border border-slate-200/70 rounded-2xl shadow-[0_10px_30px_-18px_rgba(15,42,82,0.25)] overflow-hidden flex flex-col h-full font-inter ${
        p.className ?? ''
      }`}
    >
      <header className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5 bg-gradient-to-r from-sky-50/70 to-transparent">
        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
          {p.icon}
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-slate-800 tracking-tight">{p.title}</span>
          {p.sub && <span className="block text-[11px] text-slate-400 truncate">{p.sub}</span>}
        </span>
      </header>
      <div className="px-4 sm:px-5 py-2 flex-1 font-inter">{p.children}</div>
    </section>
  );
}

interface StudentDetailProfileTabProps {
  student: AdminStudentDetail;
}

export function StudentDetailProfileTab({ student }: StudentDetailProfileTabProps) {
  const p = student.profile;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 items-stretch font-inter">
      <SectionCard icon={<GraduationCap size={16} />} title="Học vụ" sub="Mã sinh viên • Trường • Khoa • Lớp • Khóa">
        <InfoRow icon={<Hash size={13} />} label="Mã sinh viên" value={p?.studentCode} copy={p?.studentCode} />
        <InfoRow icon={<GraduationCap size={13} />} label="Khoa và viện" value={p?.faculty} />
        <InfoRow icon={<FileText size={13} />} label="Chuyên ngành" value={p?.major} />
        <InfoRow icon={<User size={13} />} label="Lớp hành chính" value={p?.administrativeClass} />
        <InfoRow icon={<GraduationCap size={13} />} label="Trường" value={p?.school} />
        <InfoRow icon={<CalendarDays size={13} />} label="Khóa tuyển sinh" value={p?.academicYear ? `K${p.academicYear}` : null} />
        <InfoRow icon={<Award size={13} />} label="Chức vụ Đoàn và Hội" value={p?.unionPosition} />
      </SectionCard>

      <SectionCard icon={<User size={16} />} title="Cá nhân và liên hệ" sub="Định danh • Số điện thoại • Email">
        <InfoRow icon={<User size={13} />} label="Họ tên" value={p?.fullName} />
        <InfoRow icon={<CalendarDays size={13} />} label="Ngày sinh" value={fmtD(p?.birthDate)} />
        <InfoRow icon={<VenetianMask size={13} />} label="Giới tính" value={p?.gender ? GENDER_LABELS[p.gender] ?? p.gender : null} />
        <InfoRow icon={<Phone size={13} />} label="Số điện thoại" value={p?.phoneNumber} copy={p?.phoneNumber} />
        <InfoRow icon={<Mail size={13} />} label="Email liên hệ" value={p?.contactEmail} copy={p?.contactEmail} />
        <InfoRow icon={<IdCard size={13} />} label="Căn cước công dân" value={p?.identityCardNumber} copy={p?.identityCardNumber} />
        <InfoRow icon={<BadgeCheck size={13} />} label="Dân tộc" value={p?.ethnicity} />
        <InfoRow icon={<ShieldCheck size={13} />} label="Đoàn và Đảng" value={p?.politicalStatus ? POLITICAL_LABELS[p.politicalStatus] ?? p.politicalStatus : null} />
        <InfoRow icon={<Award size={13} />} label="Chức vụ hiện tại" value={p?.currentPosition ?? 'Sinh viên'} />
      </SectionCard>

      <SectionCard icon={<Fingerprint size={16} />} title="Tài khoản" sub="Email đăng nhập • vai trò">
        <InfoRow icon={<User size={13} />} label="Tên hiển thị" value={student.displayName} />
        <InfoRow icon={<Mail size={13} />} label="Email đăng nhập" value={student.email} copy={student.email} />
        <InfoRow icon={<ShieldCheck size={13} />} label="Vai trò" value={ROLE_LABELS[student.role] ?? student.role} />
        <InfoRow icon={<Clock3 size={13} />} label="Ngày tham gia" value={fmtDT(student.createdAt)} />
        <InfoRow icon={<Clock3 size={13} />} label="Cập nhật lần cuối" value={fmtDT(student.updatedAt)} />
        {student.isDeleted && <InfoRow icon={<AlertCircle size={13} />} label="Trạng thái xóa" value={fmtDT(student.deletedAt)} />}
      </SectionCard>

      <SectionCard icon={<MapPin size={16} />} title="Nơi cư trú" sub="Thường trú • Tạm trú">
        {(p?.addresses ?? []).length === 0 ? (
          <p className="py-3 text-center text-[13px] text-slate-400 font-inter font-normal">Chưa cập nhật địa chỉ.</p>
        ) : (
          <div className="py-2 space-y-2.5 font-inter">
            {(p?.addresses ?? []).map((a, i) => (
              <div key={`${a.addressType}-${i}`} className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                <div className="text-[12px] font-medium uppercase tracking-wide text-sky-700">
                  {ADDRESS_TYPE_LABELS[a.addressType] ?? a.addressType}
                </div>
                <div className="mt-1 text-[13px] font-normal text-slate-800 leading-relaxed">
                  {[a.streetAddress, a.district, a.provinceOrCity].map((s) => (s || '').trim()).filter(Boolean).join(', ') || '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
