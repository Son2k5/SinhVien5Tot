import { createPortal } from 'react-dom';
import { StandardSetStatus, type StandardSetResponse } from '../types/standard.types';
import { Edit2, Eye, RotateCcw, Trash2, Upload } from 'lucide-react';

export interface StandardSetActionMenuProps {
  menuOpenFor: {
    item: StandardSetResponse;
    top: number;
    left: number;
  } | null;
  onClose: () => void;
  onNavigateDetail: (id: string) => void;
  onOpenPublish: (item: StandardSetResponse) => void;
  onOpenEdit: (item: StandardSetResponse) => void;
  onOpenDelete: (item: StandardSetResponse) => void;
  onOpenUnpublish: (item: StandardSetResponse) => void;
}

export function StandardSetActionMenu({
  menuOpenFor,
  onClose,
  onNavigateDetail,
  onOpenPublish,
  onOpenEdit,
  onOpenDelete,
  onOpenUnpublish,
}: StandardSetActionMenuProps) {
  if (!menuOpenFor) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: menuOpenFor.top,
        left: menuOpenFor.left,
        zIndex: 9999,
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-[195px] bg-white rounded-xl border border-slate-200/90 shadow-xl py-1.5 px-1 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {/* 1. Xem chi tiết */}
      <button
        type="button"
        onClick={() => {
          const id = menuOpenFor.item.id;
          onClose();
          onNavigateDetail(id);
        }}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50/70 hover:text-[#1683ff] rounded-lg transition-colors cursor-pointer group"
      >
        <Eye size={14} className="text-blue-500 group-hover:text-[#1683ff] shrink-0" />
        <span>Xem chi tiết</span>
      </button>

      {/* Khi ở trạng thái Bản nháp (Draft) */}
      {menuOpenFor.item.status === StandardSetStatus.Draft && (
        <>
          <button
            type="button"
            onClick={() => {
              const it = menuOpenFor.item;
              onClose();
              onOpenPublish(it);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer group"
          >
            <Upload size={14} className="text-emerald-600 group-hover:text-emerald-700 shrink-0" />
            <span>Công bố bộ tiêu chuẩn</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const it = menuOpenFor.item;
              onClose();
              onOpenEdit(it);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors cursor-pointer group"
          >
            <Edit2 size={14} className="text-slate-500 group-hover:text-slate-700 shrink-0" />
            <span>Chỉnh sửa thông tin</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={() => {
              const it = menuOpenFor.item;
              onClose();
              onOpenDelete(it);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer group"
          >
            <Trash2 size={14} className="text-rose-500 group-hover:text-rose-600 shrink-0" />
            <span>Xóa bộ tiêu chuẩn</span>
          </button>
        </>
      )}

      {/* Khi ở trạng thái Đã công bố (Published) */}
      {menuOpenFor.item.status === StandardSetStatus.Published && (
        <button
          type="button"
          onClick={() => {
            const it = menuOpenFor.item;
            onClose();
            onOpenUnpublish(it);
          }}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 hover:text-amber-800 rounded-lg transition-colors cursor-pointer group"
        >
          <RotateCcw size={14} className="text-amber-600 group-hover:text-amber-700 shrink-0" />
          <span>Hoàn lại về nháp</span>
        </button>
      )}
    </div>,
    document.body,
  );
}
