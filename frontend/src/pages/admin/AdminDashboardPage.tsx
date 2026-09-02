import {
  AlertTriangle,
  Download,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import { useAdminDashboard } from '../../hooks/admin/useAdminDashboard';
import {
  ActivityFeedCard,
  ApprovalFunnelCard,
  CollectiveUnitsCard,
  DashboardFilterBar,
  DashboardKpiGrid,
  DepartmentRankingsTable,
  StandardBottleneckCard,
  StatusDonutChart,
  UrgentApplicationsCard,
} from '../../components/admin/dashboard';

export function AdminDashboardPage() {
  const {
    filters,
    sortKey,
    sortDesc,
    data,
    isPending,
    isError,
    refetch,
    sortedRankings,
    updateFilter,
    sortBy,
    exportCsv,
  } = useAdminDashboard();

  return (
    <div className="w-full space-y-5 animate-fade-in print:space-y-4">
      {/* Page Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight m-0">
            Tổng quan Sinh viên 5 tốt
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl m-0 font-normal">
            Theo dõi tiến độ xét duyệt, nhận diện điểm nghẽn và xử lý hồ sơ đúng hạn.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 print:hidden">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Xuất Excel</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            <FileCheck2 size={14} />
            <span>Xuất PDF</span>
          </button>
        </div>
      </section>

      {/* Filter Bar */}
      <DashboardFilterBar filters={filters} onUpdateFilter={updateFilter} />

      {/* Loading Skeleton */}
      {isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5" role="status">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <section className="p-4 sm:p-5 flex items-center justify-between gap-4 text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
            <div>
              <strong className="block text-sm font-bold">Không thể tải báo cáo</strong>
              <span className="text-xs text-amber-700">Vui lòng thử lại sau ít phút.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded-xl hover:bg-amber-100/50 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Thử lại</span>
          </button>
        </section>
      )}

      {/* Main Dashboard Data */}
      {data && (
        <>
          {/* 1. KPIs */}
          <DashboardKpiGrid kpis={data.kpis} />

          {/* 2. Donut & Standards Bottlenecks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatusDonutChart items={data.status} />
            <StandardBottleneckCard standards={data.standards} />
          </div>

          {/* 3. Funnel & Urgent Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ApprovalFunnelCard funnel={data.funnel} />
            <UrgentApplicationsCard urgent={data.urgent} />
          </div>

          {/* 4. Department Performance Rankings */}
          <DepartmentRankingsTable
            rankings={sortedRankings}
            sortKey={sortKey}
            sortDesc={sortDesc}
            onSortBy={sortBy}
          />

          {/* 5. Activity Feed & Collective Units */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ActivityFeedCard activities={data.activities} />
            </div>
            <div>
              <CollectiveUnitsCard collective={data.collective} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
