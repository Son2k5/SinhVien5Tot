import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock3,
  FileText,
  GraduationCap,
  Trophy,
  UsersRound,
} from 'lucide-react';
import {
  adminDashboardService,
  type AdminDashboardFilters,
} from '../../services/admin/adminDashboardService';

const DEFAULT_FILTERS: AdminDashboardFilters = {
  campaign: 'sv5t-2025',
  schoolYear: '2025-2026',
  level: 'school',
  department: 'all',
  from: '2025-09-01',
  to: '2026-05-31',
};

const FUNNEL_WIDTHS = [100, 82, 68, 54, 40, 29];

type SortKey = 'registered' | 'awarded' | 'rate';

/**
 * Quản lý toàn bộ dữ liệu và state cho trang Admin Dashboard.
 * Trích xuất từ AdminDashboardView.tsx.
 *
 * Bao gồm:
 * - Filters state (campaign, schoolYear, level, department, from, to)
 * - Sort state (sortKey, sortDesc)
 * - useQuery với transform data (KPIs, status, standards, funnel, rankings, urgent, activities, collective)
 * - useMemo: sortedRankings
 * - Handlers: updateFilter, sort, exportCsv
 */
export function useAdminDashboard() {
  const [filters, setFilters] = useState<AdminDashboardFilters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>('rate');
  const [sortDesc, setSortDesc] = useState(true);

  const query = useQuery({
    queryKey: ['admin-dashboard', filters],
    queryFn: async () => {
      const response = await adminDashboardService.getSnapshot(filters);
      return {
        kpis: [
          {
            label: 'Sinh viên đăng ký',
            value: response.summary.totalRegistered,
            change: '+12,4%',
            icon: UsersRound,
            tone: 'blue',
          },
          {
            label: 'Hồ sơ đã nộp',
            value: response.summary.totalSubmitted,
            change: '+8,2%',
            icon: FileText,
            tone: 'cyan',
          },
          {
            label: 'Chờ xét duyệt',
            value: response.summary.totalPendingReview,
            change: 'Cần xử lý',
            icon: Clock3,
            tone: 'amber',
            alert: true,
          },
          {
            label: 'Đạt danh hiệu SV5T',
            value: response.summary.totalAwarded,
            change: '+15,7%',
            icon: Trophy,
            tone: 'emerald',
          },
          {
            label: 'Tỷ lệ đạt',
            value: `${response.summary.awardRate}%`,
            change: '+3,1%',
            icon: GraduationCap,
            tone: 'violet',
          },
        ],
        status: response.status.map((item) => ({
          key: item.status,
          label: item.label,
          value: item.count,
          color: item.color,
        })),
        standards: response.standardRates.map((item) => ({
          name: item.groupName,
          rate: item.passRate,
          tone: item.tone,
        })),
        funnel: response.funnel.flatMap((item, itemIndex) => [
          {
            label: `${item.level === 'school' ? 'Đăng ký' : 'Đề nghị'} ${item.label}`,
            value: item.submitted,
            width: FUNNEL_WIDTHS[itemIndex * 2] ?? 0,
          },
          {
            label: `Đạt ${item.label}`,
            value: item.approved,
            width: FUNNEL_WIDTHS[itemIndex * 2 + 1] ?? 0,
          },
        ]),
        rankings: response.departmentRanking.map((item) => ({
          name: item.departmentName,
          registered: item.registered,
          awarded: item.awarded,
          rate: item.rate,
          qualified: item.collectiveQualified,
        })),
        urgent: response.urgent,
        activities: response.activities,
        collective: response.collective,
      };
    },
    staleTime: 60_000,
  });

  const sortedRankings = useMemo(
    () =>
      (query.data?.rankings ?? []).toSorted((a, b) =>
        sortDesc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey],
      ),
    [query.data?.rankings, sortDesc, sortKey],
  );

  const updateFilter = (key: keyof AdminDashboardFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const sortBy = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc((value) => !value);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Đơn vị', 'Đăng ký', 'Đạt', 'Tỷ lệ'],
      ...sortedRankings.map((row) => [
        row.name,
        row.registered,
        row.awarded,
        `${row.rate}%`,
      ]),
    ];
    const blob = new Blob(['\ufeff' + rows.map((row) => row.join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'bao-cao-sv5t.csv';
    anchor.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  };

  return {
    filters,
    sortKey,
    sortDesc,
    data: query.data,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    sortedRankings,
    updateFilter,
    sortBy,
    exportCsv,
  };
}
