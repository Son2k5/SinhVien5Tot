import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useBlocker, Link } from 'react-router-dom';
import { useAdminArticle, useCreateArticle, useUpdateArticle, useChangeArticleStatus } from './hooks/useNews';
import { ArticleBlockEditor } from './ArticleBlockEditor';
import type { EditorBlock } from './ArticleBlockEditor';
import { ArticleBlockRenderer } from './ArticleBlockRenderer';
import { AdminConfirmDialog } from '../../components/admin/common/AdminConfirmDialog';
import { ArrowLeft, Save, Send, Eye, Edit2, AlertCircle, Pin, Tag } from 'lucide-react';

const CATEGORIES = [
  { value: 'News', label: 'Tin tức' },
  { value: 'Announcement', label: 'Thông báo' },
  { value: 'Event', label: 'Sự kiện' },
];

export function AdminArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();

  const { data: article, isLoading } = useAdminArticle(id || '');
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const changeStatusMutation = useChangeArticleStatus();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState<'News' | 'Announcement' | 'Event'>('News');
  const [isPinned, setIsPinned] = useState(false);
  const [coverImageId, setCoverImageId] = useState<string>('');
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [rowVersion, setRowVersion] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isUploading, setIsUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Dialogs state
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Init form
  useEffect(() => {
    if (!isNew && article) {
      setTitle(article.title);
      setExcerpt(article.excerpt);
      setCategory(article.category);
      setIsPinned(article.isPinned);
      setCoverImageId(article.coverImageId || '');
      setRowVersion(article.rowVersion);
      setBlocks(article.blocks.map(b => ({ ...b, _id: Math.random().toString(36).slice(2, 9) })) as EditorBlock[]);
      setIsDirty(false); // Reset dirty flag after loading
    }
  }, [isNew, article]);

  // Handle Dirty State
  const handleBlocksChange = useCallback((newBlocks: EditorBlock[]) => {
    setBlocks(newBlocks);
    setIsDirty(true);
  }, []);

  const handleChange = (setter: any) => (e: any) => {
    setter(e.target.type === 'checkbox' ? e.target.checked : e.target.value);
    setIsDirty(true);
  };

  // Prevent leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  const availableCoverImages = useMemo(() => {
    return blocks.filter(b => b.type === 'Image' && b.url).map(b => b as Extract<EditorBlock, { type: 'Image' }>);
  }, [blocks]);

  useEffect(() => {
    if (coverImageId && !availableCoverImages.some(img => img.imageId === coverImageId)) {
      setCoverImageId('');
    }
  }, [availableCoverImages, coverImageId]);

  const validate = (isPublishing: boolean) => {
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề bài viết.');
      return false;
    }
    if (title.length > 200) {
      setErrorMsg('Tiêu đề không được vượt quá 200 ký tự.');
      return false;
    }
    if (excerpt.length > 300) {
      setErrorMsg('Tóm tắt không được vượt quá 300 ký tự.');
      return false;
    }

    const hasContent = blocks.some(b => {
      if (b.type === 'Heading' || b.type === 'Paragraph' || b.type === 'Quote') return !!b.text.trim();
      if (b.type === 'List') return b.items.some(i => !!i.trim());
      if (b.type === 'Image') return !!b.url;
      return false;
    });

    if (isPublishing && !hasContent) {
      setErrorMsg('Vui lòng thêm ít nhất một khối nội dung.');
      return false;
    }

    setErrorMsg('');
    return true;
  };

  const handleSave = async (publish: boolean) => {
    if (!validate(publish)) return;

    const requestBlocks = blocks.map(b => {
      if (b.type === 'Image') {
        return { type: 'Image', imageId: b.imageId, alt: b.alt, caption: b.caption };
      }
      const { _id, _upload, ...rest } = b as any;
      return rest;
    });

    const autoCoverImageId = coverImageId || availableCoverImages[0]?.imageId || undefined;

    const requestData = {
      title,
      excerpt,
      category,
      isPinned,
      coverImageId: autoCoverImageId,
      blocks: requestBlocks as any
    };

    try {
      let savedId = id;
      if (isNew) {
        const data = await createMutation.mutateAsync(requestData);
        savedId = data.id;
        setRowVersion(data.rowVersion);
      } else {
        const data = await updateMutation.mutateAsync({ id: id, request: { ...requestData, rowVersion } });
        setRowVersion(data.rowVersion);
      }

      setIsDirty(false); // Mark as clean before potentially navigating or changing status

      if (publish && savedId) {
        try {
          await changeStatusMutation.mutateAsync({ id: savedId, action: 'publish' });
          navigate('/admin/articles');
        } catch {
          setErrorMsg('Lưu thành công nhưng không thể Đăng bài (lỗi phía máy chủ). Bài viết hiện đang ở trạng thái Nháp.');
          if (isNew) navigate(`/admin/articles/${savedId}/edit`, { replace: true });
        }
      } else {
        if (isNew) navigate(`/admin/articles/${savedId}/edit`, { replace: true });
        else setErrorMsg('Lưu thành công!');
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictDialogOpen(true);
      } else {
        setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi lưu bài viết.');
      }
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending || changeStatusMutation.isPending;

  if (!isNew && isLoading) return <div className="p-12 text-center text-slate-500 font-medium">Đang tải dữ liệu bài viết...</div>;

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 min-h-full bg-white flex flex-col flex-1 font-['Be_Vietnam_Pro',_sans-serif]">
      {/* Topbar: Edge to edge */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link 
            to="/admin/articles" 
            className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" 
            aria-label="Quay lại"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight">
              {isNew ? 'Viết bài mới' : 'Chỉnh sửa bài viết'}
            </h1>
            {isDirty ? (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Chưa lưu
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Đã lưu
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${viewMode === 'edit' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Edit2 size={15} /> <span className="hidden sm:inline">Soạn thảo</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${viewMode === 'preview' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Eye size={15} /> <span className="hidden sm:inline">Xem trước</span>
            </button>
          </div>
          
          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving || isUploading}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Save size={15} /> <span className="hidden sm:inline">Lưu nháp</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving || isUploading}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Send size={15} /> <span className="hidden sm:inline">Đăng bài</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mx-4 sm:mx-8 lg:mx-16 mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2.5 text-sm font-medium">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Main Canvas: Full width background, elegant content flow */}
      <div className="flex-1 overflow-y-auto w-full py-8 sm:py-10 px-4 sm:px-8">
        <div className="w-full">
          {viewMode === 'edit' ? (
            <div className="space-y-6">
              {/* Meta bar: Category + Pin (No cover image dropdown, compact and clean) */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Tag size={14} className="text-blue-600" />
                    <span>Danh mục:</span>
                  </div>
                  <select
                    value={category}
                    onChange={handleChange(setCategory)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-xs font-medium text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={handleChange(setIsPinned)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <Pin size={13} className={isPinned ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
                  <span>Ghim bài viết </span>
                </label>
              </div>

              {/* Title Input: Seamless, large, expressive heading */}
              <div className="space-y-2 pt-2 pb-6 border-b border-dashed border-slate-300">
                <textarea
                  value={title}
                  onChange={handleChange(setTitle)}
                  placeholder="Tiêu đề bài viết..."
                  maxLength={200}
                  rows={1}
                  className="w-full font-['Arial',sans-serif] text-[28px] sm:text-[32px] font-semibold text-slate-900 placeholder:text-slate-300 border-none outline-none focus:ring-0 leading-[1.35] bg-transparent px-0 py-1 resize-none"
                  onInput={(e: any) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
                <div className="flex justify-end text-[11px] text-slate-400 font-medium">
                  {title.length}/200 ký tự
                </div>
              </div>

              {/* Excerpt / Summary: Styled like an article lead */}
              <div className="space-y-1.5 pb-6 border-b border-dashed border-slate-300">
                <textarea
                  value={excerpt}
                  onChange={handleChange(setExcerpt)}
                  placeholder="Viết tóm tắt ngắn cho bài viết (tuỳ chọn - nếu để trống hệ thống sẽ tự trích đoạn đầu tiên)..."
                  rows={2}
                  maxLength={300}
                  className="w-full font-['Arial',sans-serif] text-[14px] font-normal text-slate-600 placeholder:text-slate-400 border-none outline-none focus:ring-0 bg-transparent resize-none leading-[1.8] px-0 py-1"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Tóm tắt sẽ hiển thị trên trang tin tức và thẻ chia sẻ</span>
                  <span>{excerpt.length}/300 ký tự</span>
                </div>
              </div>

              {/* Blocks Editor: Continuous document flow, no boxed borders */}
              <div className="min-h-[450px] rounded-xl border border-dashed border-slate-300 bg-slate-50/30 p-3 sm:p-4">
                <ArticleBlockEditor 
                  value={blocks} 
                  onChange={handleBlocksChange}
                  onUploadingChange={setIsUploading} 
                />
              </div>
            </div>
          ) : (
            /* Preview Mode */
            <div className="space-y-8 pt-2 pb-16">
              <div className="space-y-4 pb-6 border-b border-slate-100">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                  <Tag size={12} />
                  <span>{CATEGORIES.find(c => c.value === category)?.label || 'Tin tức'}</span>
                </div>
                <h1 className="font-['Arial',sans-serif] text-[28px] sm:text-[32px] font-semibold text-slate-900 leading-[1.35]">
                  {title || 'Chưa có tiêu đề'}
                </h1>
                {excerpt && (
                  <p className="font-['Arial',sans-serif] text-[14px] font-normal text-slate-600 leading-[1.8] italic">
                    {excerpt}
                  </p>
                )}
              </div>

              <div className="font-['Arial',sans-serif] text-[14px] font-normal text-slate-800 leading-[1.8]">
                <ArticleBlockRenderer blocks={blocks.map(b => {
                  if (b.type === 'Image') return { ...b, url: b._upload?.previewUrl || b.url };
                  return b;
                }) as any} />
              </div>
            </div>
          )}
        </div>
      </div>

      <AdminConfirmDialog
        isOpen={conflictDialogOpen}
        onClose={() => setConflictDialogOpen(false)}
        onConfirm={() => window.location.reload()}
        title="Bài viết đã bị thay đổi"
        description="Bài viết này đã được chỉnh sửa bởi một người khác kể từ khi bạn mở trang này. Nếu bạn tiếp tục, bản nháp hiện tại của bạn sẽ bị mất."
        confirmText="Tải lại bản mới"
        cancelText="Ở lại"
        variant="warning"
      />

      {blocker.state === 'blocked' && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => blocker.reset?.()}
          onConfirm={() => blocker.proceed?.()}
          title="Bạn có thay đổi chưa lưu"
          description="Bạn có chắc chắn muốn rời khỏi trang này? Mọi thay đổi chưa được lưu sẽ bị mất."
          confirmText="Rời khỏi"
          cancelText="Ở lại"
          variant="danger"
        />
      )}
    </div>
  );
}
