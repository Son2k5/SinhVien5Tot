import { useState, useRef, useEffect, useCallback, useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import type { AdminStudentListItem } from '../types/student.types';
import { ActiveBadge } from './StudentBadges';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  Lock,
  LockOpen,
  Trash2,
} from 'lucide-react';

export type StudentColKey =
  | 'check'
  | 'stt'
  | 'fullname'
  | 'email'
  | 'studentcode'
  | 'class'
  | 'faculty'
  | 'major'
  | 'status'
  | 'createdAt'
  | 'actions';

const DEFAULT_COL_WIDTHS: Record<StudentColKey, number> = {
  check: 44,
  stt: 52,
  fullname: 190,
  email: 230,
  studentcode: 120,
  class: 110,
  faculty: 160,
  major: 170,
  status: 148,
  createdAt: 115,
  actions: 124,
};

const MIN_COL_WIDTHS: Record<StudentColKey, number> = {
  check: 40,
  stt: 44,
  fullname: 120,
  email: 150,
  studentcode: 88,
  class: 80,
  faculty: 100,
  major: 100,
  status: 122,
  createdAt: 96,
  actions: 110,
};

const COL_STORAGE_KEY = 'sv5t-student-table-colwidths-v2';

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export interface StudentTableProps {
  items: AdminStudentListItem[];
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  refetch: () => void;
  selected: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAll: (on: boolean) => void;
  allChecked: boolean;
  isIndeterminate: boolean;
  effectivePageIndex: number;
  effectivePageSize: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onToggleSort: (colKey: string) => void;
  totalFilterCount: number;
  onResetFilters: () => void;
  onViewStudent: (student: AdminStudentListItem) => void;
  onLockTarget: (student: AdminStudentListItem) => void;
  onDeleteStudent: (student: AdminStudentListItem) => void;
  canLock: boolean;
  canDelete: boolean;
}

export function StudentTable({
  items,
  isPending,
  isError,
  error,
  refetch,
  selected,
  onToggleOne,
  onToggleAll,
  allChecked,
  isIndeterminate,
  effectivePageIndex,
  effectivePageSize,
  sortBy,
  sortDir,
  onToggleSort,
  totalFilterCount,
  onResetFilters,
  onViewStudent,
  onLockTarget,
  onDeleteStudent,
  canLock,
  canDelete,
}: StudentTableProps) {
  const [colWidths, setColWidths] = useState<Record<StudentColKey, number>>(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<StudentColKey, number>>;
        return { ...DEFAULT_COL_WIDTHS, ...parsed };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_COL_WIDTHS;
  });

  const resizingRef = useRef<{ key: StudentColKey; startX: number; startW: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(colWidths));
    } catch {
      /* ignore */
    }
  }, [colWidths]);

  const onResizeStart = useCallback(
    (e: ReactMouseEvent, key: StudentColKey) => {
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
    [colWidths],
  );

  const totalTableWidth = useMemo(
    () => Object.values(colWidths).reduce((a, b) => a + b, 0),
    [colWidths],
  );

  const renderSortIndicator = (colKey: string) => {
    if (sortBy !== colKey) {
      return <ArrowUpDown size={12} className="text-black/30 group-hover:text-[#0866db] transition-colors" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="text-[#1683ff]" />
    ) : (
      <ArrowDown size={12} className="text-[#1683ff]" />
    );
  };

  const ResizeHandle = ({ colKey }: { colKey: StudentColKey }) => (
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

  const col = (_key: StudentColKey, extra: string = '') => `relative px-3 ${extra}`;

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="tbl-div border-collapse text-xs table-fixed" style={{ width: totalTableWidth, minWidth: '100%' }}>
        <colgroup>
          {(Object.keys(DEFAULT_COL_WIDTHS) as StudentColKey[]).map((k) => (
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
                onChange={(e) => onToggleAll(e.target.checked)}
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
            <th
              onClick={() => onToggleSort('fullname')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleSort('fullname');
                }
              }}
              tabIndex={0}
              className={col('fullname', 'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden')}
              style={{ width: colWidths.fullname }}
              role="button"
              aria-label="Sắp xếp theo họ tên"
            >
              <div className="inline-flex items-center justify-start gap-1 max-w-full">
                <span className="truncate">Họ tên</span>
                {renderSortIndicator('fullname')}
              </div>
              <ResizeHandle colKey="fullname" />
            </th>

            {/* 4. Email */}
            <th className={col('email', 'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.email }}>
              <span className="block truncate">Email</span>
              <ResizeHandle colKey="email" />
            </th>

            {/* 5. MSSV */}
            <th
              onClick={() => onToggleSort('studentcode')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleSort('studentcode');
                }
              }}
              tabIndex={0}
              className={col('studentcode', 'py-3.5 text-right font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden')}
              style={{ width: colWidths.studentcode }}
              role="button"
              aria-label="Sắp xếp theo MSSV"
            >
              <div className="inline-flex items-center justify-end gap-1 max-w-full">
                <span className="truncate">MSSV</span>
                {renderSortIndicator('studentcode')}
              </div>
              <ResizeHandle colKey="studentcode" />
            </th>

            {/* 6. Lớp */}
            <th className={col('class', 'py-3.5 text-right font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.class }}>
              <span className="block truncate">Lớp</span>
              <ResizeHandle colKey="class" />
            </th>

            {/* 7. Khoa */}
            <th className={col('faculty', 'py-3.5 text-right font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.faculty }}>
              <span className="block truncate">Khoa</span>
              <ResizeHandle colKey="faculty" />
            </th>

            {/* 8. Ngành */}
            <th className={col('major', 'py-3.5 text-right font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.major }}>
              <span className="block truncate">Ngành</span>
              <ResizeHandle colKey="major" />
            </th>

            {/* 9. Trạng thái */}
            <th className={col('status', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.status }}>
              <span className="block truncate">Trạng thái</span>
              <ResizeHandle colKey="status" />
            </th>

            {/* 10. Ngày tạo */}
            <th
              onClick={() => onToggleSort('createdAt')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleSort('createdAt');
                }
              }}
              tabIndex={0}
              className={col('createdAt', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden')}
              style={{ width: colWidths.createdAt }}
              role="button"
              aria-label="Sắp xếp theo ngày tạo"
            >
              <div className="inline-flex items-center justify-center gap-1 max-w-full">
                <span className="truncate">Ngày tạo</span>
                {renderSortIndicator('createdAt')}
              </div>
              <ResizeHandle colKey="createdAt" />
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
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-5/6" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-2/3 ml-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-2/3 ml-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-3/4 ml-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-3/4 ml-auto" /></td>
                  <td className="px-3 py-2"><div className="h-5 bg-slate-200 rounded-full w-[72px] mx-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-14 mx-auto" /></td>
                  <td className="px-3 py-2.5 text-center"><div className="h-7 bg-slate-200 rounded w-20 mx-auto" /></td>
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
                  <div className="text-sm font-medium text-slate-700">Không thể tải dữ liệu</div>
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
                  <div className="text-sm font-medium text-slate-600">Chưa có sinh viên phù hợp</div>
                  <p className="text-xs text-slate-400">
                    {totalFilterCount > 0
                      ? 'Thử thay đổi từ khóa hoặc điều chỉnh tiêu chí bộ lọc.'
                      : 'Hiện chưa có dữ liệu sinh viên trong hệ thống.'}
                  </p>
                  {totalFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="px-4 py-2 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}

          {/* Data Rows */}
          {!isPending && !isError && items.map((s, idx) => (
            <tr key={s.id} className="hover:bg-blue-50/60 transition-colors duration-200 hover:shadow-[inset_2px_0_0_0_#3b82f6]">
              {/* Checkbox */}
              <td
                className="px-3 py-2.5 text-center align-middle overflow-hidden cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).tagName !== 'INPUT') {
                    onToggleOne(s.id);
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => onToggleOne(s.id)}
                  className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                  aria-label={`Chọn ${s.fullName}`}
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
                  onClick={() => onViewStudent(s)}
                  className="cursor-pointer group/link block text-left max-w-full"
                  title={s.fullName || s.displayName || ''}
                >
                  <div className="text-[13px] text-slate-700 truncate text-left font-normal">
                    {s.fullName || s.displayName || '—'}
                  </div>
                </button>
              </td>

              {/* Email */}
              <td className="px-3 py-2.5 text-left align-middle overflow-hidden">
                <div className="text-[12px] text-slate-700 truncate text-left font-normal" title={s.email}>
                  {s.email}
                </div>
              </td>

              {/* MSSV */}
              <td className="px-3 py-2.5 text-right align-middle text-slate-800 whitespace-nowrap overflow-hidden">
                <span className="block truncate" title={s.studentCode || ''}>{s.studentCode || '—'}</span>
              </td>

              {/* Lớp */}
              <td className="px-3 py-2.5 text-right align-middle text-slate-600 whitespace-nowrap overflow-hidden">
                <span className="block truncate" title={s.administrativeClass || ''}>{s.administrativeClass || '—'}</span>
              </td>

              {/* Khoa */}
              <td className="px-3 py-2.5 text-right align-middle text-slate-600 overflow-hidden">
                <div className="truncate text-right" title={s.faculty || ''}>{s.faculty || '—'}</div>
              </td>

              {/* Ngành */}
              <td className="px-3 py-2.5 text-right align-middle text-slate-600 overflow-hidden">
                <div className="truncate text-right" title={s.major || s.school || ''}>{s.major || s.school || '—'}</div>
              </td>

              {/* Trạng thái */}
              <td className="px-3 py-2.5 text-center align-middle overflow-hidden whitespace-nowrap">
                <div className="inline-flex justify-center max-w-full overflow-hidden whitespace-nowrap">
                  <ActiveBadge active={s.isActive} />
                </div>
              </td>

              {/* Ngày tạo */}
              <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                <span className="block truncate">{fmtDate(s.createdAt)}</span>
              </td>

              {/* Thao tác */}
              <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap">
                <div className="inline-flex items-center gap-1 justify-center">
                  <button
                    type="button"
                    onClick={() => onViewStudent(s)}
                    className="h-7 w-7 rounded-full bg-[#e8f3ff] text-[#0866db] hover:bg-[#1683ff] hover:text-white border border-[#dceafd] hover:border-[#1683ff] flex items-center justify-center transition-all cursor-pointer"
                    title="Xem chi tiết hồ sơ"
                    aria-label={`Xem chi tiết ${s.fullName || s.email}`}
                  >
                    <Eye size={14} />
                  </button>
                  {canLock && (
                    <button
                      type="button"
                      onClick={() => onLockTarget(s)}
                      className={`h-7 w-7 rounded-full flex items-center justify-center border shadow-sm transition-all cursor-pointer ${
                        s.isActive
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white border-amber-200 hover:border-amber-600'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-200 hover:border-emerald-600'
                      }`}
                      title={s.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      aria-label={`${s.isActive ? 'Khóa' : 'Mở khóa'} ${s.fullName || s.email}`}
                    >
                      {s.isActive ? <Lock size={14} /> : <LockOpen size={14} />}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDeleteStudent(s)}
                      className="h-7 w-7 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 flex items-center justify-center shadow-sm transition-all cursor-pointer"
                      title="Xóa sinh viên"
                      aria-label={`Xóa ${s.fullName || s.email}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
