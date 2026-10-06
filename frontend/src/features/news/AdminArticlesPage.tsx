import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAdminArticles, useChangeArticleStatus, useDeleteArticle } from './hooks/useNews';
import { newsService as newsApi } from './services/news.service';
import type { AdminArticleListItem } from './types/news.types';
import { AdminConfirmDialog } from '../../components/admin/common/AdminConfirmDialog';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import { ArticleStatCards } from './components/ArticleStatCards';
import { ArticleFilterToolbar } from './components/ArticleFilterToolbar';
import { ArticleTable } from './components/ArticleTable';
import { BatchDeleteArticleDialog } from './components/BatchDeleteArticleDialog';
import { Plus, RefreshCw, Trash2, X } from 'lucide-react';

const DEFAULT_PAGE_SIZE = 10;

const CATEGORY_OPTIONS: Record<string, string> = {
  '': 'Tất cả danh mục',
  'News': 'Tin tức',
  'Announcement': 'Thông báo',
  'Event': 'Sự kiện',
};

const STATUS_OPTIONS: Record<string, string> = {
  '': 'Tất cả trạng thái',
  'Draft': 'Bản nháp',
  'Published': 'Đã xuất bản',
  'Archived': 'Lưu trữ',
};

export function AdminArticlesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Sorting state (client-side)
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Multi-selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Banner notification feedback
  const [banner, setBanner] = useState<{ ok: boolean; msg: string } | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  // Sync URL search params
  useEffect(() => {
    const p = new URLSearchParams();
    if (debouncedQ) p.set('q', debouncedQ);
    if (category) p.set('category', category);
    if (status) p.set('status', status);
    if (page > 1) p.set('page', String(page));
    setSearchParams(p, { replace: true });
  }, [debouncedQ, category, status, page, setSearchParams]);

  // Fetch articles
  const { data, isLoading, isError, error, refetch } = useAdminArticles({
    q: debouncedQ || undefined,
    category: category || undefined,
    status: status || undefined,
    page,
    pageSize,
  });

  const changeStatusMutation = useChangeArticleStatus();
  const deleteMutation = useDeleteArticle();

  // Single Action Dialog State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'publish' | 'unpublish' | 'archive' | 'restore' | 'delete' | null;
    id: string;
    title: string;
  }>({ isOpen: false, type: null, id: '', title: '' });

  const handleAction = (
    type: 'publish' | 'unpublish' | 'archive' | 'restore' | 'delete',
    item: AdminArticleListItem
  ) => {
    setConfirmState({ isOpen: true, type, id: item.id, title: item.title });
  };

  const confirmAction = async () => {
    if (!confirmState.type) return;
    try {
      if (confirmState.type === 'delete') {
        await deleteMutation.mutateAsync(confirmState.id);
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(confirmState.id);
          return next;
        });
        setBanner({ ok: true, msg: `Đã xóa vĩnh viễn bài viết "${confirmState.title}".` });
      } else {
        await changeStatusMutation.mutateAsync({ id: confirmState.id, action: confirmState.type });
        const labels: Record<string, string> = {
          publish: 'Đã xuất bản bài viết thành công.',
          unpublish: 'Đã gỡ bài viết về bản nháp.',
          archive: 'Đã lưu trữ bài viết.',
          restore: 'Đã khôi phục bài viết về bản nháp.',
        };
        setBanner({ ok: true, msg: labels[confirmState.type] || 'Thao tác thành công.' });
      }
      setConfirmState((prev) => ({ ...prev, isOpen: false }));
    } catch {
      setBanner({ ok: false, msg: 'Thao tác thất bại. Vui lòng thử lại.' });
    }
  };

  const getConfirmDialogProps = () => {
    const props: {
      title: string;
      description: string;
      confirmText: string;
      variant: 'warning' | 'danger' | 'info';
    } = {
      title: '',
      description: '',
      confirmText: 'Xác nhận',
      variant: 'warning',
    };
    switch (confirmState.type) {
      case 'publish':
        props.title = 'Đăng bài viết';
        props.description = `Bạn có chắc chắn muốn đăng bài viết "${confirmState.title}"? Bài viết sẽ hiển thị công khai trên cổng thông tin.`;
        props.variant = 'info';
        props.confirmText = 'Đăng bài';
        break;
      case 'unpublish':
        props.title = 'Gỡ đăng bài viết';
        props.description = `Bài viết "${confirmState.title}" sẽ bị gỡ xuống và chuyển thành Bản nháp. Độc giả sẽ không còn nhìn thấy bài viết này nữa.`;
        props.variant = 'warning';
        props.confirmText = 'Gỡ đăng';
        break;
      case 'archive':
        props.title = 'Lưu trữ bài viết';
        props.description = `Bài viết "${confirmState.title}" sẽ được chuyển vào mục lưu trữ và không còn hiển thị công khai.`;
        props.variant = 'warning';
        props.confirmText = 'Lưu trữ';
        break;
      case 'restore':
        props.title = 'Khôi phục bài viết';
        props.description = `Khôi phục bài viết "${confirmState.title}" về trạng thái Bản nháp để có thể tiếp tục chỉnh sửa hoặc đăng lại?`;
        props.variant = 'info';
        props.confirmText = 'Khôi phục';
        break;
      case 'delete':
        props.title = 'Xoá vĩnh viễn bài viết';
        props.description = `Bạn sắp xoá vĩnh viễn bài viết "${confirmState.title}". Hành động này không thể hoàn tác.`;
        props.variant = 'danger';
        props.confirmText = 'Xoá vĩnh viễn';
        break;
    }
    return props;
  };

  // Selection handlers
  const toggleSelectOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(items.map((i) => i.id)));
    } else {
      setSelected(new Set());
    }
  };

  // Batch delete handler
  const handleBatchDeleteConfirm = async () => {
    if (selected.size === 0) return;
    setIsBatchDeleting(true);
    const ids = Array.from(selected);

    try {
      const results = await Promise.allSettled(ids.map((id) => newsApi.deleteArticle(id)));
      const succeededIds: string[] = [];
      let failCount = 0;

      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          succeededIds.push(ids[idx]);
        } else {
          failCount++;
        }
      });

      setSelected((prev) => {
        const next = new Set(prev);
        succeededIds.forEach((id) => next.delete(id));
        return next;
      });

      await refetch();
      setIsBatchDeleteOpen(false);

      if (failCount === 0) {
        setBanner({
          ok: true,
          msg: `Đã xóa vĩnh viễn thành công ${succeededIds.length} bài viết.`,
        });
      } else if (succeededIds.length > 0) {
        setBanner({
          ok: true,
          msg: `Đã xóa ${succeededIds.length} bài viết. Có ${failCount} bài không thể xóa do không phải bài nháp chưa xuất bản.`,
        });
      } else {
        setBanner({
          ok: false,
          msg: `Không thể xóa bài viết đã chọn. Chỉ có bài nháp chưa từng xuất bản mới có thể xóa vĩnh viễn.`,
        });
      }
    } catch {
      setBanner({ ok: false, msg: 'Đã xảy ra lỗi trong quá trình xóa hàng loạt.' });
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Client-side sorted items
  const items = data?.items ?? [];
  const sortedItems = useMemo(() => {
    if (!items.length) return [];
    const list = [...items];
    return list.sort((a, b) => {
      let aVal: any = a[sortBy as keyof AdminArticleListItem] ?? '';
      let bVal: any = b[sortBy as keyof AdminArticleListItem] ?? '';
      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal, 'vi');
        return sortDir === 'asc' ? cmp : -cmp;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortBy, sortDir]);

  const toggleSort = (colKey: string) => {
    if (sortBy === colKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(colKey);
      setSortDir('asc');
    }
  };

  const resetFilters = () => {
    setQ('');
    setDebouncedQ('');
    setCategory('');
    setStatus('');
    setPage(1);
    setSelected(new Set());
  };

  const total = data?.total ?? 0;
  const publishedCount = items.filter((i) => i.status === 'Published').length;
  const draftCount = items.filter((i) => i.status === 'Draft').length;
  const archivedCount = items.filter((i) => i.status === 'Archived').length;
  const hasActiveFilters = Boolean(debouncedQ || category || status);

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-10 font-inter">
      {/* Header */}
      <AdminPageHeader
        title="Quản lý tin tức & sự kiện"
        description="Quản lý danh sách bài viết, tin tức, thông báo và sự kiện trên hệ thống."
        actions={
          <>
            {/* Nút xóa nhiều bài viết khi có checkbox được chọn */}
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setIsBatchDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-normal shadow-xs hover:bg-rose-600 hover:text-white hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer font-inter"
              >
                <Trash2 size={13} strokeWidth={1.8} />
                <span>Xóa đã chọn ({selected.size})</span>
              </button>
            )}

            <Link
              to="/admin/articles/new"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-medium shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer font-inter"
            >
              <Plus size={14} strokeWidth={2} />
              <span>Viết bài mới</span>
            </Link>

            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#a6cffb] text-[#244a7d] text-xs font-normal shadow-xs hover:bg-[#8fbff9] hover:text-[#1a3a65] hover:shadow-sm active:scale-[0.98] transition-[background-color,color,box-shadow] cursor-pointer font-inter"
            >
              <RefreshCw size={13} strokeWidth={1.8} className={isLoading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </>
        }
      />

      {/* Banner Feedback */}
      {banner && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 font-inter ${
            banner.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <span>{banner.msg}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="p-1 hover:bg-white/60 rounded cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 4 Thẻ thống kê bài viết */}
      <ArticleStatCards
        total={total}
        publishedCount={publishedCount}
        draftCount={draftCount}
        archivedCount={archivedCount}
      />

      {/* Unified Card: Filter Toolbar + Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.18)] overflow-hidden">
        {/* Bộ lọc bài viết */}
        <ArticleFilterToolbar
          search={q}
          onSearchChange={setQ}
          category={category}
          onCategoryChange={setCategory}
          status={status}
          onStatusChange={setStatus}
          debouncedSearch={debouncedQ}
          onResetFilters={resetFilters}
          categoryOptions={CATEGORY_OPTIONS}
          statusOptions={STATUS_OPTIONS}
        />

        {/* Divider ngăn cách Filter và Table */}
        <div className="flex items-center gap-2 px-2 sm:px-6 pt-0 pb-2.5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
        </div>

        {/* Bảng bài viết */}
        <ArticleTable
          items={sortedItems}
          total={total}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          selected={selected}
          onToggleSelectOne={toggleSelectOne}
          onToggleSelectAll={toggleSelectAll}
          sortBy={sortBy}
          sortDir={sortDir}
          onToggleSort={toggleSort}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          onAction={handleAction}
          onResetFilters={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Dialog xác nhận hành động đơn lẻ (Publish / Unpublish / Archive / Restore / Delete) */}
      <AdminConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmAction}
        isLoading={changeStatusMutation.isPending || deleteMutation.isPending}
        {...getConfirmDialogProps()}
      />

      {/* Dialog xác nhận xóa hàng loạt bài viết */}
      <BatchDeleteArticleDialog
        isOpen={isBatchDeleteOpen}
        selectedCount={selected.size}
        isLoading={isBatchDeleting}
        onClose={() => setIsBatchDeleteOpen(false)}
        onConfirm={handleBatchDeleteConfirm}
      />
    </div>
  );
}

export default AdminArticlesPage;
