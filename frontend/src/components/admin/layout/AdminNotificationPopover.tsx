import { Link, useNavigate } from 'react-router-dom';
import { FilePlus2, ShieldCheck } from 'lucide-react';

interface AdminNotificationPopoverProps {
  onClose: () => void;
}

export function AdminNotificationPopover({ onClose }: AdminNotificationPopoverProps) {
  const navigate = useNavigate();

  return (
    <div className="absolute z-50 top-full right-0 mt-2 w-80 p-2 bg-white border border-slate-200 rounded-2xl shadow-xl animate-fade-in">
      <div className="p-2.5 flex items-center justify-between border-b border-slate-100">
        <span className="text-xs font-bold text-slate-900">Thông báo mới</span>
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600">
          3 mới
        </span>
      </div>

      <div className="py-1 divide-y divide-slate-100">
        <button
          type="button"
          onClick={() => {
            navigate('/admin/applications');
            onClose();
          }}
          className="w-full p-2.5 flex items-start gap-3 hover:bg-slate-50 rounded-xl text-left transition-colors cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0 mt-0.5">
            <FilePlus2 size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-800">
              12 hồ sơ vừa được nộp
            </div>
            <div className="text-[10px] text-slate-400">5 phút trước</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            navigate('/admin/evidence');
            onClose();
          }}
          className="w-full p-2.5 flex items-start gap-3 hover:bg-slate-50 rounded-xl text-left transition-colors cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 flex-shrink-0 mt-0.5">
            <ShieldCheck size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-800">
              Minh chứng cần duyệt gấp
            </div>
            <div className="text-[10px] text-slate-400">Hạn xử lý còn 2 ngày</div>
          </div>
        </button>
      </div>

      <Link
        to="/admin/applications"
        onClick={onClose}
        className="block text-center py-2 text-xs font-bold text-blue-600 hover:text-blue-700 border-t border-slate-100"
      >
        Xem tất cả thông báo
      </Link>
    </div>
  );
}
