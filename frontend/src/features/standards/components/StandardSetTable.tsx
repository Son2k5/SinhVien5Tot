import { useState, useRef, useEffect, useCallback, useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import {
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
} from '../../campaigns/types/campaign.types';
import {
  StandardSetStatus,
  type StandardSetResponse,
} from '../types/standard.types';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FolderTree,
  MoreVertical,
} from 'lucide-react';

export type StandardSetColKey =
  | 'check'
  | 'stt'
  | 'name'
  | 'academicYear'
  | 'level'
  | 'awardType'
  | 'publishedAt'
  | 'status'
  | 'actions';

const DEFAULT_COL_WIDTHS: Record<StandardSetColKey, number> = {
  check: 44,
  stt: 52,
  name: 300,
  academicYear: 120,
  level: 130,
  awardType: 120,
  publishedAt: 130,
  status: 140,
  actions: 80,
};

const MIN_COL_WIDTHS: Record<StandardSetColKey, number> = {
  check: 40,
  stt: 44,
  name: 180,
  academicYear: 90,
  level: 95,
  awardType: 90,
  publishedAt: 100,
  status: 115,
  actions: 65,
};

const COL_STORAGE_KEY = 'sv5t-standardset-table-colwidths-v3';

const STATUS_CONFIG: Record<
  StandardSetStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  [StandardSetStatus.Draft]: {
    label: 'Bản nháp',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  [StandardSetStatus.Published]: {
    label: 'Đã công bố',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  [StandardSetStatus.Archived]: {
    label: 'Đã lưu trữ',
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
};

const formatDate = (isoString?: string | null) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export interface StandardSetTableProps {
  items: StandardSetResponse[];
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  refetch: () => void;
  selected: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAll: (on: boolean) => void;
  effectivePageIndex: number;
  effectivePageSize: number;
  filterCount: number;
  onResetFilters: () => void;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onToggleSort: (colKey: string) => void;
  onOpenMenu: (e: ReactMouseEvent<HTMLButtonElement>, item: StandardSetResponse) => void;
  menuOpenItemId?: string;
  onNavigateDetail: (id: string) => void;
}

export function StandardSetTable({
  items,
  isPending,
  isError,
  errorMessage,
  refetch,
  selected,
  onToggleOne,
  onToggleAll,
  effectivePageIndex,
  effectivePageSize,
  filterCount,
  onResetFilters,
  sortBy,
  sortDir,
  onToggleSort,
  onOpenMenu,
  menuOpenItemId,
  onNavigateDetail,
}: StandardSetTableProps) {
  const [colWidths, setColWidths] = useState<Record<StandardSetColKey, number>>(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<StandardSetColKey, number>>;
        return { ...DEFAULT_COL_WIDTHS, ...parsed };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_COL_WIDTHS;
  });

  const resizingRef = useRef<{ key: StandardSetColKey; startX: number; startW: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(colWidths));
    } catch {
      /* ignore */
    }
  }, [colWidths]);

  const onResizeStart = useCallback(
    (e: ReactMouseEvent, key: StandardSetColKey) => {
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

  const ResizeHandle = ({ colKey }: { colKey: StandardSetColKey }) => (
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

  const colClass = (extra: string = '') => `relative px-3 ${extra}`;

  const totalTableWidth = useMemo(
    () => Object.values(colWidths).reduce((a, b) => a + b, 0),
    [colWidths],
  );

  const renderSortIndicator = (colKey: string) => {
    if (sortBy !== colKey) {
      return (
        <ArrowUpDown
          size={12}
          className="text-black/30 group-hover:text-[#0866db] transition-colors shrink-0"
        />
      );
    }
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="text-[#1683ff] shrink-0" />
    ) : (
      <ArrowDown size={12} className="text-[#1683ff] shrink-0" />
    );
  };

  const allChecked = items.length > 0 && items.every((i) => selected.has(i.id));
  const isIndeterminate = items.length > 0 && items.some((i) => selected.has(i.id)) && !allChecked;

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table
        className="tbl-div border-collapse text-xs table-fixed"
        style={{ width: totalTableWidth, minWidth: '100%' }}
      >
        <colgroup>
          {(Object.keys(DEFAULT_COL_WIDTHS) as StandardSetColKey[]).map((k) => (
            <col key={k} style={{ width: colWidths[k] }} />
          ))}
        </colgroup>

        <thead>
          <tr className="bg-[#ECEDEF] border-y border-[#D9DCE1] text-black select-none">
            {/* 1. Checkbox */}
            <th className={colClass('py-3.5 text-center')} style={{ width: colWidths.check }}>
              <input
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                type="checkbox"
                checked={allChecked}
                onChange={(e) => onToggleAll(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                aria-label="Chọn tất cả các dòng trên trang này"
              />
              <ResizeHandle colKey="check" />
            </th>

            {/* 2. STT */}
            <th
              className={colClass(
                'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden',
              )}
              style={{ width: colWidths.stt }}
            >
              <span className="block truncate">STT</span>
              <ResizeHandle colKey="stt" />
            </th>

            {/* 3. Tên bộ tiêu chuẩn */}
            <th
              onClick={() => onToggleSort('name')}
              className={colClass(
                'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden cursor-pointer hover:bg-slate-200/80 group',
              )}
              style={{ width: colWidths.name }}
              title="Sắp xếp theo tên bộ tiêu chuẩn"
            >
              <div className="inline-flex items-center gap-1.5 max-w-full">
                <span className="truncate">Bộ tiêu chuẩn</span>
                {renderSortIndicator('name')}
              </div>
              <ResizeHandle colKey="name" />
            </th>

            {/* 4. Năm học */}
            <th
              onClick={() => onToggleSort('academicYear')}
              className={colClass(
                'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden cursor-pointer hover:bg-slate-200/80 group',
              )}
              style={{ width: colWidths.academicYear }}
              title="Sắp xếp theo năm học"
            >
              <div className="inline-flex items-center gap-1.5 max-w-full">
                <span className="truncate">Niên khóa</span>
                {renderSortIndicator('academicYear')}
              </div>
              <ResizeHandle colKey="academicYear" />
            </th>

            {/* 5. Cấp xét */}
            <th
              onClick={() => onToggleSort('level')}
              className={colClass(
                'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden cursor-pointer hover:bg-slate-200/80 group',
              )}
              style={{ width: colWidths.level }}
              title="Sắp xếp theo cấp xét duyệt"
            >
              <div className="inline-flex items-center gap-1.5 max-w-full">
                <span className="truncate">Cấp xét</span>
                {renderSortIndicator('level')}
              </div>
              <ResizeHandle colKey="level" />
            </th>

            {/* 6. Đối tượng */}
            <th
              onClick={() => onToggleSort('awardType')}
              className={colClass(
                'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden cursor-pointer hover:bg-slate-200/80 group',
              )}
              style={{ width: colWidths.awardType }}
              title="Sắp xếp theo đối tượng danh hiệu"
            >
              <div className="inline-flex items-center gap-1.5 max-w-full">
                <span className="truncate">Đối tượng</span>
                {renderSortIndicator('awardType')}
              </div>
              <ResizeHandle colKey="awardType" />
            </th>

            {/* 7. Ngày công bố */}
            <th
              onClick={() => onToggleSort('publishedAt')}
              className={colClass(
                'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden cursor-pointer hover:bg-slate-200/80 group',
              )}
              style={{ width: colWidths.publishedAt }}
              title="Sắp xếp theo ngày công bố"
            >
              <div className="inline-flex items-center gap-1.5 max-w-full">
                <span className="truncate">Ngày công bố</span>
                {renderSortIndicator('publishedAt')}
              </div>
              <ResizeHandle colKey="publishedAt" />
            </th>

            {/* 8. Trạng thái */}
            <th
              onClick={() => onToggleSort('status')}
              className={colClass(
                'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden cursor-pointer hover:bg-slate-200/80 group',
              )}
              style={{ width: colWidths.status }}
              title="Sắp xếp theo trạng thái"
            >
              <div className="inline-flex items-center gap-1.5 max-w-full">
                <span className="truncate">Trạng thái</span>
                {renderSortIndicator('status')}
              </div>
              <ResizeHandle colKey="status" />
            </th>

            {/* 9. Thao tác */}
            <th
              className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden"
              style={{ width: colWidths.actions }}
            >
              <span className="block truncate">Thao tác</span>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100/80 [&>tr:nth-child(even)]:bg-slate-50/50">
          {/* Loading Skeleton */}
          {isPending && (
            <>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-3 py-2.5 text-center">
                    <div className="w-3.5 h-3.5 bg-slate-200 rounded mx-auto" />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <div className="w-4 h-3 bg-slate-200 rounded mx-auto" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-3.5 bg-slate-200 rounded w-16 mx-auto" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-3.5 bg-slate-200 rounded w-20 mx-auto" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-3.5 bg-slate-200 rounded w-16 mx-auto" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-3.5 bg-slate-200 rounded w-20 mx-auto" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-5 bg-slate-200 rounded-full w-20 mx-auto" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="h-6 w-6 bg-slate-200 rounded mx-auto" />
                  </td>
                </tr>
              ))}
            </>
          )}

          {/* Error State */}
          {!isPending && isError && (
            <tr>
              <td colSpan={9} className="py-10 text-center">
                <div className="space-y-2">
                  <AlertCircle size={24} className="text-rose-500 mx-auto" />
                  <div className="text-sm font-medium text-slate-700">
                    Không thể tải danh sách bộ tiêu chuẩn
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {errorMessage || 'Đã có lỗi kết nối đến máy chủ.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer shadow-xs"
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
              <td colSpan={9} className="py-12 text-center text-slate-500">
                <div className="space-y-2">
                  <FolderTree size={36} className="mx-auto text-slate-300" />
                  <div className="text-sm font-medium text-slate-600">
                    Chưa có bộ tiêu chuẩn nào phù hợp
                  </div>
                  <p className="text-xs text-slate-400">
                    {filterCount > 0
                      ? 'Thử thay đổi từ khóa hoặc điều chỉnh tiêu chí bộ lọc.'
                      : 'Bấm "Tạo bộ tiêu chuẩn" để thiết lập bộ khung mới.'}
                  </p>
                  {filterCount > 0 && (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}

          {/* Data Rows */}
          {!isPending &&
            !isError &&
            items.map((item, idx) => {
              const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG[StandardSetStatus.Draft];
              const displayName = item.name?.trim() || '';

              return (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/60 transition-colors duration-200 hover:shadow-[inset_2px_0_0_0_#3b82f6]"
                >
                  {/* 1. Checkbox */}
                  <td
                    className="px-3 py-2.5 text-center align-middle overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName !== 'INPUT') {
                        onToggleOne(item.id);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => onToggleOne(item.id)}
                      className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                      aria-label={`Chọn ${displayName || `bộ tiêu chuẩn ${item.academicYear}`}`}
                    />
                  </td>

                  {/* 2. STT */}
                  <td className="px-2 py-3 text-center align-middle text-slate-500 text-[11px] overflow-hidden whitespace-nowrap">
                    {(effectivePageIndex - 1) * effectivePageSize + idx + 1}
                  </td>

                  {/* 3. Tên bộ tiêu chuẩn */}
                  <td className="px-3 py-2.5 text-left align-middle overflow-hidden whitespace-nowrap">
                    {displayName ? (
                      <button
                        type="button"
                        onClick={() => onNavigateDetail(item.id)}
                        className="cursor-pointer block text-left max-w-full truncate group/name"
                        title={displayName}
                      >
                        <span className="text-[13px] font-normal text-slate-800 group-hover/name:text-[#1683ff] transition-colors truncate block">
                          {displayName}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavigateDetail(item.id)}
                        className="cursor-pointer block w-full text-left h-5"
                        title="Chưa đặt tên bộ tiêu chuẩn (Bấm để xem chi tiết)"
                      >
                        <span className="block select-none text-transparent">&nbsp;</span>
                      </button>
                    )}
                  </td>

                  {/* 4. Năm học */}
                  <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                    <span className="block truncate text-xs font-normal" title={item.academicYear}>
                      {item.academicYear}
                    </span>
                  </td>

                  {/* 5. Cấp xét */}
                  <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                    <span
                      className="block truncate text-xs font-normal"
                      title={AWARD_LEVEL_LABELS[item.level] ?? item.level}
                    >
                      {AWARD_LEVEL_LABELS[item.level] ?? item.level}
                    </span>
                  </td>

                  {/* 6. Đối tượng */}
                  <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                    <span
                      className="block truncate text-xs font-normal"
                      title={AWARD_TYPE_LABELS[item.awardType] ?? item.awardType}
                    >
                      {AWARD_TYPE_LABELS[item.awardType] ?? item.awardType}
                    </span>
                  </td>

                  {/* 7. Ngày công bố */}
                  <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                    <span
                      className="block truncate text-xs font-normal"
                      title={formatDate(item.publishedAt)}
                    >
                      {formatDate(item.publishedAt)}
                    </span>
                  </td>

                  {/* 8. Trạng thái */}
                  <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap overflow-hidden">
                    <div className="inline-flex justify-center max-w-full overflow-hidden whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 h-[24px] px-2.5 rounded-full border text-[11px] font-medium whitespace-nowrap max-w-full overflow-hidden ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        title={statusCfg.label}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} shrink-0`} />
                        <span className="truncate">{statusCfg.label}</span>
                      </span>
                    </div>
                  </td>

                  {/* 9. Thao tác */}
                  <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap overflow-hidden">
                    <div className="inline-flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => onOpenMenu(e, item)}
                        className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                          menuOpenItemId === item.id
                            ? 'bg-blue-50 text-[#1683ff] border-blue-200 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent hover:border-slate-200'
                        }`}
                        title="Thao tác"
                        aria-label={`Thao tác cho ${displayName || item.academicYear}`}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
