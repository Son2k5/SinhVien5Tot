import { useState, useRef, useEffect, useCallback, useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import type { ReviewApplicationItem } from '../types/application.types';
import {
  APPLICATION_STATUS_CONFIG,
  STANDARD_GROUP_ICONS,
  parseApplicantSnapshot,
} from '../types/application.types';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import { AlertCircle, Eye } from 'lucide-react';

export type AppColKey =
  | 'check'
  | 'stt'
  | 'fullname'
  | 'studentcode'
  | 'class'
  | 'faculty'
  | 'campaign'
  | 'standards'
  | 'submittedAt'
  | 'status'
  | 'actions';

const DEFAULT_COL_WIDTHS: Record<AppColKey, number> = {
  check: 44,
  stt: 50,
  fullname: 180,
  studentcode: 110,
  class: 100,
  faculty: 150,
  campaign: 180,
  standards: 160,
  submittedAt: 110,
  status: 110,
  actions: 90,
};

const MIN_COL_WIDTHS: Record<AppColKey, number> = {
  check: 40,
  stt: 44,
  fullname: 120,
  studentcode: 85,
  class: 80,
  faculty: 100,
  campaign: 120,
  standards: 120,
  submittedAt: 90,
  status: 90,
  actions: 70,
};

const COL_STORAGE_KEY = 'sv5t-application-table-colwidths-v1';

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface ApplicationTableProps {
  items: ReviewApplicationItem[];
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  refetch: () => void;
  selectedRowIds: Set<string>;
  allChecked: boolean;
  isIndeterminate: boolean;
  toggleSelectAll: (checked: boolean) => void;
  toggleSelectRow: (id: string) => void;
  effectivePageIndex: number;
  effectivePageSize: number;
  onSelectApplication: (id: string) => void;
}

export function ApplicationTable({
  items,
  isPending,
  isError,
  error,
  refetch,
  selectedRowIds,
  allChecked,
  isIndeterminate,
  toggleSelectAll,
  toggleSelectRow,
  effectivePageIndex,
  effectivePageSize,
  onSelectApplication,
}: ApplicationTableProps) {
  const [colWidths, setColWidths] = useState<Record<AppColKey, number>>(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<AppColKey, number>>;
        return { ...DEFAULT_COL_WIDTHS, ...parsed };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_COL_WIDTHS;
  });

  const resizingRef = useRef<{ key: AppColKey; startX: number; startW: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(colWidths));
    } catch {
      /* ignore */
    }
  }, [colWidths]);

  const onResizeStart = useCallback(
    (e: ReactMouseEvent, key: AppColKey) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = { key, startX: e.clientX, startW: colWidths[key] };
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
    [colWidths]
  );

  const totalTableWidth = useMemo(
    () => Object.values(colWidths).reduce((a, b) => a + b, 0),
    [colWidths]
  );

  const ResizeHandle = ({ colKey }: { colKey: AppColKey }) => (
    <span
      onMouseDown={(e) => onResizeStart(e, colKey)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setColWidths((prev) => ({ ...prev, [colKey]: DEFAULT_COL_WIDTHS[colKey] }));
      }}
      title="Kéo để đổi độ rộng cột (double-click để reset)"
      className="absolute top-0 right-0 h-full w-3 cursor-col-resize select-none touch-none group/resize flex items-center justify-end"
    >
      <span className="block mr-[3px] h-4 w-px bg-[#C9CDD3] transition-colors group-hover/resize:bg-[#1683ff] group-active/resize:bg-[#1683ff]" />
    </span>
  );

  const col = (_key: AppColKey, extra = '') => `relative px-3 ${extra}`;

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="tbl-div border-collapse text-xs table-fixed" style={{ width: totalTableWidth, minWidth: '100%' }}>
        <colgroup>
          {(Object.keys(DEFAULT_COL_WIDTHS) as AppColKey[]).map((k) => (
            <col key={k} style={{ width: colWidths[k] }} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-[#ECEDEF] border-y border-[#D9DCE1] text-black select-none">
            {/* 1. Checkbox */}
            <th className={col('check', 'py-3.5 text-center')} style={{ width: colWidths.check }}>
              <input
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                type="checkbox"
                checked={allChecked}
                onChange={(e) => toggleSelectAll(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                aria-label="Chọn tất cả"
              />
              <ResizeHandle colKey="check" />
            </th>

            {/* 2. STT */}
            <th className={col('stt', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black')} style={{ width: colWidths.stt }}>
              <span className="block truncate">STT</span>
              <ResizeHandle colKey="stt" />
            </th>

            {/* 3. Họ tên */}
            <th className={col('fullname', 'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.fullname }}>
              <span className="block truncate">Họ tên</span>
              <ResizeHandle colKey="fullname" />
            </th>

            {/* 4. MSSV */}
            <th className={col('studentcode', 'py-3.5 text-right font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.studentcode }}>
              <span className="block truncate">MSSV</span>
              <ResizeHandle colKey="studentcode" />
            </th>

            {/* 5. Lớp */}
            <th className={col('class', 'py-3.5 text-right font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.class }}>
              <span className="block truncate">Lớp</span>
              <ResizeHandle colKey="class" />
            </th>

            {/* 6. Khoa */}
            <th className={col('faculty', 'py-3.5 text-right font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.faculty }}>
              <span className="block truncate">Khoa</span>
              <ResizeHandle colKey="faculty" />
            </th>

            {/* 7. Đợt xét */}
            <th className={col('campaign', 'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.campaign }}>
              <span className="block truncate">Đợt xét</span>
              <ResizeHandle colKey="campaign" />
            </th>

            {/* 8. 5 Tiêu chuẩn */}
            <th className={col('standards', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.standards }}>
              <span className="block truncate">5 Tiêu chuẩn</span>
              <ResizeHandle colKey="standards" />
            </th>

            {/* 9. Ngày nộp */}
            <th className={col('submittedAt', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.submittedAt }}>
              <span className="block truncate">Ngày nộp</span>
              <ResizeHandle colKey="submittedAt" />
            </th>

            {/* 10. Trạng thái */}
            <th className={col('status', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.status }}>
              <span className="block truncate">Trạng thái</span>
              <ResizeHandle colKey="status" />
            </th>

            {/* 11. Thao tác */}
            <th className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden" style={{ width: colWidths.actions }}>
              <span className="block truncate">Thao tác</span>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100/80 [&>tr:nth-child(even)]:bg-slate-50/50">
          {/* Loading State */}
          {isPending && (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-3 py-2.5 text-center"><div className="w-3.5 h-3.5 bg-slate-200 rounded mx-auto" /></td>
                  <td className="px-2 py-2 text-center"><div className="w-3.5 h-3 bg-slate-200 rounded mx-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-3/4" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-1/2 ml-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-1/2 ml-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-2/3 ml-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-4/5" /></td>
                  <td className="px-3 py-2 text-center"><div className="h-4 bg-slate-200 rounded-full w-24 mx-auto" /></td>
                  <td className="px-3 py-2 text-center"><div className="h-3.5 bg-slate-200 rounded w-16 mx-auto" /></td>
                  <td className="px-3 py-2 text-center"><div className="h-5 bg-slate-200 rounded-full w-20 mx-auto" /></td>
                  <td className="px-3 py-2.5 text-center"><div className="h-7 bg-slate-200 rounded w-16 mx-auto" /></td>
                </tr>
              ))}
            </>
          )}

          {/* Error State */}
          {!isPending && isError && (
            <tr>
              <td colSpan={11} className="py-10 text-center">
                <div className="space-y-2">
                  <AlertCircle size={24} className="text-rose-500 mx-auto" />
                  <div className="text-sm font-medium text-slate-700">Không thể tải danh sách hồ sơ</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto break-words">{sanitizeApiError(error)}</p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer shadow-xs"
                  >
                    Thử lại
                  </button>
                </div>
              </td>
            </tr>
          )}

          {/* Empty State */}
          {!isPending && !isError && items.length === 0 && (
            <tr>
              <td colSpan={11} className="py-12 text-center text-slate-500">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-600">Chưa có hồ sơ phù hợp</div>
                  <p className="text-xs text-slate-400">
                    Không tìm thấy hồ sơ sinh viên nào theo điều kiện tìm kiếm và bộ lọc hiện tại.
                  </p>
                </div>
              </td>
            </tr>
          )}

          {/* Data Rows */}
          {!isPending && !isError && items.map((app, idx) => {
            const snap = parseApplicantSnapshot(app.applicantSnapshotJson);
            const statusCfg = APPLICATION_STATUS_CONFIG[app.status] ?? {
              label: app.status,
              bg: 'bg-slate-50',
              text: 'text-slate-600',
              dot: 'bg-slate-400',
              border: 'border-slate-200',
            };

            const completeStandardsCount = app.standards?.filter((s) => s.complete).length ?? 0;

            return (
              <tr key={app.id} className="hover:bg-blue-50/60 transition-colors duration-200 hover:shadow-[inset_2px_0_0_0_#3b82f6]">
                {/* Checkbox */}
                <td
                  className="px-3 py-2.5 text-center align-middle overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName !== 'INPUT') {
                      toggleSelectRow(app.id);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRowIds.has(app.id)}
                    onChange={() => toggleSelectRow(app.id)}
                    className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                    aria-label={`Chọn hồ sơ ${app.applicationCode}`}
                  />
                </td>

                {/* STT */}
                <td className="px-2 py-3 text-center align-middle text-slate-500 text-[11px] overflow-hidden whitespace-nowrap">
                  {(effectivePageIndex - 1) * effectivePageSize + idx + 1}
                </td>

                {/* Họ tên */}
                <td className="px-3 py-2.5 text-left align-middle overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onSelectApplication(app.id)}
                    className="cursor-pointer group/link block text-left max-w-full"
                    title={snap.fullName || '—'}
                  >
                    <div className="text-[13px] text-slate-700 truncate text-left font-normal">
                      {snap.fullName || '—'}
                    </div>
                  </button>
                </td>

                {/* MSSV */}
                <td className="px-3 py-2.5 text-right align-middle text-slate-800 whitespace-nowrap overflow-hidden">
                  <span className="block truncate" title={snap.studentCode || ''}>
                    {snap.studentCode || '—'}
                  </span>
                </td>

                {/* Lớp */}
                <td className="px-3 py-2.5 text-right align-middle text-slate-600 whitespace-nowrap overflow-hidden">
                  <span className="block truncate" title={snap.administrativeClass || ''}>
                    {snap.administrativeClass || '—'}
                  </span>
                </td>

                {/* Khoa */}
                <td className="px-3 py-2.5 text-right align-middle text-slate-600 overflow-hidden">
                  <div className="truncate text-right" title={snap.faculty || ''}>
                    {snap.faculty || '—'}
                  </div>
                </td>

                {/* Đợt xét */}
                <td className="px-3 py-2.5 text-left align-middle text-slate-700 overflow-hidden">
                  <div className="truncate" title={app.campaignName}>
                    {app.campaignName}
                  </div>
                </td>

                {/* 5 Tiêu chuẩn: Icon 5 nhóm */}
                <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 justify-center">
                    {['Ethics', 'Study', 'Fitness', 'Volunteer', 'Integration'].map((code) => {
                      const iconDef = STANDARD_GROUP_ICONS[code];
                      const stdProg = app.standards?.find((s) => s.groupCode === code);
                      const isComplete = Boolean(stdProg?.complete);
                      const IconComp = iconDef ? iconDef.icon : null;

                      return (
                        <span
                          key={code}
                          title={`${iconDef?.label ?? code}: ${isComplete ? 'Đạt' : 'Chưa đạt'}`}
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition-colors ${
                            isComplete
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {IconComp && <IconComp size={11} />}
                        </span>
                      );
                    })}
                    <span className="ml-1 text-[11px] font-mono text-slate-500">
                      ({completeStandardsCount}/5)
                    </span>
                  </div>
                </td>

                {/* Ngày nộp */}
                <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                  <span className="block truncate">{fmtDate(app.submittedAt)}</span>
                </td>

                {/* Trạng thái */}
                <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </td>

                {/* Thao tác: Xem chi tiết */}
                <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSelectApplication(app.id)}
                    className="h-7 w-7 rounded-full bg-[#e8f3ff] text-[#0866db] hover:bg-[#1683ff] hover:text-white border border-[#dceafd] hover:border-[#1683ff] flex items-center justify-center transition-all cursor-pointer mx-auto"
                    title="Xem chi tiết & thẩm định"
                  >
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
