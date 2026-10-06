import { useMemo, useState, useRef, useEffect, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import {
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
  CampaignStatus,
  CAMPAIGN_STATUS_LABELS,
  type CampaignResponse,
} from '../types/campaign.types';
import { AlertCircle, Edit2, Eye, Trash2 } from 'lucide-react';

export type CampaignColKey =
  | 'check'
  | 'stt'
  | 'name'
  | 'schoolYear'
  | 'level'
  | 'awardType'
  | 'standardSet'
  | 'regCloseAt'
  | 'reviewDeadline'
  | 'status'
  | 'actions';

const DEFAULT_COL_WIDTHS: Record<CampaignColKey, number> = {
  check: 44,
  stt: 52,
  name: 240,
  schoolYear: 110,
  level: 110,
  awardType: 110,
  standardSet: 150,
  regCloseAt: 120,
  reviewDeadline: 120,
  status: 140,
  actions: 124,
};

const MIN_COL_WIDTHS: Record<CampaignColKey, number> = {
  check: 40,
  stt: 44,
  name: 140,
  schoolYear: 80,
  level: 85,
  awardType: 85,
  standardSet: 100,
  regCloseAt: 95,
  reviewDeadline: 95,
  status: 110,
  actions: 110,
};

const COL_STORAGE_KEY = 'sv5t-campaign-table-colwidths-v1';

const formatDate = (isoString?: string) => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const STATUS_CONFIG: Record<CampaignStatus, { bg: string; text: string; border: string; dot: string }> = {
  [CampaignStatus.Draft]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  [CampaignStatus.Open]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  [CampaignStatus.Closed]: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  [CampaignStatus.Reviewing]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  [CampaignStatus.Published]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
  },
  [CampaignStatus.Archived]: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

export interface CampaignTableProps {
  items: CampaignResponse[];
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  selected: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAll: (on: boolean) => void;
  effectivePageIndex: number;
  effectivePageSize: number;
  activeFilterCount: number;
  onResetFilters: () => void;
  onOpenView: (id: string) => void;
  onOpenEdit: (campaign: CampaignResponse) => void;
  onOpenStatus: (campaign: CampaignResponse) => void;
  onOpenDelete: (campaign: CampaignResponse) => void;
}

export function CampaignTable({
  items,
  isPending,
  isError,
  refetch,
  selected,
  onToggleOne,
  onToggleAll,
  effectivePageIndex,
  effectivePageSize,
  activeFilterCount,
  onResetFilters,
  onOpenView,
  onOpenEdit,
  onOpenStatus,
  onOpenDelete,
}: CampaignTableProps) {
  const [colWidths, setColWidths] = useState<Record<CampaignColKey, number>>(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<CampaignColKey, number>>;
        return { ...DEFAULT_COL_WIDTHS, ...parsed };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_COL_WIDTHS;
  });

  const resizingRef = useRef<{ key: CampaignColKey; startX: number; startW: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(colWidths));
    } catch {
      /* ignore */
    }
  }, [colWidths]);

  const onResizeStart = useCallback(
    (e: ReactMouseEvent, key: CampaignColKey) => {
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

  const ResizeHandle = ({ colKey }: { colKey: CampaignColKey }) => (
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

  const col = (_key: CampaignColKey, extra = '') => `relative px-3 ${extra}`;

  const totalTableWidth = useMemo(
    () => Object.values(colWidths).reduce((a, b) => a + b, 0),
    [colWidths],
  );

  const allChecked = items.length > 0 && items.every((i) => selected.has(i.id));
  const isIndeterminate = items.length > 0 && items.some((i) => selected.has(i.id)) && !allChecked;

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="tbl-div border-collapse text-xs table-fixed" style={{ width: totalTableWidth, minWidth: '100%' }}>
        <colgroup>
          {(Object.keys(DEFAULT_COL_WIDTHS) as CampaignColKey[]).map((k) => (
            <col key={k} style={{ width: colWidths[k] }} />
          ))}
        </colgroup>

        {/* Table Header: neutral gray (#ECEDEF) */}
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
            <th className={col('stt', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.stt }}>
              <span className="block truncate">STT</span>
              <ResizeHandle colKey="stt" />
            </th>

            {/* 3. Chiến dịch */}
            <th className={col('name', 'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.name }}>
              <span className="block truncate">Chiến dịch</span>
              <ResizeHandle colKey="name" />
            </th>

            {/* 4. Niên khóa */}
            <th className={col('schoolYear', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.schoolYear }}>
              <span className="block truncate">Niên khóa</span>
              <ResizeHandle colKey="schoolYear" />
            </th>

            {/* 5. Cấp xét */}
            <th className={col('level', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.level }}>
              <span className="block truncate">Cấp xét</span>
              <ResizeHandle colKey="level" />
            </th>

            {/* 6. Đối tượng */}
            <th className={col('awardType', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.awardType }}>
              <span className="block truncate">Đối tượng</span>
              <ResizeHandle colKey="awardType" />
            </th>

            {/* 7. Bộ tiêu chuẩn */}
            <th className={col('standardSet', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.standardSet }}>
              <span className="block truncate">Bộ tiêu chuẩn</span>
              <ResizeHandle colKey="standardSet" />
            </th>

            {/* 8. Hạn đăng ký */}
            <th className={col('regCloseAt', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.regCloseAt }}>
              <span className="block truncate">Hạn đăng ký</span>
              <ResizeHandle colKey="regCloseAt" />
            </th>

            {/* 9. Hạn xét duyệt */}
            <th className={col('reviewDeadline', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.reviewDeadline }}>
              <span className="block truncate">Hạn xét duyệt</span>
              <ResizeHandle colKey="reviewDeadline" />
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

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100/80 [&>tr:nth-child(even)]:bg-slate-50/50">
          {/* Loading Skeleton */}
          {isPending && (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-3 py-2.5 text-center"><div className="w-3.5 h-3.5 bg-slate-200 rounded mx-auto" /></td>
                  <td className="px-2 py-2 text-center"><div className="w-3.5 h-3 bg-slate-200 rounded mx-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-3/4" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-16 mx-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-20 mx-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-16 mx-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-28 mx-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-20 mx-auto" /></td>
                  <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-20 mx-auto" /></td>
                  <td className="px-3 py-2"><div className="h-5 bg-slate-200 rounded-full w-24 mx-auto" /></td>
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
                  <div className="text-sm font-medium text-slate-700">Không thể tải dữ liệu chiến dịch</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Đã có lỗi xảy ra trong quá trình kết nối đến máy chủ.
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
              <td colSpan={11} className="py-12 text-center text-slate-500">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-600">Không tìm thấy đợt xét nào phù hợp</div>
                  <p className="text-xs text-slate-400">
                    {activeFilterCount > 0
                      ? 'Thử thay đổi từ khóa hoặc điều chỉnh tiêu chí bộ lọc.'
                      : 'Hiện chưa có chiến dịch SV5T nào trong hệ thống.'}
                  </p>
                  {activeFilterCount > 0 && (
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
          {!isPending && !isError && items.map((campaign, idx) => {
            const isClosedOrArchived =
              campaign.status === CampaignStatus.Closed ||
              campaign.status === CampaignStatus.Archived;
            const statusCfg = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG[CampaignStatus.Draft];

            return (
              <tr
                key={campaign.id}
                className="hover:bg-blue-50/60 transition-colors duration-200 hover:shadow-[inset_2px_0_0_0_#3b82f6]"
              >
                {/* 1. Checkbox */}
                <td
                  className="px-3 py-2.5 text-center align-middle overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName !== 'INPUT') {
                      onToggleOne(campaign.id);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(campaign.id)}
                    onChange={() => onToggleOne(campaign.id)}
                    className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                    title={`Chọn ${campaign.name}`}
                    aria-label={`Chọn ${campaign.name}`}
                  />
                </td>

                {/* 2. STT */}
                <td className="px-2 py-3 text-center align-middle text-slate-500 text-[11px] overflow-hidden whitespace-nowrap">
                  {(effectivePageIndex - 1) * effectivePageSize + idx + 1}
                </td>

                {/* 3. Tên chiến dịch */}
                <td className="px-3 py-2.5 text-left align-middle overflow-hidden whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onOpenView(campaign.id)}
                    className="cursor-pointer block text-left max-w-full truncate"
                    title={campaign.name}
                  >
                    <span className="text-[13px] font-normal text-slate-800 hover:text-[#1683ff] transition-colors truncate block">
                      {campaign.name}
                    </span>
                  </button>
                  {campaign.prerequisiteCampaignName && (
                    <div
                      className="text-[11px] text-slate-400 mt-0.5 truncate max-w-full"
                      title={`Tiên quyết: ${campaign.prerequisiteCampaignName}`}
                    >
                      Tiên quyết: <span className="text-slate-600 font-normal">{campaign.prerequisiteCampaignName}</span>
                    </div>
                  )}
                </td>

                {/* 4. Niên khóa */}
                <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                  <span className="block truncate text-xs font-normal" title={campaign.schoolYear || '—'}>
                    {campaign.schoolYear || '—'}
                  </span>
                </td>

                {/* 5. Cấp xét */}
                <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                  <span className="block truncate text-xs font-normal" title={AWARD_LEVEL_LABELS[campaign.level] ?? campaign.level}>
                    {AWARD_LEVEL_LABELS[campaign.level] ?? campaign.level}
                  </span>
                </td>

                {/* 6. Đối tượng */}
                <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                  <span className="block truncate text-xs font-normal" title={AWARD_TYPE_LABELS[campaign.awardType] ?? campaign.awardType}>
                    {AWARD_TYPE_LABELS[campaign.awardType] ?? campaign.awardType}
                  </span>
                </td>

                {/* 7. Bộ tiêu chuẩn */}
                <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                  <span
                    className="block truncate text-xs font-normal"
                    title={campaign.standardSetName || campaign.standardSetId}
                  >
                    {campaign.standardSetName || (
                      <span className="font-mono text-slate-400 text-[11px]">
                        ID: {campaign.standardSetId.slice(0, 8)}...
                      </span>
                    )}
                  </span>
                </td>

                {/* 8. Hạn đăng ký */}
                <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                  <span className="block truncate text-xs font-normal" title={formatDate(campaign.regCloseAt)}>
                    {formatDate(campaign.regCloseAt)}
                  </span>
                </td>

                {/* 9. Hạn xét duyệt */}
                <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                  <span className="block truncate text-xs font-normal" title={formatDate(campaign.reviewDeadline)}>
                    {formatDate(campaign.reviewDeadline)}
                  </span>
                </td>

                {/* 10. Trạng thái */}
                <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap overflow-hidden">
                  <div className="inline-flex justify-center max-w-full overflow-hidden whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenStatus(campaign)}
                      className={`inline-flex items-center gap-1.5 h-[24px] px-2.5 rounded-full border text-[11px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity max-w-full overflow-hidden ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      title="Bấm để cập nhật trạng thái"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} shrink-0`} />
                      <span className="truncate">{CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status}</span>
                    </button>
                  </div>
                </td>

                {/* 11. Thao tác */}
                <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap overflow-hidden">
                  <div className="inline-flex items-center gap-1 justify-center">
                    <button
                      type="button"
                      onClick={() => onOpenView(campaign.id)}
                      className="h-7 w-7 rounded-full bg-[#e8f3ff] text-[#0866db] hover:bg-[#1683ff] hover:text-white border border-[#dceafd] hover:border-[#1683ff] flex items-center justify-center transition-all cursor-pointer"
                      title="Xem chi tiết chiến dịch"
                      aria-label={`Xem chi tiết ${campaign.name}`}
                    >
                      <Eye size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenEdit(campaign)}
                      disabled={isClosedOrArchived}
                      className="h-7 w-7 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white border border-amber-200 hover:border-amber-600 flex items-center justify-center shadow-xs transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      title={
                        isClosedOrArchived
                          ? 'Không thể sửa chiến dịch đã đóng hoặc lưu trữ'
                          : 'Chỉnh sửa đợt xét'
                      }
                      aria-label={`Chỉnh sửa ${campaign.name}`}
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenDelete(campaign)}
                      className="h-7 w-7 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                      title="Xoá chiến dịch"
                      aria-label={`Xoá ${campaign.name}`}
                    >
                      <Trash2 size={13} />
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
