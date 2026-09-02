export interface FunnelStageItem {
  label: string;
  value: number;
  width: number;
}

interface ApprovalFunnelCardProps {
  funnel: FunnelStageItem[];
}

export function ApprovalFunnelCard({ funnel }: ApprovalFunnelCardProps) {
  return (
    <section className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-slate-800 m-0">Phễu theo cấp xét duyệt</h2>
      </header>

      <div className="space-y-2 pt-2">
        {funnel.map((item, index) => {
          const nextItem = funnel[index + 1];
          const dropOff = nextItem
            ? Math.round((1 - nextItem.value / item.value) * 100)
            : null;

          return (
            <div key={item.label} className="relative flex items-center justify-between">
              <div
                className="min-h-9 px-3 flex items-center justify-between text-white rounded-xl bg-gradient-to-r from-blue-500 to-sky-400 text-xs font-semibold shadow-xs transition-all hover:brightness-105"
                style={{ width: `${Math.max(item.width, 35)}%` }}
              >
                <span className="truncate pr-2">{item.label}</span>
                <strong className="text-xs">{item.value.toLocaleString('vi-VN')}</strong>
              </div>

              {dropOff !== null && (
                <span className="text-[11px] font-bold text-rose-500 pl-2">
                  ↓ {dropOff}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
