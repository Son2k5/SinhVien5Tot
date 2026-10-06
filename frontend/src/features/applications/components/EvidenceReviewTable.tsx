import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import type { ReviewTab } from '../hooks/useEvidenceReviewWorkspace';
import type { StudentEvidenceGroup } from '../types/application.types';
import { STANDARD_GROUPS, STATUS_CONFIG } from '../types/application.types';

export type EvidenceColKey =
  | 'check'
  | 'stt'
  | 'student'
  | 'studentCode'
  | 'email'
  | 'class'
  | 'faculty'
  | 'campaign'
  | 'standards'
  | 'evidenceCount'
  | 'submittedAt'
  | 'overdue'
  | 'actions';

const DEFAULT_COL_WIDTHS: Record<EvidenceColKey, number> = {
  check: 44,
  stt: 52,
  student: 200,
  studentCode: 110,
  email: 220,
  class: 110,
  faculty: 180,
  campaign: 240,
  standards: 240,
  evidenceCount: 110,
  submittedAt: 115,
  overdue: 125,
  actions: 90,
};

const MIN_COL_WIDTHS: Record<EvidenceColKey, number> = {
  check: 40,
  stt: 44,
  student: 130,
  studentCode: 85,
  email: 140,
  class: 80,
  faculty: 110,
  campaign: 140,
  standards: 150,
  evidenceCount: 85,
  submittedAt: 90,
  overdue: 95,
  actions: 75,
};

const COL_STORAGE_KEY = 'sv5t-evidence-table-colwidths-v3';

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

interface EvidenceReviewTableProps {
  activeTab: ReviewTab;
  pagedStudentGroups: StudentEvidenceGroup[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  selected: Set<string>;
  toggleSelectAll: (checked: boolean) => void;
  toggleSelectOne: (key: string) => void;
  pageIndex: number;
  pageSize: number;
  onSelectGroup: (group: StudentEvidenceGroup) => void;
}

export const EvidenceReviewTable: React.FC<EvidenceReviewTableProps> = ({
  activeTab,
  pagedStudentGroups,
  isLoading,
  isError,
  refetch,
  selected,
  toggleSelectAll,
  toggleSelectOne,
  pageIndex,
  pageSize,
  onSelectGroup,
}) => {
  const [colWidths, setColWidths] = useState<Record<EvidenceColKey, number>>(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<EvidenceColKey, number>>;
        return { ...DEFAULT_COL_WIDTHS, ...parsed };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_COL_WIDTHS;
  });

  const resizingRef = useRef<{ key: EvidenceColKey; startX: number; startW: number } | null>(null);
  const colWidthsRef = useRef(colWidths);
  colWidthsRef.current = colWidths;

  useEffect(() => {
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(colWidths));
    } catch {
      /* ignore */
    }
  }, [colWidths]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, key: EvidenceColKey) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = colWidthsRef.current[key];
      resizingRef.current = { key, startX, startW };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMove = (ev: MouseEvent) => {
        const cur = resizingRef.current;
        if (!cur) return;
        const delta = ev.clientX - cur.startX;
        const next = Math.max(MIN_COL_WIDTHS[cur.key], cur.startW + delta);
        setColWidths((prev) => (prev[cur.key] === next ? prev : { ...prev, [cur.key]: next }));
      };

      const onUp = () => {
        resizingRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    []
  );

  const ResizeHandle = ({ colKey }: { colKey: EvidenceColKey }) => (
    <span
      onMouseDown={(e) => onResizeStart(e, colKey)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setColWidths((prev) => ({ ...prev, [colKey]: DEFAULT_COL_WIDTHS[colKey] }));
      }}
      title="Kéo để đổi độ rộng (nhấp đúp để đặt lại)"
      className="absolute top-0 right-0 bottom-0 w-2.5 cursor-col-resize group flex items-center justify-center select-none z-10"
    >
      <span className="w-0.5 h-4 bg-slate-300 group-hover:bg-blue-500 transition-colors" />
    </span>
  );

  const totalTableWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);
  const startIndex = (pageIndex - 1) * pageSize;
  const allChecked =
    pagedStudentGroups.length > 0 &&
    pagedStudentGroups.every((g) => selected.has(g.key));
  const isIndeterminate =
    pagedStudentGroups.some((g) => selected.has(g.key)) && !allChecked;

  const currentStatusConf = STATUS_CONFIG[activeTab] || STATUS_CONFIG.Submitted;

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table
        className="tbl-div border-collapse text-xs table-fixed"
        style={{ width: `${totalTableWidth}px` }}
      >
        <colgroup>
          {(Object.keys(DEFAULT_COL_WIDTHS) as EvidenceColKey[]).map((k) => (
            <col key={k} style={{ width: `${colWidths[k]}px` }} />
          ))}
        </colgroup>

        {/* Table Header: neutral gray (#ECEDEF) với vạch | kéo thả */}
        <thead>
          <tr className="bg-[#ECEDEF] border-y border-[#D9DCE1] text-black select-none">
            {/* 1. Nút tick ở đầu */}
            <th
              className="relative px-3 py-3.5 text-center select-none"
              style={{ width: `${colWidths.check}px` }}
            >
              <input
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                type="checkbox"
                checked={allChecked}
                onChange={(e) => toggleSelectAll(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                aria-label="Chọn tất cả sinh viên"
              />
              <ResizeHandle colKey="check" />
            </th>

            {/* 2. STT */}
            <th
              className="relative px-2 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
              style={{ width: `${colWidths.stt}px` }}
            >
              <span className="block truncate">STT</span>
              <ResizeHandle colKey="stt" />
            </th>

            {/* 3. Sinh viên */}
            <th
              className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
              style={{ width: `${colWidths.student}px` }}
            >
              <span className="block truncate">Sinh viên</span>
              <ResizeHandle colKey="student" />
            </th>

            {/* 4. Mã SV */}
            <th
              className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
              style={{ width: `${colWidths.studentCode}px` }}
            >
              <span className="block truncate">Mã SV</span>
              <ResizeHandle colKey="studentCode" />
            </th>

            {/* 5. Email */}
            <th
              className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
              style={{ width: `${colWidths.email}px` }}
            >
              <span className="block truncate">Email</span>
              <ResizeHandle colKey="email" />
            </th>

            {/* 6. Lớp */}
            <th
              className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
              style={{ width: `${colWidths.class}px` }}
            >
              <span className="block truncate">Lớp</span>
              <ResizeHandle colKey="class" />
            </th>

            {/* 7. Khoa */}
            <th
              className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
              style={{ width: `${colWidths.faculty}px` }}
            >
              <span className="block truncate">Khoa</span>
              <ResizeHandle colKey="faculty" />
            </th>

            {/* 8. Chiến dịch */}
            <th
              className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
              style={{ width: `${colWidths.campaign}px` }}
            >
              <span className="block truncate">Chiến dịch</span>
              <ResizeHandle colKey="campaign" />
            </th>

            {/* 9. Tiêu chuẩn */}
            <th
              className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
              style={{ width: `${colWidths.standards}px` }}
            >
              <span className="block truncate">Tiêu chuẩn</span>
              <ResizeHandle colKey="standards" />
            </th>

            {/* 10. Minh chứng */}
            <th
              className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
              style={{ width: `${colWidths.evidenceCount}px` }}
            >
              <span className="block truncate">Minh chứng</span>
              <ResizeHandle colKey="evidenceCount" />
            </th>

            {/* 11. Thời gian */}
            <th
              className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
              style={{ width: `${colWidths.submittedAt}px` }}
            >
              <span className="block truncate">Thời gian</span>
              <ResizeHandle colKey="submittedAt" />
            </th>

            {/* 12. Quá hạn */}
            <th
              className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
              style={{ width: `${colWidths.overdue}px` }}
            >
              <span className="block truncate">Quá hạn</span>
              <ResizeHandle colKey="overdue" />
            </th>

            {/* 13. Thao tác */}
            <th
              className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
              style={{ width: `${colWidths.actions}px` }}
            >
              <span className="block truncate">Thao tác</span>
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-[#eef2f6]">
          {isLoading ? (
            <tr>
              <td colSpan={13} className="py-12 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải danh sách minh chứng...</span>
                </div>
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td colSpan={13} className="py-12 text-center text-rose-600">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <span className="text-xs font-bold block">Không thể tải dữ liệu minh chứng</span>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs cursor-pointer hover:bg-blue-700"
                >
                  Thử lại
                </button>
              </td>
            </tr>
          ) : pagedStudentGroups.length === 0 ? (
            <tr>
              <td colSpan={13} className="py-16 text-center text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 size={24} className="text-slate-400" />
                </div>
                <span className="text-xs font-semibold text-slate-700 block">
                  Không có sinh viên nào trong trạng thái "{currentStatusConf.label}"
                </span>
                <span className="text-[11px] text-slate-400">
                  Tất cả minh chứng đã được xử lý hoặc không có bản ghi phù hợp bộ lọc.
                </span>
              </td>
            </tr>
          ) : (
            pagedStudentGroups.map((group, idx) => {
              const snap = group.snapshot;
              const rowNumber = startIndex + idx + 1;
              const isChecked = selected.has(group.key);

              return (
                <tr
                  key={group.key}
                  onClick={() => onSelectGroup(group)}
                  className={`transition-colors cursor-pointer select-none border-b border-[#eef2f6] ${
                    isChecked ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-[#f3f8ff]'
                  }`}
                >
                  {/* 1. Nút tick */}
                  <td
                    className="py-3 px-3 text-center align-middle cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectOne(group.key);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectOne(group.key)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                      aria-label={`Chọn sinh viên ${snap.fullName || ''}`}
                    />
                  </td>

                  {/* 2. STT */}
                  <td className="py-3 px-2 text-center font-mono text-[11px] text-slate-500 align-middle">
                    {rowNumber}
                  </td>

                  {/* 3. Sinh viên */}
                  <td className="py-3 px-3 align-middle overflow-hidden">
                    <div
                      className="font-medium text-slate-900 text-xs truncate"
                      title={snap.fullName || 'Sinh viên'}
                    >
                      {snap.fullName || '—'}
                    </div>
                  </td>

                  {/* 4. Mã SV */}
                  <td className="py-3 px-3 align-middle overflow-hidden">
                    <span
                      className="font-mono text-xs text-slate-700 block truncate"
                      title={snap.studentCode || ''}
                    >
                      {snap.studentCode || '—'}
                    </span>
                  </td>

                  {/* 5. Email */}
                  <td className="py-3 px-3 align-middle overflow-hidden text-slate-700">
                    <div className="text-xs text-slate-800 truncate" title={snap.email || ''}>
                      {snap.email || '—'}
                    </div>
                  </td>

                  {/* 6. Lớp */}
                  <td className="py-3 px-3 align-middle overflow-hidden text-slate-700">
                    <div
                      className="text-xs text-slate-700 truncate"
                      title={snap.administrativeClass || ''}
                    >
                      {snap.administrativeClass || '—'}
                    </div>
                  </td>

                  {/* 7. Khoa */}
                  <td className="py-3 px-3 align-middle overflow-hidden text-slate-700">
                    <div className="text-xs text-slate-700 truncate" title={snap.faculty || ''}>
                      {snap.faculty || '—'}
                    </div>
                  </td>

                  {/* 8. Chiến dịch */}
                  <td className="py-3 px-3 align-middle text-slate-700 overflow-hidden">
                    <div
                      className="truncate font-medium text-xs text-slate-800"
                      title={group.campaignName}
                    >
                      {group.campaignName || '—'}
                    </div>
                  </td>

                  {/* 9. Tiêu chuẩn */}
                  <td className="py-3 px-3 align-middle overflow-hidden">
                    <div className="flex items-center gap-x-2.5 gap-y-1 flex-wrap">
                      {group.standardGroups.map((grp) => {
                        const std = STANDARD_GROUPS[grp] || STANDARD_GROUPS.Ethics;
                        const Icon = std.icon;
                        return (
                          <span
                            key={grp}
                            title={std.label}
                            className={`inline-flex items-center gap-1 text-[11px] font-medium ${std.color}`}
                          >
                            <Icon size={12} className="shrink-0" />
                            <span>{std.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  {/* 10. Minh chứng */}
                  <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                    <span className="text-xs font-medium text-slate-700">
                      {group.totalEvidences} minh chứng
                    </span>
                  </td>

                  {/* 11. Thời gian nộp */}
                  <td className="py-3 px-3 text-center align-middle whitespace-nowrap text-slate-600 text-xs">
                    {formatTimeAgo(group.latestSubmissionAt)}
                  </td>

                  {/* 12. Quá hạn */}
                  <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                    {activeTab === 'Submitted' ? (
                      group.isOver7Days ? (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                          Quá hạn {group.maxDaysWaiting} ngày
                        </span>
                      ) : group.isOver3Days ? (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                          Chờ {group.maxDaysWaiting} ngày
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                          Đúng hạn
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>

                  {/* 13. Thao tác */}
                  <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGroup(group);
                      }}
                      className="h-7.5 px-3.5 rounded-full text-xs font-medium bg-[#e8f3ff] text-[#0866db] hover:bg-[#1683ff] hover:text-white hover:border-[#1683ff] border border-[#cbe1fc] shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-[0.96]"
                      title="Xem chi tiết minh chứng trong popup"
                    >
                      <Eye size={13} strokeWidth={1.8} />
                      <span>Xem</span>
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
