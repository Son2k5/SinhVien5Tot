import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AdminArticleListItem } from '../types/news.types';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Pin,
  Trash2,
  Undo2,
  Archive,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 12, 25, 50];

// Danh mục: Text có màu riêng, KHÔNG sử dụng màu nền background
const CATEGORY_TEXT_STYLES: Record<string, { label: string; className: string }> = {
  News: {
    label: 'Tin tức',
    className: 'text-blue-600 font-semibold',
  },
  Announcement: {
    label: 'Thông báo',
    className: 'text-purple-600 font-semibold',
  },
  Event: {
    label: 'Sự kiện',
    className: 'text-amber-600 font-semibold',
  },
};

// Trạng thái: Pill badge sắc nét
const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  Draft: {
    label: 'Bản nháp',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
  Published: {
    label: 'Đã xuất bản',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Archived: {
    label: 'Lưu trữ',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

export type ArticleColKey =
  | 'check'
  | 'stt'
  | 'title'
  | 'category'
  | 'author'
  | 'publishedAt'
  | 'updatedAt'
  | 'status'
  | 'actions';

const DEFAULT_COL_WIDTHS: Record<ArticleColKey, number> = {
  check: 44,
  stt: 52,
  title: 340,
  category: 120,
  author: 140,
  publishedAt: 120,
  updatedAt: 130,
  status: 130, // Đặt xuống cuối trước phần thao tác
  actions: 140,
};

const MIN_COL_WIDTHS: Record<ArticleColKey, number> = {
  check: 40,
  stt: 44,
  title: 180,
  category: 95,
  author: 100,
  publishedAt: 100,
  updatedAt: 110,
  status: 110,
  actions: 120,
};

const COL_STORAGE_KEY = 'sv5t-admin-articles-colwidths-v2';

interface ArticleTableProps {
  items: AdminArticleListItem[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
  // Selection
  selected: Set<string>;
  onToggleSelectOne: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  // Sorting
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onToggleSort: (colKey: string) => void;
  // Pagination
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  // Actions
  onAction: (type: 'publish' | 'unpublish' | 'archive' | 'restore' | 'delete', item: AdminArticleListItem) => void;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
}

export function ArticleTable({
  items,
  total,
  isLoading,
  isError,
  error,
  refetch,
  selected,
  onToggleSelectOne,
  onToggleSelectAll,
  sortBy,
  sortDir,
  onToggleSort,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onAction,
  onResetFilters,
  hasActiveFilters = false,
}: ArticleTableProps) {
  const navigate = useNavigate();

  // Column width resizing state
  const [colWidths, setColWidths] = useState<Record<ArticleColKey, number>>(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<ArticleColKey, number>>;
        return { ...DEFAULT_COL_WIDTHS, ...parsed };
      }
    } catch { /* ignore */ }
    return DEFAULT_COL_WIDTHS;
  });

  const resizingRef = useRef<{ key: ArticleColKey; startX: number; startW: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(colWidths));
    } catch { /* ignore */ }
  }, [colWidths]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, key: ArticleColKey) => {
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

  const ResizeHandle = ({ colKey }: { colKey: ArticleColKey }) => (
    <span
      onMouseDown={(e) => onResizeStart(e, colKey)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setColWidths((prev) => ({ ...prev, [colKey]: DEFAULT_COL_WIDTHS[colKey] }));
      }}
      title="Kéo để đổi độ rộng cột (double-click để đặt lại)"
      className="absolute top-0 right-0 h-full w-3 cursor-col-resize select-none touch-none group/resize flex items-center justify-end"
    >
      <span className="block mr-[3px] h-4 w-px bg-[#C9CDD3] transition-colors group-hover/resize:bg-[#1683ff] group-active/resize:bg-[#1683ff]" />
    </span>
  );

  const col = (_key: ArticleColKey, extra: string = '') => `relative px-3 ${extra}`;

  const totalTableWidth = useMemo(
    () => Object.values(colWidths).reduce((a, b) => a + b, 0),
    [colWidths]
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

  // Checkbox indeterminate logic
  const allChecked = items.length > 0 && items.every((i) => selected.has(i.id));
  const isIndeterminate = items.length > 0 && items.some((i) => selected.has(i.id)) && !allChecked;

  // Pagination calculation
  const totalPages = Math.ceil(total / pageSize) || 1;
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, total);
  const canPrev = page <= 1;
  const canNext = page >= totalPages;

  return (
    <div className="font-inter">
      {/* Table zone */}
      <div className="overflow-x-auto custom-scrollbar">
        <table
          className="tbl-div border-collapse text-xs table-fixed font-inter"
          style={{ width: totalTableWidth, minWidth: '100%' }}
        >
          <colgroup>
            {(Object.keys(DEFAULT_COL_WIDTHS) as ArticleColKey[]).map((k) => (
              <col key={k} style={{ width: colWidths[k] }} />
            ))}
          </colgroup>

          {/* Table Header */}
          <thead>
            <tr className="bg-[#ECEDEF] border-y border-[#D9DCE1] text-black select-none">
              {/* 1. Checkbox chọn tất cả */}
              <th className={col('check', 'py-3.5 text-center')} style={{ width: colWidths.check }}>
                <input
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                  aria-label="Chọn tất cả bài viết trên trang"
                />
                <ResizeHandle colKey="check" />
              </th>

              {/* 2. STT */}
              <th
                className={col(
                  'stt',
                  'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black'
                )}
                style={{ width: colWidths.stt }}
              >
                <span className="block truncate">STT</span>
                <ResizeHandle colKey="stt" />
              </th>

              {/* 3. Tiêu đề */}
              <th
                onClick={() => onToggleSort('title')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleSort('title');
                  }
                }}
                tabIndex={0}
                className={col(
                  'title',
                  'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden'
                )}
                style={{ width: colWidths.title }}
                role="button"
                aria-label="Sắp xếp theo tiêu đề"
              >
                <div className="inline-flex items-center justify-start gap-1 max-w-full">
                  <span className="truncate">Tiêu đề bài viết</span>
                  {renderSortIndicator('title')}
                </div>
                <ResizeHandle colKey="title" />
              </th>

              {/* 4. Danh mục (Text màu, không có background) */}
              <th
                onClick={() => onToggleSort('category')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleSort('category');
                  }
                }}
                tabIndex={0}
                className={col(
                  'category',
                  'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden'
                )}
                style={{ width: colWidths.category }}
                role="button"
                aria-label="Sắp xếp theo danh mục"
              >
                <div className="inline-flex items-center justify-center gap-1 max-w-full">
                  <span className="truncate">Danh mục</span>
                  {renderSortIndicator('category')}
                </div>
                <ResizeHandle colKey="category" />
              </th>

              {/* 5. Tác giả */}
              <th
                onClick={() => onToggleSort('authorName')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleSort('authorName');
                  }
                }}
                tabIndex={0}
                className={col(
                  'author',
                  'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden'
                )}
                style={{ width: colWidths.author }}
                role="button"
                aria-label="Sắp xếp theo tác giả"
              >
                <div className="inline-flex items-center justify-start gap-1 max-w-full">
                  <span className="truncate">Tác giả</span>
                  {renderSortIndicator('authorName')}
                </div>
                <ResizeHandle colKey="author" />
              </th>

              {/* 6. Ngày xuất bản */}
              <th
                onClick={() => onToggleSort('publishedAt')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleSort('publishedAt');
                  }
                }}
                tabIndex={0}
                className={col(
                  'publishedAt',
                  'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden'
                )}
                style={{ width: colWidths.publishedAt }}
                role="button"
                aria-label="Sắp xếp theo ngày xuất bản"
              >
                <div className="inline-flex items-center justify-center gap-1 max-w-full">
                  <span className="truncate">Ngày xuất bản</span>
                  {renderSortIndicator('publishedAt')}
                </div>
                <ResizeHandle colKey="publishedAt" />
              </th>

              {/* 7. Cập nhật lần cuối */}
              <th
                onClick={() => onToggleSort('updatedAt')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleSort('updatedAt');
                  }
                }}
                tabIndex={0}
                className={col(
                  'updatedAt',
                  'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden'
                )}
                style={{ width: colWidths.updatedAt }}
                role="button"
                aria-label="Sắp xếp theo ngày cập nhật"
              >
                <div className="inline-flex items-center justify-center gap-1 max-w-full">
                  <span className="truncate">Cập nhật</span>
                  {renderSortIndicator('updatedAt')}
                </div>
                <ResizeHandle colKey="updatedAt" />
              </th>

              {/* 8. Trạng thái (Chuyển xuống trước phần Thao tác) */}
              <th
                onClick={() => onToggleSort('status')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleSort('status');
                  }
                }}
                tabIndex={0}
                className={col(
                  'status',
                  'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden'
                )}
                style={{ width: colWidths.status }}
                role="button"
                aria-label="Sắp xếp theo trạng thái"
              >
                <div className="inline-flex items-center justify-center gap-1 max-w-full">
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

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100/80 [&>tr:nth-child(even)]:bg-slate-50/50">
            {/* Loading State */}
            {isLoading && (
              <>
                {[0, 1, 2, 3, 4].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-3 py-3 text-center">
                      <div className="w-3.5 h-3.5 bg-slate-200 rounded mx-auto" />
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="w-5 h-3.5 bg-slate-200 rounded mx-auto" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="h-4 bg-slate-200 rounded w-4/5" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="h-4 bg-slate-200 rounded w-16 mx-auto" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="h-3.5 bg-slate-200 rounded w-24" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="h-3.5 bg-slate-200 rounded w-20 mx-auto" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="h-3.5 bg-slate-200 rounded w-24 mx-auto" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="h-5 bg-slate-200 rounded-full w-20 mx-auto" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="h-7 bg-slate-200 rounded w-24 mx-auto" />
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Error State */}
            {!isLoading && isError && (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="space-y-2">
                    <AlertCircle size={24} className="text-rose-500 mx-auto" />
                    <div className="text-sm font-medium text-slate-700 font-inter">
                      Không thể tải danh sách bài viết
                    </div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto font-inter">
                      {(error as any)?.message || 'Vui lòng kiểm tra lại kết nối và thử lại.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer shadow-xs transition-colors font-inter"
                    >
                      Thử lại
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty State */}
            {!isLoading && !isError && items.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="space-y-2">
                    <FileText className="w-9 h-9 text-slate-300 mx-auto mb-1" />
                    <div className="text-sm font-medium text-slate-600 font-inter">
                      Không tìm thấy bài viết nào
                    </div>
                    <p className="text-xs text-slate-400 font-inter">
                      {hasActiveFilters
                        ? 'Thử thay đổi từ khóa hoặc điều chỉnh tiêu chí bộ lọc.'
                        : 'Hiện chưa có bài viết nào trong hệ thống.'}
                    </p>
                    {hasActiveFilters && onResetFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="px-4 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors font-inter"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!isLoading &&
              !isError &&
              items.map((item, idx) => {
                const categoryStyle =
                  CATEGORY_TEXT_STYLES[item.category] || {
                    label: item.category,
                    className: 'text-slate-600 font-medium',
                  };
                const statusMeta =
                  STATUS_CONFIG[item.status] || {
                    label: item.status,
                    badge: 'bg-slate-100 text-slate-700 border-slate-200',
                    dot: 'bg-slate-400',
                  };

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/60 transition-colors duration-200 hover:shadow-[inset_2px_0_0_0_#3b82f6] font-inter"
                  >
                    {/* 1. Checkbox chọn từng dòng */}
                    <td
                      className="px-3 py-2.5 text-center align-middle overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                          onToggleSelectOne(item.id);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => onToggleSelectOne(item.id)}
                        className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                        aria-label={`Chọn bài viết ${item.title}`}
                      />
                    </td>

                    {/* 2. STT */}
                    <td className="px-2 py-3 text-center align-middle text-slate-500 text-[11px] overflow-hidden whitespace-nowrap">
                      {(page - 1) * pageSize + idx + 1}
                    </td>

                    {/* 3. Tiêu đề (không chứa icon ảnh) */}
                    <td className="px-3 py-2.5 text-left align-middle overflow-hidden">
                      <div className="flex items-center gap-1.5 max-w-full">
                        {item.isPinned && (
                          <span
                            title="Bài viết được ghim"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0 font-inter"
                          >
                            <Pin size={10} className="fill-blue-600 text-blue-600" />
                            <span>Ghim</span>
                          </span>
                        )}
                        <Link
                          to={`/admin/articles/${item.id}/edit`}
                          className="text-[13px] font-medium text-slate-900 hover:text-blue-600 transition-colors truncate block font-inter"
                          title={item.title}
                        >
                          {item.title}
                        </Link>
                      </div>
                    </td>

                    {/* 4. Danh mục (CHỮ CÓ MÀU, KHÔNG DÙNG NỀN BACKGROUND) */}
                    <td className="px-3 py-2.5 text-center align-middle overflow-hidden whitespace-nowrap">
                      <span className={`text-[12px] tracking-tight ${categoryStyle.className}`}>
                        {categoryStyle.label}
                      </span>
                    </td>

                    {/* 5. Tác giả */}
                    <td className="px-3 py-2.5 text-left align-middle text-slate-700 text-[12px] truncate overflow-hidden">
                      <span title={item.authorName || '—'}>{item.authorName || '—'}</span>
                    </td>

                    {/* 6. Ngày xuất bản */}
                    <td className="px-3 py-2.5 text-center align-middle text-slate-600 text-[11px] whitespace-nowrap overflow-hidden">
                      <span>{item.publishedAt ? fmtDate(item.publishedAt) : 'Chưa đăng'}</span>
                    </td>

                    {/* 7. Cập nhật lần cuối */}
                    <td className="px-3 py-2.5 text-center align-middle text-slate-600 text-[11px] whitespace-nowrap overflow-hidden">
                      <span title={fmtDateTime(item.updatedAt)}>{fmtDate(item.updatedAt)}</span>
                    </td>

                    {/* 8. Trạng thái (ĐÃ CHUYỂN XUỐNG TRƯỚC PHẦN THAO TÁC) */}
                    <td className="px-3 py-2.5 text-center align-middle overflow-hidden whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusMeta.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                        <span>{statusMeta.label}</span>
                      </span>
                    </td>

                    {/* 9. Thao tác */}
                    <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 justify-center">
                        {/* Xem bài viết công khai */}
                        <Link
                          to={`/news/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-7 w-7 rounded-full bg-[#e8f3ff] text-[#0866db] hover:bg-[#1683ff] hover:text-white border border-[#dceafd] hover:border-[#1683ff] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                          title="Xem bài viết trên cổng thông tin"
                        >
                          <Eye size={13} />
                        </Link>

                        {/* Sửa bài viết */}
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/articles/${item.id}/edit`)}
                          className="h-7 w-7 rounded-full bg-slate-50 text-slate-600 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                          title="Chỉnh sửa bài viết"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Đăng bài (Draft -> Publish) */}
                        {item.status === 'Draft' && (
                          <button
                            type="button"
                            onClick={() => onAction('publish', item)}
                            className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                            title="Đăng bài viết"
                          >
                            <Globe size={13} />
                          </button>
                        )}

                        {/* Gỡ đăng (Published -> Draft) */}
                        {item.status === 'Published' && (
                          <button
                            type="button"
                            onClick={() => onAction('unpublish', item)}
                            className="h-7 w-7 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white border border-amber-200 hover:border-amber-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                            title="Gỡ đăng về bản nháp"
                          >
                            <EyeOff size={13} />
                          </button>
                        )}

                        {/* Lưu trữ (Draft / Published -> Archive) */}
                        {(item.status === 'Draft' || item.status === 'Published') && (
                          <button
                            type="button"
                            onClick={() => onAction('archive', item)}
                            className="h-7 w-7 rounded-full bg-slate-50 text-slate-500 hover:bg-amber-500 hover:text-white border border-slate-200 hover:border-amber-500 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                            title="Chuyển vào lưu trữ"
                          >
                            <Archive size={13} />
                          </button>
                        )}

                        {/* Khôi phục (Archived -> Draft) */}
                        {item.status === 'Archived' && (
                          <button
                            type="button"
                            onClick={() => onAction('restore', item)}
                            className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                            title="Khôi phục bài viết"
                          >
                            <Undo2 size={13} />
                          </button>
                        )}

                        {/* Xoá vĩnh viễn (Chỉ xóa bài Draft chưa xuất bản lần nào) */}
                        {item.status === 'Draft' && !item.publishedAt && (
                          <button
                            type="button"
                            onClick={() => onAction('delete', item)}
                            className="h-7 w-7 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                            title="Xoá vĩnh viễn bài viết"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 sm:px-4 pt-3 pb-2 text-[11px] text-slate-500 font-inter">
        <span className="font-normal">
          Tổng số: <span className="font-semibold text-slate-700">{total}</span>
        </span>

        <div className="flex-1" />

        <label className="inline-flex items-center gap-1.5 font-normal">
          Số dòng/trang
          <span className="relative inline-flex items-center">
            <select
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="appearance-none h-7 pl-2.5 pr-7 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-600 cursor-pointer hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all font-inter"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </span>
        </label>

        <span className="font-medium text-slate-600 tabular-nums whitespace-nowrap">
          {rangeFrom} - {rangeTo}
        </span>

        <div className="inline-flex items-center gap-0.5">
          <button
            type="button"
            disabled={canPrev}
            onClick={() => onPageChange(1)}
            title="Trang đầu"
            className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronsLeft size={13} />
          </button>
          <button
            type="button"
            disabled={canPrev}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            title="Trang trước"
            className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            disabled={canNext}
            onClick={() => onPageChange(page + 1)}
            title="Trang sau"
            className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight size={13} />
          </button>
          <button
            type="button"
            disabled={canNext}
            onClick={() => onPageChange(totalPages)}
            title="Trang cuối"
            className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
