import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStudentDetail, useStudentMutations } from '../../hooks/admin/useStudents';
import { ActiveBadge, EvidenceStatusBadge, ReviewActionLabel, SubmissionStatusBadge, VerifiedBadge } from '../../components/admin/students/StudentBadges';
import { StudentReviewModal } from '../../components/admin/students/StudentReviewModal';
import type { AdminStudentEvidenceItem } from '../../types/admin/student';
import { sanitizeApiError } from '../../services/apiErrorSanitizer';
import { useAuthStore } from '../../store/useAuthStore';
import { canAccessAdmin } from '../../utils/authorization';
import { StudentLockDialog } from '../../components/admin/students/StudentLockDialog';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import {
  AlertCircle,
  Award,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Copy,
  FileText,
  Fingerprint,
  GraduationCap,
  Hash,
  History,
  IdCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Unlock,
  User,
  VenetianMask,
} from 'lucide-react';

const GENDER_LABELS: Record<string, string> = { None: '—', Male: 'Nam', Female: 'Nữ', Other: 'Khác' };
const POLITICAL_LABELS: Record<string, string> = { None: 'Chưa ghi nhận', UnionMember: 'Đoàn viên', PartyMember: 'Đảng viên' };
const ADDRESS_TYPE_LABELS: Record<string, string> = { Permanent: 'Thường trú', Temporary: 'Tạm trú', Current: 'Hiện tại', None: 'Khác' };
const ROLE_LABELS: Record<string, string> = { Admin: 'Quản trị viên', Mentor: 'Cố vấn / Mentor', User: 'Sinh viên' };

const GROUP_TONE: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  Ethics: { bg: '#eefbf6', text: '#0b7952', border: '#b9f0dc', bar: 'bg-emerald-500' },
  Study: { bg: '#edf6ff', text: '#1367bf', border: '#b8dcfe', bar: 'bg-blue-600' },
  Fitness: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', bar: 'bg-orange-500' },
  Volunteer: { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8', bar: 'bg-pink-500' },
  Integration: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', bar: 'bg-violet-500' },
};
const DEFAULT_GROUP_TONE = { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', bar: 'bg-slate-400' };

function fmtDT(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtD(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function HeroStat(p: { label: string; value: number; icon: React.ReactNode; valueClass?: string; chipClass?: string }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur border border-white shadow-[0_8px_24px_-12px_rgba(30,100,200,0.25)] px-4 py-3 min-w-[132px] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_rgba(30,100,200,0.35)]">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${p.chipClass ?? 'bg-blue-50 text-blue-600'}`}>{p.icon}</span>
      <span className="min-w-0 text-left">
        <span className={`block text-[20px] leading-none font-bold tracking-tight tabular-nums ${p.valueClass ?? 'text-slate-900'}`}>{p.value.toLocaleString('vi-VN')}</span>
        <span className="mt-1 block text-[11px] font-medium text-slate-500 whitespace-nowrap">{p.label}</span>
      </span>
    </div>
  );
}
function TabBtn(p: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number }) {
  return (
    <button
      type="button"
      onClick={p.onClick}
      className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3 h-10 rounded-xl text-[13px] cursor-pointer whitespace-nowrap transition-[background-color,color,box-shadow] ${p.active ? 'bg-[#0b63d6] text-white font-semibold shadow-[0_8px_18px_-8px_rgba(11,99,214,0.7)]' : 'text-slate-500 font-medium hover:bg-sky-50 hover:text-sky-700'}`}
    >
      <span className={p.active ? 'text-white' : 'text-slate-400'}>{p.icon}</span>
      {p.label}
      {p.count !== undefined && p.count > 0 && (
        <span className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center tabular-nums ${p.active ? 'bg-white/25 text-white' : 'bg-sky-50 text-sky-700 border border-sky-100'}`}>{p.count}</span>
      )}
    </button>
  );
}


function InfoRow(p: { icon: React.ReactNode; label: string; value?: string | null; mono?: boolean; copy?: string | null }) {
  const [copied, setCopied] = useState(false);
  const display = p.value && p.value.trim() ? p.value : '—';
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 shrink-0 pt-0.5">
        <span className="text-sky-500/80">{p.icon}</span>{p.label}
      </span>
      <span className="min-w-0 flex-1 flex items-start gap-1.5 justify-end">
        <span className={`flex-1 min-w-0 text-[13px] font-medium text-slate-800 text-right break-words whitespace-normal leading-relaxed ${p.mono ? 'font-mono !text-[12px] break-all' : ''}`}>{display}</span>
        {p.copy && (
          <button
            type="button"
            title="Sao chép"
            onClick={() => { void navigator.clipboard?.writeText(p.copy ?? '').then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); }).catch(() => undefined); }}
            className="w-6 h-6 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 inline-flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
          </button>
        )}
      </span>
    </div>
  );
}
function SectionCard(p: { icon: React.ReactNode; title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-slate-200/70 rounded-2xl shadow-[0_10px_30px_-18px_rgba(15,42,82,0.25)] overflow-hidden flex flex-col h-full ${p.className ?? ''}`}>
      <header className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5 bg-gradient-to-r from-sky-50/70 to-transparent">
        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">{p.icon}</span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-slate-800 tracking-tight">{p.title}</span>
          {p.sub && <span className="block text-[11px] text-slate-400 truncate">{p.sub}</span>}
        </span>
      </header>
      <div className="px-4 sm:px-5 py-2 flex-1">{p.children}</div>
    </section>
  );
}
export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isPending, isError, refetch } = useStudentDetail(id);
  const m = useStudentMutations();
  const [tab, setTab] = useState('profile');
  const [reviewing, setReviewing] = useState<AdminStudentEvidenceItem | null>(null);
  const [banner, setBanner] = useState<{ ok: boolean; msg: string } | null>(null);
  const [lockOpen, setLockOpen] = useState(false);
  const cur = useAuthStore((s) => s.user);
  const canLock = canAccessAdmin(cur);
  const stats = useMemo(() => {
    const evs = (data?.evidenceGroups ?? []).flatMap((g) => g.items);
    return {
      apps: data?.applications.length ?? 0,
      evTotal: evs.length,
      evOk: evs.filter((e) => e.status === 'Approved').length,
      evWait: evs.filter((e) => e.status === 'Submitted').length,
      logs: data?.reviewLogs.length ?? 0,
    };
  }, [data]);
  async function toggleLock(reason: string) {
    if (!id || !data) return;
    try {
      if (!data.isActive) {
        await m.unlockStudent.mutateAsync({ id, body: { reason: reason || null } });
        setBanner({ ok: true, msg: 'Đã mở khóa tài khoản.' });
      } else {
        await m.lockStudent.mutateAsync({ id, body: { reason: reason || null } });
        setBanner({ ok: true, msg: 'Đã khóa tài khoản.' });
      }
    } catch (e) {
      setBanner({ ok: false, msg: sanitizeApiError(e) });
      throw e instanceof Error ? e : new Error('Loi');
    }
  }

  async function submitReview(d: 'Approved' | 'Rejected' | 'NeedsRevision', note: string) {
    if (!id || !reviewing) return;
    try {
      await m.reviewEvidence.mutateAsync({ id, body: { evidenceId: reviewing.id, decision: d, note: note || null, rowVersion: reviewing.rowVersion } });
      setBanner({ ok: true, msg: 'Đã lưu kết quả xét duyệt.' });
    } catch (e) {
      setBanner({ ok: false, msg: sanitizeApiError(e) });
      throw e instanceof Error ? e : new Error('Loi');
    }
  }

  if (isPending) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-4 animate-pulse">
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="w-full max-w-3xl mx-auto py-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <span className="mx-auto w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <AlertCircle size={24} />
          </span>
          <p className="mt-3 text-[15px] font-semibold text-slate-900">Không tải được hồ sơ sinh viên</p>
          <p className="mt-1 text-xs text-slate-500">Đường truyền gián đoạn hoặc hồ sơ đã bị xóa. Vui lòng thử lại.</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button type="button" onClick={() => void refetch()} className="btn-compact-outline inline-flex items-center gap-1.5">
              <RefreshCw size={14} /> Thử lại
            </button>
            <Link to="/admin/students" className="btn-compact">Về danh sách</Link>
          </div>
        </div>
      </div>
    );
  }

  const p = data.profile;
  const fullName = p?.fullName || data.displayName || data.email;
  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 pb-12 animate-fade-in">
      <AdminPageHeader
        title="Hồ sơ sinh viên"
        description="Thông tin tài khoản • hồ sơ học vụ • đơn đăng ký • minh chứng • nhật ký xét duyệt"
        actions={
          <div className="flex shrink-0 items-center gap-2">
            <Link to="/admin/students" className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-sky-200 hover:bg-sky-50/60 hover:text-sky-700 transition-[background-color,border-color,color]">
              Danh sách
            </Link>
            {canLock && !data.isDeleted && (
              <button
                type="button"
                onClick={() => setLockOpen(true)}
                className={`h-9 px-4 inline-flex items-center gap-1.5 rounded-xl text-[13px] font-semibold text-white cursor-pointer transition-[background-color,box-shadow] active:scale-[0.98] shadow-[0_8px_18px_-8px_rgba(220,38,38,0.6)] ${data.isActive ? 'bg-gradient-to-b from-[#ef4444] to-[#dc2626] hover:from-[#dc2626] hover:to-[#b91c1c]' : 'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 !shadow-[0_8px_18px_-8px_rgba(16,185,129,0.6)]'}`}
              >
                {data.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                {data.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>
            )}
          </div>
        }
      />
      {banner && (
        <div className={`px-3.5 py-2.5 rounded-2xl border text-[13px] font-medium flex items-center gap-2 ${banner.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
          <CheckCircle2 size={15} className="shrink-0" />
          {banner.msg}
        </div>
      )}
      {/* HERO — light blue system */}
      <section className="relative overflow-hidden rounded-[20px] border border-sky-100 bg-gradient-to-br from-[#f0f7ff] via-[#e6f1fe] to-[#dbeafe] shadow-[0_16px_40px_-20px_rgba(30,120,220,0.35)]">
        {/* soft decor */}
        <div className="pointer-events-none absolute -top-24 -right-20 w-[380px] h-[380px] rounded-full bg-gradient-to-br from-sky-200/60 via-blue-100/40 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-cyan-100/70 via-sky-100/40 to-transparent blur-2xl" />
        <div className="relative p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center gap-5">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              {data.avatarUrl ? (
                <img src={data.avatarUrl} alt={fullName} className="w-[72px] h-[72px] rounded-full object-cover ring-4 ring-white shadow-[0_10px_24px_-10px_rgba(20,90,180,0.45)]" />
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#0b63d6] to-[#38bdf8] text-white border-4 border-white shadow-[0_10px_24px_-10px_rgba(20,90,180,0.45)] flex items-center justify-center text-[26px] font-bold">{(fullName.trim().charAt(0) || 'S').toUpperCase()}</div>
              )}
              <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-[3px] border-white shadow ${data.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} title={data.isActive ? 'Đang hoạt động' : 'Đã khóa'} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-[19px] font-normal tracking-tight text-[#0f2a52] truncate">{fullName}</h1>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500 min-w-0">
                <Mail size={13} className="shrink-0 text-sky-500" />
                <span className="truncate font-normal">{data.email}</span>
                {p?.studentCode && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-[12px] text-slate-500 truncate">{p.studentCode}</span>
                  </>
                )}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <VerifiedBadge verified={data.isVerified} />
                <ActiveBadge active={data.isActive} />
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
      <div className="flex gap-1.5 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-[0_8px_24px_-16px_rgba(15,42,82,0.25)] overflow-x-auto">
        <TabBtn active={tab === 'profile'} onClick={() => setTab('profile')} icon={<User size={14} />} label="Hồ sơ" />
        <TabBtn active={tab === 'apps'} onClick={() => setTab('apps')} icon={<FileText size={14} />} label="Đơn đăng ký" count={stats.apps} />
        <TabBtn active={tab === 'evidence'} onClick={() => setTab('evidence')} icon={<ClipboardCheck size={14} />} label="Minh chứng" count={stats.evTotal} />
        <TabBtn active={tab === 'logs'} onClick={() => setTab('logs')} icon={<History size={14} />} label="Lịch sử" count={stats.logs} />
      </div>

      {tab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 items-stretch">
            <SectionCard icon={<GraduationCap size={16} />} title="Học vụ" sub="Mã sinh viên • Trường • Khoa • Lớp • Khóa">
              <InfoRow icon={<Hash size={13} />} label="Mã sinh viên" value={p?.studentCode} mono copy={p?.studentCode} />
              <InfoRow icon={<GraduationCap size={13} />} label="Khoa và viện" value={p?.faculty} />
              <InfoRow icon={<FileText size={13} />} label="Chuyên ngành" value={p?.major} />
              <InfoRow icon={<User size={13} />} label="Lớp hành chính" value={p?.administrativeClass} mono />
              <InfoRow icon={<GraduationCap size={13} />} label="Trường" value={p?.school} />
              <InfoRow icon={<CalendarDays size={13} />} label="Khóa tuyển sinh" value={p?.academicYear ? `K${p.academicYear}` : null} />
              <InfoRow icon={<Award size={13} />} label="Chức vụ Đoàn và Hội" value={p?.unionPosition} />
            </SectionCard>
            <SectionCard icon={<User size={16} />} title="Cá nhân và liên hệ" sub="Định danh • Số điện thoại • Email">
              <InfoRow icon={<User size={13} />} label="Họ tên" value={p?.fullName} />
              <InfoRow icon={<CalendarDays size={13} />} label="Ngày sinh" value={fmtD(p?.birthDate)} />
              <InfoRow icon={<VenetianMask size={13} />} label="Giới tính" value={p?.gender ? GENDER_LABELS[p.gender] ?? p.gender : null} />
              <InfoRow icon={<Phone size={13} />} label="Số điện thoại" value={p?.phoneNumber} mono copy={p?.phoneNumber} />
              <InfoRow icon={<Mail size={13} />} label="Email liên hệ" value={p?.contactEmail} copy={p?.contactEmail} />
              <InfoRow icon={<IdCard size={13} />} label="Căn cước công dân" value={p?.identityCardNumber} mono copy={p?.identityCardNumber} />
              <InfoRow icon={<BadgeCheck size={13} />} label="Dân tộc" value={p?.ethnicity} />
              <InfoRow icon={<ShieldCheck size={13} />} label="Đoàn và Đảng" value={p?.politicalStatus ? POLITICAL_LABELS[p.politicalStatus] ?? p.politicalStatus : null} />
              <InfoRow icon={<Award size={13} />} label="Chức vụ hiện tại" value={p?.currentPosition ?? 'Sinh viên'} />
            </SectionCard>
            <SectionCard icon={<Fingerprint size={16} />} title="Tài khoản" sub="Email đăng nhập • vai trò">
              <InfoRow icon={<User size={13} />} label="Tên hiển thị" value={data.displayName} />
              <InfoRow icon={<Mail size={13} />} label="Email đăng nhập" value={data.email} copy={data.email} />
              <InfoRow icon={<ShieldCheck size={13} />} label="Vai trò" value={ROLE_LABELS[data.role] ?? data.role} />
              <InfoRow icon={<Clock3 size={13} />} label="Ngày tham gia" value={fmtDT(data.createdAt)} />
              <InfoRow icon={<Clock3 size={13} />} label="Cập nhật lần cuối" value={fmtDT(data.updatedAt)} />
              {data.isDeleted && <InfoRow icon={<AlertCircle size={13} />} label="Trạng thái xóa" value={fmtDT(data.deletedAt)} />}
            </SectionCard>
            <SectionCard icon={<MapPin size={16} />} title="Nơi cư trú" sub="Thường trú • Tạm trú">
              {(p?.addresses ?? []).length === 0 ? (
                <p className="py-3 text-center text-xs text-slate-400">Chưa cập nhật địa chỉ.</p>
              ) : (
                <div className="py-2 space-y-2.5">
                  {(p?.addresses ?? []).map((a, i) => (
                    <div key={`${a.addressType}-${i}`} className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-sky-700">{ADDRESS_TYPE_LABELS[a.addressType] ?? a.addressType}</div>
                      <div className="mt-1 text-[13px] font-medium text-slate-800 leading-relaxed">
                        {[a.streetAddress, a.district, a.provinceOrCity].map((s) => (s || '').trim()).filter(Boolean).join(', ') || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
        </div>
      )}
      {tab === 'apps' && (
        <div className="space-y-3">
          {data.applications.length === 0 && (
            <div className="bg-white border border-slate-200/70 rounded-2xl p-10 text-center shadow-[0_10px_30px_-18px_rgba(15,42,82,0.25)]">
              <FileText size={28} className="mx-auto text-sky-200" />
              <p className="mt-2 text-sm text-slate-500">Chưa có đơn đăng ký SV5T.</p>
            </div>
          )}
          {data.applications.map((a) => (
            <article key={a.id} className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-[0_10px_30px_-20px_rgba(15,42,82,0.3)] flex flex-col sm:flex-row sm:items-center gap-3 hover:border-sky-200 hover:shadow-[0_14px_34px_-18px_rgba(11,99,214,0.35)] transition-[border-color,box-shadow]">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 text-[#0b63d6] border border-sky-100 flex items-center justify-center shrink-0"><Award size={18} /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-normal text-slate-800 truncate tracking-tight">{a.campaignName}</div>
                <div className="mt-0.5 text-[11px] text-slate-500 font-mono truncate">{a.applicationCode} • Năm học {a.schoolYear} • {a.evidenceCount} minh chứng</div>
              </div>
              <SubmissionStatusBadge status={a.status} />
            </article>
          ))}
        </div>
      )}
      {tab === 'evidence' && (
        <div className="space-y-4">
          {data.evidenceGroups.length === 0 && (
            <div className="bg-white border border-slate-200/70 rounded-2xl p-10 text-center shadow-[0_10px_30px_-18px_rgba(15,42,82,0.25)]">
              <ClipboardCheck size={28} className="mx-auto text-sky-200" />
              <p className="mt-2 text-sm text-slate-500">Chưa có minh chứng.</p>
            </div>
          )}
          {data.evidenceGroups.map((g) => {
            const pct = g.totalCount > 0 ? Math.round((g.approvedCount / g.totalCount) * 100) : 0;
            const tone = GROUP_TONE[g.groupCode ?? ''] ?? DEFAULT_GROUP_TONE;
            return (
            <section key={g.groupName} className="bg-white border border-slate-200/70 rounded-2xl shadow-[0_10px_30px_-18px_rgba(15,42,82,0.25)] overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-sky-50/60 to-transparent flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 px-2.5 h-[26px] rounded-full border text-[11px] font-semibold whitespace-nowrap" style={{ backgroundColor: tone.bg, color: tone.text, borderColor: tone.border }}>
                  <ClipboardCheck size={13} />{g.groupName}
                </span>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">{g.approvedCount}/{g.totalCount} • {pct}%</span>
              </div>
              <div className="px-4 sm:px-5 pt-3">
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {g.items.map((e) => (
                  <div key={e.id} className="px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-sky-50/50 transition-colors group">
                    <span className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-sky-50 group-hover:text-sky-600 group-hover:border-sky-100 transition-colors"><FileText size={15} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-normal text-slate-800 truncate">{e.criterionCode} — {e.criterionTitle}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500 truncate">Đơn {e.applicationCode}</div>
                    </div>
                    <EvidenceStatusBadge status={e.status} />
                    <button type="button" onClick={() => setReviewing(e)} className="h-8 px-3 inline-flex items-center rounded-xl text-[12px] font-semibold text-[#0b63d6] bg-sky-50 border border-sky-100 hover:bg-[#0b63d6] hover:text-white hover:border-[#0b63d6] cursor-pointer transition-[background-color,border-color,color] shrink-0">Duyệt</button>
                  </div>
                ))}
              </div>
            </section>
            );
          })}
        </div>
      )}
      {tab === 'logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          <div className="lg:col-span-2 h-full">
            <section className="bg-white border border-slate-200/70 rounded-2xl shadow-[0_10px_30px_-18px_rgba(15,42,82,0.25)] overflow-hidden flex flex-col h-full">
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-sky-50/60 to-transparent text-[13px] font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0"><History size={15} /></span> Nhật ký xét duyệt ({data.reviewLogs.length})
              </div>
              {data.reviewLogs.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400">Chưa có hoạt động xét duyệt.</p>
              ) : (
              <ol className="relative ml-5 my-4 border-l border-sky-100 space-y-4 pr-4">
                {data.reviewLogs.map((l) => (
                  <li key={l.id} className="ml-5 relative">
                    <span className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-[#0b63d6] ring-4 ring-sky-100" />
                    <ReviewActionLabel action={l.action} />
                    <div className="mt-1 text-[11px] text-slate-500">{l.actorName ? `${l.actorName} • ` : ''}{fmtDT(l.createdAt)}{l.note ? ` • ${l.note}` : ''}</div>
                  </li>
                ))}
              </ol>
              )}
            </section>
          </div>
          <SectionCard icon={<Hash size={16} />} title="Thông tin hệ thống" sub="Ngày tham gia • cập nhật">
            <InfoRow icon={<Hash size={13} />} label="Ảnh đại diện" value={data.avatarUrl ? 'Đã có ảnh' : 'Chưa có'} />
            <InfoRow icon={<Clock3 size={13} />} label="Ngày tham gia" value={fmtDT(data.createdAt)} />
            <InfoRow icon={<Clock3 size={13} />} label="Cập nhật lần cuối" value={fmtDT(data.updatedAt)} />
            {data.isDeleted && <InfoRow icon={<AlertCircle size={13} />} label="Trạng thái xóa" value={fmtDT(data.deletedAt)} />}
            <InfoRow icon={<ShieldCheck size={13} />} label="Vai trò" value={ROLE_LABELS[data.role] ?? data.role} />
          </SectionCard>
        </div>
      )}
      <StudentReviewModal isOpen={Boolean(reviewing)} evidence={reviewing} isLoading={m.reviewEvidence.isPending} onClose={() => setReviewing(null)} onSubmit={submitReview} />
      <StudentLockDialog isOpen={lockOpen} isLoading={m.lockStudent.isPending} onClose={() => setLockOpen(false)} onConfirm={toggleLock} student={data ? { id: data.id, fullName: fullName, email: data.email, studentCode: p?.studentCode ?? '', isActive: data.isActive } : null} />
    </div>
  );
}