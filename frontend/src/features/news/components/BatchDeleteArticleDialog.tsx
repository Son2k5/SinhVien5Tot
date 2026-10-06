import { AlertTriangle, Loader2, X, Trash2 } from 'lucide-react';

interface BatchDeleteArticleDialogProps {
  isOpen: boolean;
  selectedCount: number;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function BatchDeleteArticleDialog({
  isOpen,
  selectedCount,
  isLoading = false,
  onClose,
  onConfirm,
}: BatchDeleteArticleDialogProps) {
  if (!isOpen || selectedCount === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-inter"
      role="dialog"
      aria-modal="true"
      aria-label="Xác nhận xóa các bài viết đã chọn"
    >
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1 pr-4">
            <h3 className="text-base font-bold text-slate-900">
              Xác nhận xóa {selectedCount} bài viết?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Bạn sắp xóa vĩnh viễn <b className="text-slate-800">{selectedCount}</b> bài viết đã chọn.
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[12px] text-amber-800 leading-relaxed">
          <p className="font-semibold mb-0.5">Lưu ý quan trọng:</p>
          <p>
            Hệ thống chỉ cho phép xóa vĩnh viễn các bài viết ở trạng thái <b>Bản nháp</b> (chưa từng xuất bản). 
            Đối với các bài viết đã hoặc từng xuất bản, vui lòng sử dụng chức năng <b>Lưu trữ</b>.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 active:scale-[0.98] shadow-sm cursor-pointer transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
