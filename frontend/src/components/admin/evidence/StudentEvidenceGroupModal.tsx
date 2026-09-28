import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  HeartHandshake,
  MessageSquare,
  RotateCcw,
  Scale,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import type { AdminEvidenceItem, ApplicantSnapshot } from '../../../types/admin/application';

export interface StudentEvidenceGroup {
  key: string;
  applicationId: string;
  applicationCode: string;
  campaignId: string;
  campaignName: string;
  snapshot: ApplicantSnapshot;
  evidences: AdminEvidenceItem[];
  totalEvidences: number;
  maxDaysWaiting: number;
  isOver7Days: boolean;
  isOver3Days: boolean;
  standardGroups: string[];
  latestSubmissionAt: string;
}

interface StudentEvidenceGroupModalProps {
  isOpen: boolean;
  group: StudentEvidenceGroup | null;
  onClose: () => void;
  onOpenViewer: (item: AdminEvidenceItem, attIndex?: number) => void;
  onDirectApprove: (item: AdminEvidenceItem) => void;
  onDirectRevert?: (item: AdminEvidenceItem) => void;
  onOpenReview: (item: AdminEvidenceItem) => void;
  onOpenFullApp: (applicationId: string) => void;
  isApproving?: boolean;
}

const STANDARD_GROUPS: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; border: string }
> = {
  Ethics: { label: 'Đạo đức tốt', icon: ShieldCheck, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Study: { label: 'Học tập tốt', icon: BookOpen, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Fitness: { label: 'Thể lực tốt', icon: Zap, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Volunteer: { label: 'Tình nguyện tốt', icon: HeartHandshake, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  Integration: { label: 'Hội nhập tốt', icon: Scale, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  Approved: { label: 'Đã duyệt', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Rejected: { label: 'Từ chối', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  NeedsRevision: { label: 'Cần sửa đổi', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Submitted: { label: 'Chờ thẩm định', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Draft: { label: 'Bản nháp', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
};

function parseData(jsonStr?: string): { description: string; driveLink: string } {
  if (!jsonStr) return { description: '', driveLink: '' };
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      description: parsed.description || parsed.notes || '',
      driveLink: parsed.driveLink || parsed.link || parsed.url || '',
    };
  } catch {
    return { description: jsonStr, driveLink: '' };
  }
}

function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export const StudentEvidenceGroupModal: React.FC<StudentEvidenceGroupModalProps> = ({
  isOpen,
  group,
  onClose,
  onOpenViewer,
  onDirectApprove,
  onDirectRevert,
  onOpenReview,
  onOpenFullApp,
  isApproving = false,
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedIds({});
  }, [group?.key]);

  if (!isOpen || !group) return null;

  const snap = group.snapshot;
  const evidences = group.evidences;
  const allExpanded = evidences.length > 0 && evidences.every((ev) => expandedIds[ev.id]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAll = () => {
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const next: Record<string, boolean> = {};
      evidences.forEach((ev) => {
        next[ev.id] = true;
      });
      setExpandedIds(next);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 antialiased font-inter font-['Inter',_sans-serif]"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết minh chứng của ${snap.fullName || 'sinh viên'}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[92vh] max-h-[95vh] bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 font-inter font-['Inter',_sans-serif]"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Student Circular Avatar */}
            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 ring-2 ring-blue-500/20 shadow-xs bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {snap.avatarUrl ? (
                <img
                  src={snap.avatarUrl}
                  alt={snap.fullName || 'Sinh viên'}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span>{(snap.fullName?.charAt(0) || 'S').toUpperCase()}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap font-inter">
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {snap.fullName || 'Sinh viên'}
                </h3>
                {snap.studentCode && (
                  <span className="text-sm font-semibold text-slate-600">
                    MSSV: {snap.studentCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1 flex-wrap">
                {snap.administrativeClass && <span>Lớp: <strong className="text-slate-700 font-medium">{snap.administrativeClass}</strong></span>}
                {snap.faculty && <span>• Khoa: <strong className="text-slate-700 font-medium">{snap.faculty}</strong></span>}
                <span>• Chiến dịch: <strong className="text-slate-700 font-medium">{group.campaignName}</strong></span>
                <span>• <strong className="text-blue-600 font-semibold">{evidences.length}</strong> minh chứng</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenFullApp(group.applicationId)}
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <span>Xem toàn bộ hồ sơ</span>
              <ExternalLink size={13} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Small bar for mobile button */}
        <div className="sm:hidden px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => onOpenFullApp(group.applicationId)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-blue-700 border border-blue-200 text-xs font-medium shadow-2xs"
          >
            <span>Xem toàn bộ hồ sơ</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {/* Subheader: List Control Bar */}
        <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span className="font-semibold text-slate-700">
            Danh sách tiêu chí ({evidences.length})
          </span>
          {evidences.length > 1 && (
            <button
              type="button"
              onClick={handleToggleAll}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 transition cursor-pointer hover:underline"
            >
              {allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
            </button>
          )}
        </div>

        {/* Body: Scrollable list of criteria rows */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 custom-scrollbar flex-1 bg-slate-50/40">
          {evidences.map((ev) => {
            const parsed = parseData(ev.dataJson);
            const groupKey = ev.groupCode || 'Ethics';
            const std = STANDARD_GROUPS[groupKey] || STANDARD_GROUPS.Ethics;
            const StdIcon = std.icon;
            const statusCfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG.Submitted;
            const isExpanded = Boolean(expandedIds[ev.id]);
            const isApproved = ev.status === 'Approved';

            return (
              <div
                key={ev.id}
                className={`rounded-xl bg-white border transition-all shadow-2xs ${
                  isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Main Row: Bấm vào thanh này cũng mở/đóng dropbar */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(ev.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(ev.id);
                    }
                  }}
                  className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/80 transition-colors rounded-xl"
                >
                  {/* Left: Info (Tags + 1-line Criterion Title) */}
                  <div className="space-y-1.5 flex-1 min-w-0 pr-0 md:pr-3">
                    {/* Header tags: Nhóm tiêu chuẩn (ĐÃ BỎ mã tiêu chuẩn TC_DAODUC.1), Trạng thái, Thời gian */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md ${std.bg} ${std.color} border ${std.border}`}>
                        <StdIcon size={13} />
                        <span>{std.label}</span>
                      </span>

                      <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                        {statusCfg.label}
                      </span>

                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatTimeAgo(ev.createdAt)}</span>
                      </span>
                    </div>

                    {/* Criterion Title: 1 dòng duy nhất, nếu dài quá thì hiện ... */}
                    <p
                      className="text-sm font-semibold text-slate-800 truncate leading-snug"
                      title={ev.criterionTitle}
                    >
                      {ev.criterionTitle}
                    </p>
                  </div>

                  {/* Right: Only "Chi tiết" toggle button on main row */}
                  <div className="shrink-0 flex items-center pt-1 md:pt-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(ev.id);
                      }}
                      className={`h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs active:scale-[0.98] ${
                        isExpanded
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                      title={isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                    >
                      <span>Chi tiết</span>
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-600' : 'text-slate-400'}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Collapsible Dropbar Panel: Chỉ hiện khi bấm nút "Chi tiết" */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-3.5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl space-y-3 animate-in fade-in duration-150">
                    {/* Khung nội dung tự kê khai */}
                    <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-2xs">
                      <span className="font-semibold text-slate-900 block mb-1">
                        Nội dung tự kê khai:
                      </span>
                      <p className="whitespace-pre-wrap text-slate-800">
                        {parsed.description || (
                          <span className="text-slate-400 italic">Sinh viên không nhập nội dung tự kê khai.</span>
                        )}
                      </p>
                    </div>

                    {/* Drive Link nếu có */}
                    {parsed.driveLink && (
                      <div>
                        <a
                          href={parsed.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer shadow-2xs"
                        >
                          <ExternalLink size={13} />
                          <span>Mở liên kết Drive / URL minh chứng</span>
                        </a>
                      </div>
                    )}

                    {/* Reviewer Note nếu có */}
                    {ev.reviewerNote && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 shadow-2xs">
                        <span className="font-semibold block mb-0.5">Lời nhắc / Lý do phản hồi:</span>
                        <p className="whitespace-pre-wrap">{ev.reviewerNote}</p>
                      </div>
                    )}

                    {/* Các Nút hành động trong dropbar: Xem tệp, Duyệt Đạt, Hoàn lại, Phản hồi (Căn đều padding đẹp mắt) */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 flex-wrap">
                      {/* 1. Nút Xem tệp */}
                      <button
                        type="button"
                        onClick={() => onOpenViewer(ev, 0)}
                        className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                        title="Xem tệp minh chứng đính kèm"
                      >
                        <Eye size={13} className="text-slate-500" />
                        <span>Xem tệp</span>
                      </button>

                      {/* 2. Nút Duyệt / Duyệt Đạt / Badge Đã duyệt */}
                      {isApproved ? (
                        <span
                          className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 select-none shadow-2xs"
                          title="Tiêu chí này đã được duyệt đạt"
                        >
                          <CheckCircle2 size={13} />
                          <span>Đã duyệt</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onDirectApprove(ev)}
                          disabled={isApproving}
                          className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
                          title={ev.status === 'Rejected' ? 'Xem xét lại và duyệt đạt tiêu chí này' : 'Duyệt đạt tiêu chí này'}
                        >
                          <CheckCircle2 size={13} />
                          <span>Duyệt Đạt</span>
                        </button>
                      )}

                      {/* 3. Nút Hoàn lại: Thu hồi kết quả duyệt hoặc chưa đạt về trạng thái chờ thẩm định */}
                      {onDirectRevert && (ev.status === 'Approved' || ev.status === 'Rejected' || ev.status === 'NeedsRevision') && (
                        <button
                          type="button"
                          onClick={() => onDirectRevert(ev)}
                          disabled={isApproving}
                          className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
                          title="Hoàn lại kết quả về trạng thái chờ thẩm định ban đầu"
                        >
                          <RotateCcw size={13} />
                          <span>Hoàn lại</span>
                        </button>
                      )}

                      {/* 4. Nút Phản hồi: Mở modal đánh giá chi tiết (Đạt, Cần bổ sung, Từ chối) */}
                      <button
                        type="button"
                        onClick={() => onOpenReview(ev)}
                        className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-[#1683ff] hover:bg-[#0866db] text-white transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                        title="Gửi phản hồi hoặc thay đổi kết quả đánh giá"
                      >
                        <MessageSquare size={13} />
                        <span>Phản hồi</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
          <span className="text-xs text-slate-500">
            Tổng cộng: <strong className="text-slate-700">{evidences.length}</strong> minh chứng
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
