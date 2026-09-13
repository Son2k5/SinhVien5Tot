import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentDetail } from '../../../hooks/admin/useStudents';
import type { AdminStudentListItem } from '../../../types/admin/student';
import {
  ActiveBadge,
  SubmissionStatusBadge,
  VerifiedBadge,
} from './StudentBadges';
import { Award, X, ClipboardCheck, ExternalLink, AlertCircle, RefreshCw, GraduationCap, User, MapPin } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'info' | 'apps' | 'evidence'>('info');

  const { data, isPending, isError, refetch } = useStudentDetail(
    isOpen && studentId ? studentId : undefined
  );

  if (!isOpen) return null;

  const profile = data?.profile;
  const fullName = profile?.fullName || fallbackItem?.fullName || data?.displayName || 'Sinh viên';
  const email = data?.email || fallbackItem?.email || '—';
  const studentCode = profile?.studentCode || fallbackItem?.studentCode || '—';
  const isVerified = data ? data.isVerified : Boolean(fallbackItem?.isVerified);
  const isActive = data ? data.isActive : Boolean(fallbackItem?.isActive);

  const avatarUrl = data?.avatarUrl ?? null;
  const initial = (fullName.trim().charAt(0) || 'S').toUpperCase();
  const applications = data?.applications ?? [];
  const evidenceGroups = data?.evidenceGroups ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết sinh viên"
    >
      <div
        className="w-full max-w-[860px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4">
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
                <span className="flex items-center gap-1.5 shrink-0">
                  <VerifiedBadge verified={isVerified} />
                  <ActiveBadge active={isActive} />
                </span>
              </div>
              <p className="mt-0.5 text-[13px] font-normal text-slate-500 truncate">{email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors shrink-0 ml-2"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
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
            onClick={() => setActiveTab('apps')}
            className={`pb-2.5 -mb-px text-[13px] cursor-pointer transition-colors border-b-2 ${
              activeTab === 'apps'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
            }`}
          >
            Hồ sơ
            {applications.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center">
                {applications.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`pb-2.5 -mb-px text-[13px] cursor-pointer transition-colors border-b-2 ${
              activeTab === 'evidence'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
            }`}
          >
            Minh chứng
            {evidenceGroups.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center">
                {evidenceGroups.reduce((acc, g) => acc + g.totalCount, 0)}
              </span>
            )}
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
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 space-y-3">
                <div className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-blue-600" /> Nơi học tập
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Mã sinh viên:</span>
                    <span className="font-semibold font-mono text-slate-800 text-right">{studentCode}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 sm:col-span-2">
                    <span className="text-slate-500">Trường:</span>
                    <span className="font-medium text-slate-700 text-right">{profile?.school || fallbackItem?.school || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Khoa / Viện:</span>
                    <span className="font-medium text-slate-700 text-right">{profile?.faculty || fallbackItem?.faculty || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Chuyên ngành:</span>
                    <span className="font-medium text-slate-700 text-right">{profile?.major || fallbackItem?.major || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Lớp hành chính:</span>
                    <span className="font-medium text-slate-700 text-right">{profile?.administrativeClass || fallbackItem?.administrativeClass || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Khóa tuyển sinh:</span>
                    <span className="font-medium text-slate-700 text-right">
                      {profile?.academicYear ? `K${profile.academicYear}` : fallbackItem?.academicYear ? `K${fallbackItem.academicYear}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Email liên hệ:</span>
                    <span className="font-normal text-slate-700 text-right break-all">{profile?.contactEmail || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Chức vụ Đoàn/Hội:</span>
                    <span className="font-medium text-slate-700 text-right">{profile?.unionPosition || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Nhóm cá nhân & liên hệ */}
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 space-y-3">
                <div className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5">
                  <User size={15} className="text-violet-600" /> Cá nhân & liên hệ
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Ngày sinh:</span>
                    <span className="font-medium text-slate-700 text-right">{fmtDate(profile?.birthDate)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Giới tính:</span>
                    <span className="font-medium text-slate-700 text-right">
                      {profile?.gender ? GENDER_LABELS[profile.gender] ?? profile.gender : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Số điện thoại:</span>
                    <span className="font-medium text-slate-700 text-right">{profile?.phoneNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">CCCD / CMND:</span>
                    <span className="font-medium text-slate-700 text-right">{profile?.identityCardNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Dân tộc:</span>
                    <span className="font-medium text-slate-700 text-right">{profile?.ethnicity || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Đoàn / Đảng:</span>
                    <span className="font-medium text-slate-700 text-right">
                      {profile?.politicalStatus ? POLITICAL_LABELS[profile.politicalStatus] ?? profile.politicalStatus : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 sm:col-span-2">
                    <span className="text-slate-500">Chức vụ hiện tại:</span>
                    <span className="font-medium text-slate-700 text-right">{profile?.currentPosition || 'Sinh viên'}</span>
                  </div>
                </div>
              </div>

              {/* Nơi cư trú */}
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 space-y-3">
                <div className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5">
                  <MapPin size={15} className="text-emerald-600" /> Nơi cư trú
                </div>
                {(() => {
                  const addresses = profile?.addresses ?? [];
                  const perm = addresses.find((a) => a.addressType === 'Permanent');
                  const temp = addresses.find((a) => a.addressType === 'Temporary');
                  if (addresses.length === 0) {
                    return <div className="text-slate-400 text-[12px] py-2 text-center">Chưa cập nhật địa chỉ thường trú / tạm trú.</div>;
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {perm && (
                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Thường trú</div>
                          <div className="text-[12px] font-medium text-slate-700 leading-relaxed">{fmtAddress(perm)}</div>
                        </div>
                      )}
                      {temp && (
                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Tạm trú</div>
                          <div className="text-[12px] font-medium text-slate-700 leading-relaxed">{fmtAddress(temp)}</div>
                        </div>
                      )}
                      {addresses.filter((a) => a.addressType !== 'Permanent' && a.addressType !== 'Temporary').map((a) => (
                        <div key={a.addressType} className="bg-white border border-slate-200 rounded-lg p-3">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                            {ADDRESS_TYPE_LABELS[a.addressType] ?? a.addressType}
                          </div>
                          <div className="text-[12px] font-medium text-slate-700 leading-relaxed">{fmtAddress(a)}</div>
                        </div>
                      ))}
                      {!perm && !temp && addresses.length > 0 && (
                        <div className="text-slate-400 text-[12px]">Đã có địa chỉ khác, xem chi tiết ở trên.</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Data Tab 2: Hồ sơ đăng ký */}
          {!isPending && !isError && activeTab === 'apps' && (
            <div className="space-y-3">
              {applications.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <Award size={32} className="mx-auto mb-2 opacity-50" />
                  <div>Sinh viên chưa có hồ sơ đăng ký danh hiệu SV5T nào.</div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {applications.map((app) => (
                    <div key={app.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                      <div className="space-y-1 min-w-0">
                        <div className="font-normal text-slate-800 truncate">{app.campaignName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-mono">{app.applicationCode}</span>
                          <span>•</span>
                          <span>Năm học {app.schoolYear}</span>
                          <span>•</span>
                          <span>{app.evidenceCount} minh chứng</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <SubmissionStatusBadge status={app.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Data Tab 3: Minh chứng */}
          {!isPending && !isError && activeTab === 'evidence' && (
            <div className="space-y-3">
              {evidenceGroups.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <ClipboardCheck size={32} className="mx-auto mb-2 opacity-50" />
                  <div>Chưa có minh chứng.</div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {evidenceGroups.map((g) => {
                    const percent = g.totalCount > 0 ? Math.round((g.approvedCount / g.totalCount) * 100) : 0;
                    return (
                      <div key={g.groupName} className="p-3.5 border border-slate-200 rounded-xl bg-white space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                          <span>{g.groupName}</span>
                          <span className="text-slate-500 font-mono">
                            {g.approvedCount} / {g.totalCount} đã duyệt ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-[width] duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
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
    </div>
  );
}
