import { Clock3, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface UrgentApplicationItem {
  applicationId: string;
  studentName: string;
  deadlineAtUtc: string;
  urgencyLabel: string;
}

interface UrgentApplicationsCardProps {
  urgent: UrgentApplicationItem[];
}

export function UrgentApplicationsCard({ urgent }: UrgentApplicationsCardProps) {
  const navigate = useNavigate();

  return (
    <section className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800 m-0">Cần xử lý gấp</h2>
        <span className="px-2 py-0.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
          {urgent.length} việc
        </span>
      </header>

      <div className="divide-y divide-slate-100">
        {urgent.map((item) => {
          const isOverdue = new Date(item.deadlineAtUtc) <= new Date();

          return (
            <article
              key={item.applicationId}
              className="py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isOverdue
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  <Clock3 size={16} />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {item.studentName}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {item.applicationId} · {item.urgencyLabel}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/admin/applications?id=${item.applicationId}`)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              >
                <span>Xử lý</span>
                <ChevronRight size={13} />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
