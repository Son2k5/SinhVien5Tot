import { History, Hash, Clock3, AlertCircle, ShieldCheck } from 'lucide-react';
import type { AdminStudentDetail } from '../types/student.types';
import { ROLE_LABELS } from '../types/student.types';
import { ReviewActionLabel } from './StudentBadges';

function fmtDT(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface StudentDetailHistoryTabProps {
  student: AdminStudentDetail;
}

export function StudentDetailHistoryTab({ student }: StudentDetailHistoryTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
      <div className="lg:col-span-2 h-full">
        <section className="bg-white border border-slate-200/70 rounded-2xl shadow-[0_10px_30px_-18px_rgba(15,42,82,0.25)] overflow-hidden flex flex-col h-full">
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-sky-50/60 to-transparent text-[13px] font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
              <History size={15} />
            </span>
            <span>Nhật ký xét duyệt ({student.reviewLogs.length})</span>
          </div>

          {student.reviewLogs.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">Chưa có hoạt động xét duyệt.</p>
          ) : (
            <ol className="relative ml-5 my-4 border-l border-sky-100 space-y-4 pr-4">
              {student.reviewLogs.map((l) => (
                <li key={l.id} className="ml-5 relative">
                  <span className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-[#0b63d6] ring-4 ring-sky-100" />
                  <ReviewActionLabel action={l.action} />
                  <div className="mt-1 text-[11px] text-slate-500">
                    {l.actorName ? `${l.actorName} • ` : ''}
                    {fmtDT(l.createdAt)}
                    {l.note ? ` • ${l.note}` : ''}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="bg-white border border-slate-200/70 rounded-2xl shadow-[0_10px_30px_-18px_rgba(15,42,82,0.25)] overflow-hidden flex flex-col h-full font-inter">
        <header className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5 bg-gradient-to-r from-sky-50/70 to-transparent">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
            <Hash size={16} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-slate-800 tracking-tight">
              Thông tin hệ thống
            </span>
            <span className="block text-[11px] text-slate-400 truncate">
              Ngày tham gia • cập nhật
            </span>
          </span>
        </header>

        <div className="px-4 sm:px-5 py-2 flex-1 font-inter divide-y divide-slate-100 text-[13px]">
          <div className="flex items-center justify-between py-2.5">
            <span className="inline-flex items-center gap-2 text-slate-500">
              <Hash size={13} className="text-sky-500/80" />
              Ảnh đại diện
            </span>
            <span className="text-slate-800 font-normal">
              {student.avatarUrl ? 'Đã có ảnh' : 'Chưa có'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="inline-flex items-center gap-2 text-slate-500">
              <Clock3 size={13} className="text-sky-500/80" />
              Ngày tham gia
            </span>
            <span className="text-slate-800 font-normal">{fmtDT(student.createdAt)}</span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="inline-flex items-center gap-2 text-slate-500">
              <Clock3 size={13} className="text-sky-500/80" />
              Cập nhật lần cuối
            </span>
            <span className="text-slate-800 font-normal">{fmtDT(student.updatedAt)}</span>
          </div>

          {student.isDeleted && (
            <div className="flex items-center justify-between py-2.5">
              <span className="inline-flex items-center gap-2 text-slate-500">
                <AlertCircle size={13} className="text-rose-500" />
                Trạng thái xóa
              </span>
              <span className="text-rose-600 font-normal">{fmtDT(student.deletedAt)}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-2.5">
            <span className="inline-flex items-center gap-2 text-slate-500">
              <ShieldCheck size={13} className="text-sky-500/80" />
              Vai trò
            </span>
            <span className="text-slate-800 font-normal">
              {ROLE_LABELS[student.role] ?? student.role}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
