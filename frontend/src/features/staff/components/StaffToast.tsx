import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  text: string;
}

export interface StaffToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export function StaffToast({ toast, onClose }: StaffToastProps) {
  if (!toast) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
      <div
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-lg text-xs font-medium backdrop-blur-md ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : toast.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}
      >
        {toast.type === 'success' ? (
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
        ) : toast.type === 'warning' ? (
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
        ) : (
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
        )}
        <span className="max-w-md">{toast.text}</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded cursor-pointer transition-colors"
          aria-label="Đóng thông báo"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default StaffToast;
