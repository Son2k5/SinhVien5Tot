import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Loader2,
  MessageSquare,
  RotateCcw,
  X,
} from 'lucide-react';
import { STANDARD_GROUPS, type AdminEvidenceItem, type EvidenceAttachment } from '../../types/application.types';
import { DETAIL_EVIDENCE_STATUS_CONFIG, formatTimeAgo, parseData } from './detail.types';

interface ApplicationDetailCriteriaTabProps {
  evidences: AdminEvidenceItem[];
  filteredEvidences: AdminEvidenceItem[];
  selectedGroupFilter: string;
  onSelectGroupFilter: (group: string) => void;
  expandedIds: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  onToggleAll: () => void;
  allExpanded: boolean;
  evLoading: boolean;
  evError: boolean;
  errorMessage?: string;
  onRefetchEvs: () => void;
  toastBanner: { type: 'success' | 'error'; message: string } | null;
  onClearToastBanner: () => void;
  isReviewPending: boolean;
  onOpenViewer: (evidence: AdminEvidenceItem, attachmentIndex?: number) => void;
  onDirectApprove: (evidence: AdminEvidenceItem) => void;
  onDirectRevert: (evidence: AdminEvidenceItem) => void;
  onOpenQuickReview: (evidence: AdminEvidenceItem) => void;
}

export const ApplicationDetailCriteriaTab: React.FC<ApplicationDetailCriteriaTabProps> = ({
  evidences,
  filteredEvidences,
  selectedGroupFilter,
  onSelectGroupFilter,
  expandedIds,
  onToggleExpand,
  onToggleAll,
  allExpanded,
  evLoading,
  evError,
  errorMessage,
  onRefetchEvs,
  toastBanner,
  onClearToastBanner,
  isReviewPending,
  onOpenViewer,
  onDirectApprove,
  onDirectRevert,
  onOpenQuickReview,
}) => {
  return (
    <div className="flex-1 lg:w-7/12 xl:w-8/12 p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-3.5 bg-slate-50/20">
      {/* Inline Toast Banner */}
      {toastBanner && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-150 ${
            toastBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastBanner.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{toastBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={onClearToastBanner}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter by Group Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-slate-500 font-semibold shrink-0">Lọc nhóm:</span>
        <button
          type="button"
          onClick={() => onSelectGroupFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
            selectedGroupFilter === 'all'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Tất cả ({evidences.length})
        </button>
        {Object.entries(STANDARD_GROUPS).map(([key, item]) => {
          const count = evidences.filter((e) => e.groupCode?.toLowerCase() === key.toLowerCase()).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectGroupFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                selectedGroupFilter.toLowerCase() === key.toLowerCase()
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {item.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Subheader: List Control Bar */}
      <div className="px-4 py-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
        <span className="font-semibold text-slate-700">
          Danh sách tiêu chí ({filteredEvidences.length})
        </span>
        {filteredEvidences.length > 1 && (
          <button
            type="button"
            onClick={onToggleAll}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition cursor-pointer hover:underline"
          >
            {allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
          </button>
        )}
      </div>

      {/* Criteria & Evidence Evaluation List */}
      {evLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 size={24} className="text-blue-600 animate-spin" />
        </div>
      ) : evError ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-rose-200 text-rose-700">
          <AlertCircle size={32} className="mx-auto mb-2" />
          <p className="text-xs">{errorMessage || 'Không thể tải danh sách minh chứng.'}</p>
          <button
            type="button"
            onClick={onRefetchEvs}
            className="mt-3 text-xs font-semibold underline cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : filteredEvidences.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-xs">Chưa có minh chứng nào được nộp cho nhóm này.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvidences.map((ev) => {
            const parsed = parseData(ev.dataJson);
            const groupKey = ev.groupCode || 'Ethics';
            const std = STANDARD_GROUPS[groupKey] || STANDARD_GROUPS.Ethics;
            const StdIcon = std.icon;
            const statusCfg =
              DETAIL_EVIDENCE_STATUS_CONFIG[ev.status] || DETAIL_EVIDENCE_STATUS_CONFIG.Submitted;
            const isExpanded = Boolean(expandedIds[ev.id]);
            const isApproved = ev.status === 'Approved';

            let attachments: EvidenceAttachment[] = [];
            try {
              if (ev.attachmentsJson) {
                const p = JSON.parse(ev.attachmentsJson);
                attachments = Array.isArray(p) ? p : [p];
              }
            } catch {
              attachments = [];
            }

            return (
              <div
                key={ev.id}
                className={`rounded-xl bg-white border transition-all shadow-2xs ${
                  isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Main Row */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onToggleExpand(ev.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleExpand(ev.id);
                    }
                  }}
                  className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/80 transition-colors rounded-xl"
                >
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1 min-w-0 pr-0 md:pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md ${std.bg} ${std.color} border ${std.border}`}
                      >
                        <StdIcon size={13} />
                        <span>{std.label}</span>
                      </span>

                      <span
                        className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>

                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatTimeAgo(ev.createdAt)}</span>
                      </span>
                    </div>

                    {/* Criterion Title */}
                    <p
                      className="text-sm font-semibold text-slate-800 truncate leading-snug"
                      title={ev.criterionTitle}
                    >
                      {ev.criterionTitle}
                    </p>
                  </div>

                  {/* Right: "Chi tiết" toggle button */}
                  <div className="shrink-0 flex items-center pt-1 md:pt-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand(ev.id);
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
                        className={`transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-blue-600' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Collapsible Dropbar Panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-3.5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl space-y-3 animate-in fade-in duration-150">
                    {/* Self declared text */}
                    <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-2xs">
                      <span className="font-semibold text-slate-900 block mb-1">
                        Nội dung tự kê khai:
                      </span>
                      <p className="whitespace-pre-wrap text-slate-800">
                        {parsed.description || (
                          <span className="text-slate-400 italic">
                            Sinh viên không nhập nội dung tự kê khai.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Score / numeric value */}
                    {ev.numericValue != null && (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <span>Điểm / Số liệu tự khai:</span>
                        <strong className="text-slate-800 font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {ev.numericValue}
                        </strong>
                      </div>
                    )}

                    {/* Drive Link */}
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

                    {/* Attachments */}
                    {attachments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Tệp đính kèm ({attachments.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {attachments.map((att, attIdx) => {
                            const url = att.url || att.fileUrl || att.secure_url || '';
                            const name = att.fileName || att.name || `Tệp ${attIdx + 1}`;
                            const isPdf = /\.pdf($|\?)/i.test(name) || /\.pdf($|\?)/i.test(url);
                            return (
                              <div
                                key={attIdx}
                                onClick={() => onOpenViewer(ev, attIdx)}
                                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                                title={`Xem tệp ${name}`}
                              >
                                {isPdf ? (
                                  <FileText size={16} className="text-rose-500 shrink-0" />
                                ) : (
                                  <FileCheck size={16} className="text-blue-500 shrink-0" />
                                )}
                                <span className="text-xs text-slate-700 group-hover:text-blue-700 font-medium max-w-[200px] truncate">
                                  {name}
                                </span>
                                <Eye
                                  size={12}
                                  className="text-blue-500 opacity-60 group-hover:opacity-100"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Reviewer Note */}
                    {ev.reviewerNote && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 shadow-2xs">
                        <span className="font-semibold block mb-0.5">Lời nhắc / Lý do phản hồi:</span>
                        <p className="whitespace-pre-wrap">{ev.reviewerNote}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 flex-wrap">
                      {/* 1. View button */}
                      <button
                        type="button"
                        onClick={() => onOpenViewer(ev, 0)}
                        className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                        title="Xem tệp minh chứng đính kèm"
                      >
                        <Eye size={13} className="text-slate-500" />
                        <span>Xem tệp</span>
                      </button>

                      {/* 2. Approve button / badge */}
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
                          disabled={isReviewPending}
                          className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
                          title={
                            ev.status === 'Rejected'
                              ? 'Xem xét lại và duyệt đạt tiêu chí này'
                              : 'Duyệt đạt tiêu chí này'
                          }
                        >
                          <CheckCircle2 size={13} />
                          <span>Duyệt Đạt</span>
                        </button>
                      )}

                      {/* 3. Revert button */}
                      {(ev.status === 'Approved' ||
                        ev.status === 'Rejected' ||
                        ev.status === 'NeedsRevision') && (
                        <button
                          type="button"
                          onClick={() => onDirectRevert(ev)}
                          disabled={isReviewPending}
                          className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
                          title="Hoàn lại kết quả về trạng thái chờ thẩm định ban đầu"
                        >
                          <RotateCcw size={13} />
                          <span>Hoàn lại</span>
                        </button>
                      )}

                      {/* 4. Feedback / Quick review button */}
                      <button
                        type="button"
                        onClick={() => onOpenQuickReview(ev)}
                        className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-[#1683ff] hover:bg-[#0866db] text-white transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                        title="Gửi phản hồi hoặc thay đổi kết quả đánh giá"
                      >
                        <MessageSquare size={13} />
                        <span>Đánh giá / Phản hồi</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
