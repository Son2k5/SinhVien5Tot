import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentDetail } from '../hooks/useStudents';
import type { AdminStudentListItem } from '../types/student.types';
import { ActiveBadge, SubmissionStatusBadge } from './StudentBadges';
import {
  X,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  User,
  MapPin,
  FileText,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  Activity,
  HeartHandshake,
  Globe,
  BarChart2,
  PieChart,
} from 'lucide-react';
import { ApplicationDetailModal } from '../../applications';

interface StudentDetailModalProps {
  isOpen: boolean;
  studentId: string | null;
  fallbackItem?: AdminStudentListItem | null;
  onClose: () => void;
}

const POLITICAL_LABELS: Record<string, string> = {
  None: 'Không',
  UnionMember: 'Đoàn viên',
  PartyMember: 'Đảng viên',
};

const GENDER_LABELS: Record<string, string> = {
  None: '—',
  Male: 'Nam',
  Female: 'Nữ',
  Other: 'Khác',
};

const ADDRESS_TYPE_LABELS: Record<string, string> = {
  Permanent: 'Thường trú',
  Temporary: 'Tạm trú',
  Current: 'Hiện tại',
  None: 'Khác',
};

interface StandardGroupDef {
  code: string;
  name: string;
  icon: typeof ShieldCheck;
  color: string;
  bgColor: string;
  borderColor: string;
  barColor: string;
}

const STANDARD_GROUPS: StandardGroupDef[] = [
  {
    code: 'Ethics',
    name: 'Đạo đức tốt',
    icon: ShieldCheck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    barColor: 'bg-blue-500',
  },
  {
    code: 'Study',
    name: 'Học tập tốt',
    icon: BookOpen,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    barColor: 'bg-indigo-500',
  },
  {
    code: 'Fitness',
    name: 'Thể lực tốt',
    icon: Activity,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    barColor: 'bg-emerald-500',
  },
  {
    code: 'Volunteer',
    name: 'Tình nguyện tốt',
    icon: HeartHandshake,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    barColor: 'bg-amber-500',
  },
  {
    code: 'Integration',
    name: 'Hội nhập tốt',
    icon: Globe,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    barColor: 'bg-purple-500',
  },
];

const fmtAddress = (a?: { provinceOrCity?: string | null; district?: string | null; streetAddress?: string | null } | null) => {
  if (!a) return '—';
  const parts = [a.streetAddress, a.district, a.provinceOrCity].map((s) => (s || '').trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '—';
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export function StudentDetailModal({
  isOpen,
  studentId,
  fallbackItem,
  onClose,
}: StudentDetailModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'records'>('info');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const { data, isPending, isError, refetch } = useStudentDetail(
    isOpen && studentId ? studentId : undefined
  );

  if (!isOpen) return null;

  const profile = data?.profile;
  const fullName = profile?.fullName || fallbackItem?.fullName || data?.displayName || 'Sinh viên';
  const email = data?.email || fallbackItem?.email || '—';
  const studentCode = profile?.studentCode || fallbackItem?.studentCode || '—';
  const isActive = data ? data.isActive : Boolean(fallbackItem?.isActive);

  const avatarUrl = data?.avatarUrl ?? null;
  const initial = (fullName.trim().charAt(0) || 'S').toUpperCase();
  const applications = data?.applications ?? [];
  const evidenceGroups = data?.evidenceGroups ?? [];

  // Statistics calculation for combined Hồ sơ & Minh chứng tab
  const totalApps = applications.length;

  const allItems = evidenceGroups.flatMap((g) => g.items || []);
  const totalEvidences = evidenceGroups.reduce((acc, g) => acc + g.totalCount, 0);
  const approvedEvidences = evidenceGroups.reduce((acc, g) => acc + g.approvedCount, 0);

  const statusCounts = {
    Approved: allItems.filter((i) => i.status === 'Approved').length || approvedEvidences,
    Submitted: allItems.filter((i) => i.status === 'Submitted').length,
    NeedsRevision: allItems.filter((i) => i.status === 'NeedsRevision').length,
    Rejected: allItems.filter((i) => i.status === 'Rejected').length,
    Draft: allItems.filter((i) => i.status === 'Draft').length,
  };

  const knownStatusSum =
    statusCounts.Approved +
    statusCounts.Submitted +
    statusCounts.NeedsRevision +
    statusCounts.Rejected +
    statusCounts.Draft;

  if (knownStatusSum < totalEvidences) {
    statusCounts.Submitted += totalEvidences - knownStatusSum;
  }

  const approvalRate = totalEvidences > 0 ? Math.round((approvedEvidences / totalEvidences) * 100) : 0;

  // 5 Standard groups evaluation
  const standardGroupsEvaluated = STANDARD_GROUPS.map((std) => {
    const g = evidenceGroups.find((eg) => {
      if (eg.groupCode && String(eg.groupCode).toLowerCase() === std.code.toLowerCase()) return true;
      if (eg.groupName && eg.groupName.toLowerCase().includes(std.name.toLowerCase().replace(' tốt', ''))) return true;
      return false;
    });
    const total = g?.totalCount ?? 0;
    const approved = g?.approvedCount ?? 0;
    const isComplete = total > 0 && approved >= total;
    const percent = total > 0 ? Math.round((approved / total) * 100) : 0;
    return {
      ...std,
      total,
      approved,
      isComplete,
      percent,
      items: g?.items ?? [],
    };
  });

  const otherGroups = evidenceGroups.filter(
    (g) =>
      !STANDARD_GROUPS.some(
        (std) =>
          (g.groupCode && String(g.groupCode).toLowerCase() === std.code.toLowerCase()) ||
          (g.groupName && g.groupName.toLowerCase().includes(std.name.toLowerCase().replace(' tốt', '')))
      )
  );

  const completedGroupsCount = standardGroupsEvaluated.filter((g) => g.isComplete).length;

  // Donut chart status breakdown items
  const evidenceStatusItems = [
    { key: 'Approved', label: 'Đã duyệt', count: statusCounts.Approved, color: '#10b981' },
    { key: 'Submitted', label: 'Chờ xét duyệt', count: statusCounts.Submitted, color: '#3b82f6' },
    { key: 'NeedsRevision', label: 'Cần bổ sung', count: statusCounts.NeedsRevision, color: '#f59e0b' },
    { key: 'Rejected', label: 'Từ chối', count: statusCounts.Rejected, color: '#ef4444' },
    { key: 'Draft', label: 'Bản nháp', count: statusCounts.Draft, color: '#94a3b8' },
  ];

  let cursor = 0;
  const donutGradient = evidenceStatusItems
    .filter((item) => item.count > 0)
    .map((item) => {
      const start = cursor;
      cursor += totalEvidences > 0 ? (item.count / totalEvidences) * 360 : 0;
      return `${item.color} ${start}deg ${cursor}deg`;
    })
    .join(', ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết sinh viên"
    >
      <div
        className="w-full max-w-[880px] bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] max-h-[94vh] animate-in zoom-in-95 duration-150 font-inter font-['Inter',_sans-serif]"
        style={{ fontFamily: "'Inter', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-12 h-12 rounded-full object-cover bg-slate-100 ring-1 ring-slate-200" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 text-lg font-medium flex items-center justify-center select-none">
                  {initial}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-[15px] font-normal text-slate-800 truncate">{fullName}</h3>
              </div>
              <p className="mt-0.5 text-[13px] font-normal text-slate-500 truncate">{email}</p>
            </div>
          </div>

          {/* Right side: Trạng thái nằm bên cạnh nút X */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <ActiveBadge active={isActive} />
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-6 px-6 pt-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 -mb-px text-[13px] cursor-pointer transition-colors border-b-2 ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
            }`}
          >
            Thông tin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('records')}
            className={`pb-2.5 -mb-px text-[13px] cursor-pointer transition-colors border-b-2 font-medium ${
              activeTab === 'records'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Hồ sơ & Minh chứng
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Loading State */}
          {isPending && (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-xl" />
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {!isPending && isError && (
            <div className="py-8 text-center space-y-3">
              <AlertCircle size={28} className="text-rose-500 mx-auto" />
              <div className="text-slate-700 font-semibold">Không thể tải thông tin chi tiết của sinh viên</div>
              <button
                type="button"
                onClick={() => void refetch()}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1 text-slate-700"
              >
                <RefreshCw size={12} /> Thử lại
              </button>
            </div>
          )}

          {/* Data Tab 1: Thông tin hồ sơ */}
          {!isPending && !isError && activeTab === 'info' && (
            <div className="space-y-4">
              {/* Nhóm học vụ - nơi học tập */}
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 space-y-3 font-inter">
                <div className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5 font-inter">
                  <GraduationCap size={15} className="text-blue-600" /> Nơi học tập
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-inter text-[13px]">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Mã sinh viên:</span>
                    <span className="font-normal text-slate-800 text-right">{studentCode}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 sm:col-span-2">
                    <span className="text-slate-500 font-normal">Trường:</span>
                    <span className="font-normal text-slate-800 text-right">{profile?.school || fallbackItem?.school || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Khoa / Viện:</span>
                    <span className="font-normal text-slate-800 text-right">{profile?.faculty || fallbackItem?.faculty || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Chuyên ngành:</span>
                    <span className="font-normal text-slate-800 text-right">{profile?.major || fallbackItem?.major || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Lớp hành chính:</span>
                    <span className="font-normal text-slate-800 text-right">{profile?.administrativeClass || fallbackItem?.administrativeClass || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Khóa tuyển sinh:</span>
                    <span className="font-normal text-slate-800 text-right">
                      {profile?.academicYear ? `K${profile.academicYear}` : fallbackItem?.academicYear ? `K${fallbackItem.academicYear}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Email liên hệ:</span>
                    <span className="font-normal text-slate-800 text-right break-all">{profile?.contactEmail || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Chức vụ Đoàn/Hội:</span>
                    <span className="font-normal text-slate-800 text-right">{profile?.unionPosition || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Nhóm cá nhân & liên hệ */}
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 space-y-3 font-inter">
                <div className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5 font-inter">
                  <User size={15} className="text-violet-600" /> Cá nhân & liên hệ
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-inter text-[13px]">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Ngày sinh:</span>
                    <span className="font-normal text-slate-800 text-right">{fmtDate(profile?.birthDate)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Giới tính:</span>
                    <span className="font-normal text-slate-800 text-right">
                      {profile?.gender ? GENDER_LABELS[profile.gender] ?? profile.gender : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Số điện thoại:</span>
                    <span className="font-normal text-slate-800 text-right">{profile?.phoneNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">CCCD / CMND:</span>
                    <span className="font-normal text-slate-800 text-right">{profile?.identityCardNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Dân tộc:</span>
                    <span className="font-normal text-slate-800 text-right">{profile?.ethnicity || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Đoàn / Đảng:</span>
                    <span className="font-normal text-slate-800 text-right">
                      {profile?.politicalStatus ? POLITICAL_LABELS[profile.politicalStatus] ?? profile.politicalStatus : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 sm:col-span-2">
                    <span className="text-slate-500 font-normal">Chức vụ hiện tại:</span>
                    <span className="font-normal text-slate-800 text-right">{profile?.currentPosition || 'Sinh viên'}</span>
                  </div>
                </div>
              </div>

              {/* Nơi cư trú */}
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 space-y-3 font-inter">
                <div className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5 font-inter">
                  <MapPin size={15} className="text-emerald-600" /> Nơi cư trú
                </div>
                {(() => {
                  const addresses = profile?.addresses ?? [];
                  const perm = addresses.find((a) => a.addressType === 'Permanent');
                  const temp = addresses.find((a) => a.addressType === 'Temporary');
                  if (addresses.length === 0) {
                    return <div className="text-slate-400 text-[13px] font-normal py-2 text-center font-inter">Chưa cập nhật địa chỉ thường trú / tạm trú.</div>;
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-inter">
                      {perm && (
                        <div className="bg-white border border-slate-200 rounded-lg p-3 font-inter">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Thường trú</div>
                          <div className="text-[13px] font-normal text-slate-800 leading-relaxed">{fmtAddress(perm)}</div>
                        </div>
                      )}
                      {temp && (
                        <div className="bg-white border border-slate-200 rounded-lg p-3 font-inter">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Tạm trú</div>
                          <div className="text-[13px] font-normal text-slate-800 leading-relaxed">{fmtAddress(temp)}</div>
                        </div>
                      )}
                      {addresses.filter((a) => a.addressType !== 'Permanent' && a.addressType !== 'Temporary').map((a) => (
                        <div key={a.addressType} className="bg-white border border-slate-200 rounded-lg p-3 font-inter">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                            {ADDRESS_TYPE_LABELS[a.addressType] ?? a.addressType}
                          </div>
                          <div className="text-[13px] font-normal text-slate-800 leading-relaxed">{fmtAddress(a)}</div>
                        </div>
                      ))}
                      {!perm && !temp && addresses.length > 0 && (
                        <div className="text-slate-400 text-[13px] font-normal font-inter">Đã có địa chỉ khác, xem chi tiết ở trên.</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Data Tab 2: Biểu đồ thống kê Hồ sơ & Minh chứng gộp */}
          {!isPending && !isError && activeTab === 'records' && (
            <div className="space-y-5">
              {totalApps === 0 && totalEvidences === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <BarChart2 size={28} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">Chưa có dữ liệu hồ sơ & minh chứng</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Sinh viên chưa đăng ký hồ sơ tham gia danh hiệu hoặc chưa cập nhật minh chứng nào trong hệ thống.
                  </p>
                </div>
              ) : (
                <>
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg px-3 py-2">
                      <div className="text-[11px] text-slate-500 font-normal">Hồ sơ</div>
                      <div className="text-[15px] font-semibold text-slate-800 mt-0.5">{totalApps}</div>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg px-3 py-2">
                      <div className="text-[11px] text-slate-500 font-normal">Minh chứng</div>
                      <div className="text-[15px] font-semibold text-slate-800 mt-0.5">{totalEvidences}</div>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg px-3 py-2">
                      <div className="text-[11px] text-slate-500 font-normal">Tỷ lệ duyệt</div>
                      <div className="text-[15px] font-semibold text-emerald-600 mt-0.5">{approvalRate}%</div>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg px-3 py-2">
                      <div className="text-[11px] text-slate-500 font-normal">Tiêu chuẩn đạt</div>
                      <div className="text-[15px] font-semibold text-slate-800 mt-0.5">{completedGroupsCount} / {STANDARD_GROUPS.length}</div>
                    </div>
                  </div>

                  {/* Dual Chart Section */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Donut Chart */}
                    <div className="md:col-span-5 bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
                      <div className="text-[13px] font-medium text-slate-700 flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <span className="flex items-center gap-1.5">
                          <PieChart size={15} className="text-blue-600" />
                          Phân bố trạng thái minh chứng
                        </span>
                      </div>

                      <div className="py-3 flex flex-col items-center">
                        <div
                          className="w-32 h-32 rounded-full grid place-items-center relative shrink-0 shadow-inner mb-3"
                          style={{
                            background:
                              totalEvidences > 0 && donutGradient
                                ? `conic-gradient(${donutGradient})`
                                : '#e2e8f0',
                          }}
                        >
                          <div className="w-20 h-20 rounded-full bg-white shadow-xs flex flex-col items-center justify-center text-center">
                            <span className="text-xl font-bold text-slate-800 leading-none">
                              {approvedEvidences}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 font-medium">/{totalEvidences} đạt</span>
                          </div>
                        </div>

                        {/* Status Legend */}
                        <div className="w-full space-y-1.5">
                          {evidenceStatusItems.map((item) => {
                            const pct = totalEvidences > 0 ? Math.round((item.count / totalEvidences) * 100) : 0;
                            return (
                              <div
                                key={item.key}
                                className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-xs transition-colors ${
                                  item.count > 0 ? 'bg-white border border-slate-150' : 'opacity-40'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className="text-slate-600 font-medium truncate">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-800 font-mono">{item.count}</span>
                                  <span className="text-[11px] text-slate-400 w-8 text-right font-mono">
                                    {item.count > 0 ? `${pct}%` : '0%'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar 5 Standard Groups */}
                    <div className="md:col-span-7 bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
                      <div className="text-[13px] font-medium text-slate-700 flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <span className="flex items-center gap-1.5">
                          <BarChart2 size={15} className="text-indigo-600" />
                          Tiến độ 5 tiêu chí Sinh viên 5 Tốt
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {completedGroupsCount} / {STANDARD_GROUPS.length} hoàn thành
                        </span>
                      </div>

                      <div className="py-2 space-y-3 flex-1 justify-center flex flex-col">
                        {standardGroupsEvaluated.map((std) => {
                          const Icon = std.icon;
                          return (
                            <div key={std.code} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div
                                    className={`w-5 h-5 rounded-md ${std.bgColor} ${std.color} flex items-center justify-center shrink-0`}
                                  >
                                    <Icon size={12} />
                                  </div>
                                  <span className="font-medium text-slate-800 truncate">{std.name}</span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {std.total === 0 ? (
                                    <span className="text-[11px] text-slate-400 bg-slate-150/70 px-2 py-0.5 rounded-md font-medium">
                                      Chưa nộp
                                    </span>
                                  ) : std.isComplete ? (
                                    <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                                      <CheckCircle2 size={11} /> Đạt ({std.approved}/{std.total})
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                                      <Clock size={11} /> {std.approved}/{std.total} ({std.percent}%)
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    std.isComplete ? 'bg-emerald-500' : std.approved > 0 ? 'bg-blue-500' : 'bg-amber-400'
                                  }`}
                                  style={{ width: `${std.total > 0 ? Math.max(std.percent, 8) : 0}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}

                        {otherGroups.map((og) => {
                          const percent = og.totalCount > 0 ? Math.round((og.approvedCount / og.totalCount) * 100) : 0;
                          const isComplete = og.totalCount > 0 && og.approvedCount >= og.totalCount;
                          return (
                            <div key={og.groupName} className="space-y-1 pt-1 border-t border-slate-200/60">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-700 truncate">{og.groupName}</span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {og.approvedCount}/{og.totalCount} ({percent}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isComplete ? 'bg-emerald-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Applications Summary List */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5">
                        <FileText size={15} className="text-blue-600" />
                        <span>Hồ sơ tham gia phong trào</span>
                        <span className="text-xs font-normal text-slate-400">({applications.length})</span>
                      </div>
                    </div>

                    {applications.length === 0 ? (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                        Sinh viên chưa có đơn đăng ký tham gia phong trào SV5T nào.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {applications.map((app) => (
                          <div
                            key={app.id}
                            className="p-3 bg-white border border-slate-200 hover:border-blue-200 rounded-xl flex items-center justify-between gap-3 transition-colors shadow-2xs"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="font-semibold text-slate-800 text-[13px] truncate">
                                {app.campaignName}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                <span>
                                  Năm học: <b className="text-slate-700 font-medium">{app.schoolYear}</b>
                                </span>
                                <span>•</span>
                                <span>
                                  Minh chứng: <b className="text-slate-700 font-medium">{app.evidenceCount}</b> tệp
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <SubmissionStatusBadge status={app.status} />
                              <button
                                type="button"
                                onClick={() => setSelectedAppId(app.id)}
                                className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>Chi tiết & Duyệt</span>
                                <ChevronRight size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (studentId) {
                navigate(`/admin/students/${studentId}`);
              }
            }}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-[#1683ff] text-white hover:bg-[#0866db] active:scale-[0.98] shadow-xs hover:shadow-sm font-inter font-normal text-[13px] whitespace-nowrap transition-all cursor-pointer"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
          >
            <ExternalLink size={14} className="shrink-0" />
            <span>Mở trang quản trị đầy đủ</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] font-inter font-normal text-[13px] whitespace-nowrap transition-colors cursor-pointer"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Application Detail & Review Modal */}
      <ApplicationDetailModal
        isOpen={Boolean(selectedAppId)}
        applicationId={selectedAppId}
        onClose={() => setSelectedAppId(null)}
        onSuccessDecision={() => {
          void refetch();
        }}
      />
    </div>
  );
}
