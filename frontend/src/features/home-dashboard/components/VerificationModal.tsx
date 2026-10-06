import { X, Check } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Simple verification modal displayed when the user clicks the "Xác minh hồ sơ"
 * button in the DashboardHeader. It does not perform any API call – the
 * implementation can be extended later. For now it shows a message and a
 * confirm button.
 */
export function VerificationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <h3 className="text-base font-semibold text-slate-800">Xác minh hồ sơ</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Body */}
        <div className="p-6">
          <p className="text-slate-700">Bạn có chắc muốn xác minh hồ sơ này không? Khi xác minh, dữ liệu sẽ được bảo vệ và không thể chỉnh sửa.</p>
        </div>
        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button type="button" onClick={onClose} className="btn-compact-outline">
            Hủy
          </button>
          <button type="button" onClick={onClose} className="btn-compact">
            <Check className="w-4 h-4" /> Xác minh
          </button>
        </div>
      </div>
    </div>
  );
}
