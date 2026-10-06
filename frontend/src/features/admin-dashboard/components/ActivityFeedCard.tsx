export interface DashboardActivityItem {
  reviewerName: string;
  reviewerInitials: string;
  action: string;
  target: string;
  createdAtUtc: string;
}

interface ActivityFeedCardProps {
  activities: DashboardActivityItem[];
}

function relativeTime(createdAtUtc: string): string {
  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(createdAtUtc).getTime()) / 60_000),
  );
  return minutes < 60 ? `${minutes} phút trước` : `${Math.round(minutes / 60)} giờ trước`;
}

export function ActivityFeedCard({ activities }: ActivityFeedCardProps) {
  return (
    <section className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800 m-0">Hoạt động gần đây</h2>
        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          Xem tất cả
        </button>
      </header>

      <div className="divide-y divide-slate-100">
        {activities.map((item) => (
          <article
            key={item.createdAtUtc}
            className="py-3 flex items-start gap-3 first:pt-0 last:pb-0"
          >
            <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {item.reviewerInitials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-700 leading-snug">
                <strong className="font-semibold text-slate-900">{item.reviewerName}</strong>{' '}
                {item.action} · {item.target}
              </p>
              <small className="text-[11px] text-slate-400">
                {relativeTime(item.createdAtUtc)}
              </small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
