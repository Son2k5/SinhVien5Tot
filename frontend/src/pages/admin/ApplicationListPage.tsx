import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  HeartHandshake,
  Loader2,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import { useApplicationsPaged } from '../../hooks/admin/useApplicationReview';
import { campaignService } from '../../services/admin/campaignService';
import type { CampaignResponse } from '../../types/admin/campaign';
import type {
  ApplicantSnapshot,
  ReviewApplicationFilterParams,
} from '../../types/admin/application';
import { ApplicationDetailModal } from '../../components/admin/applications/ApplicationDetailModal';

const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [10, 12, 20, 50];

const GROUP_ICONS: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  Ethics: { label: 'Đạo đức tốt', icon: ShieldCheck },
  Study: { label: 'Học tập tốt', icon: BookOpen },
  Fitness: { label: 'Thể lực tốt', icon: Zap },
  Volunteer: { label: 'Tình nguyện tốt', icon: HeartHandshake },
  Integration: { label: 'Hội nhập tốt', icon: Scale },
};

const STATUS_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  Draft: { label: 'Bản nháp', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  Submitted: { label: 'Đã nộp — Chờ duyệt', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  UnderReview: { label: 'Đang chấm điểm', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  NeedsRevision: { label: 'Yêu cầu bổ sung', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  Resubmitted: { label: 'Đã nộp lại', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  Approved: { label: 'Đạt danh hiệu SV5T', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Rejected: { label: 'Không đạt / Từ chối', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  Withdrawn: { label: 'Đã rút hồ sơ', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400' },
};

export function ApplicationListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    searchParams.get('campaignId') || ''
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get('status') || ''
  );

  // Pagination
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Campaigns list for dropdown
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);

  // Selection & Modal
  const [selectedAppId, setSelectedAppId] = useState<string | null>(
    searchParams.get('id') || null
  );
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [banner, setBanner] = useState<{ ok: boolean; msg: string } | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync with searchParams on mount or param change
  useEffect(() => {
    const cId = searchParams.get('campaignId');
    const st = searchParams.get('status');
    const id = searchParams.get('id');

    if (cId && cId !== selectedCampaignId) setSelectedCampaignId(cId);
    if (st && st !== selectedStatus) setSelectedStatus(st);
    if (id && id !== selectedAppId) setSelectedAppId(id);
  }, [searchParams]);

  // Load campaigns
  useEffect(() => {
    campaignService
      .getAll()
      .then((data) => setCampaigns(data))
      .catch(() => undefined);
  }, []);

  // Filter params for query
  const queryParams: ReviewApplicationFilterParams = useMemo(() => {
    return {
      campaignId: selectedCampaignId || undefined,
      status: selectedStatus || undefined,
      pageIndex,
      pageSize,
    };
  }, [selectedCampaignId, selectedStatus, pageIndex, pageSize]);

  const { data, isPending, isError, refetch } = useApplicationsPaged(queryParams);

  const rawItems = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;

  // Client-side filtering by search term (name, studentCode, applicationCode)
  const items = useMemo(() => {
    if (!debouncedSearch.trim()) return rawItems;
    const q = debouncedSearch.toLowerCase().trim();

    return rawItems.filter((app) => {
      let snapshot: ApplicantSnapshot = {};
      try {
        if (app.applicantSnapshotJson) snapshot = JSON.parse(app.applicantSnapshotJson);
      } catch {
        snapshot = {};
      }

      const matchName = snapshot.fullName?.toLowerCase().includes(q);
      const matchCode = snapshot.studentCode?.toLowerCase().includes(q);
      const matchAppCode = app.applicationCode?.toLowerCase().includes(q);
      const matchEmail = snapshot.email?.toLowerCase().includes(q);
      const matchCampaign = app.campaignName?.toLowerCase().includes(q);

      return matchName || matchCode || matchAppCode || matchEmail || matchCampaign;
    });
  }, [rawItems, debouncedSearch]);

  // Quick stats
  const stats = useMemo(() => {
    const submittedCount = rawItems.filter(
      (i) => i.status === 'Submitted' || i.status === 'Resubmitted'
    ).length;
    const approvedCount = rawItems.filter((i) => i.status === 'Approved').length;
    const revisionCount = rawItems.filter((i) => i.status === 'NeedsRevision').length;
    const rejectedCount = rawItems.filter((i) => i.status === 'Rejected').length;

    return {
      total: totalCount,
      submitted: submittedCount,
      approved: approvedCount,
      needsRevision: revisionCount,
      rejected: rejectedCount,
    };
  }, [rawItems, totalCount]);

  // Row selection
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(new Set(items.map((i) => i.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Export CSV
  const handleExportCsv = () => {
    const rowsToExport = items.filter((i) =>
      selectedRowIds.size ? selectedRowIds.has(i.id) : true
    );
    if (!rowsToExport.length) {
      setBanner({ ok: false, msg: 'Không có dữ liệu để xuất.' });
      return;
    }

    const headers = [
      'Mã hồ sơ',
      'Họ và tên',
      'MSSV',
      'Khoa/Viện',
      'Lớp',
      'Chiến dịch',
      'Trạng thái',
      'Tiêu chuẩn đạt',
      'Ngày nộp',
      'Nhận xét đánh giá',
    ];

    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const lines = [headers.join(',')].concat(
      rowsToExport.map((r) => {
        let snapshot: ApplicantSnapshot = {};
        try {
          if (r.applicantSnapshotJson) snapshot = JSON.parse(r.applicantSnapshotJson);
        } catch {
          snapshot = {};
        }

        const approvedStandards = r.standards?.filter((s) => s.complete).length ?? 0;

        return [
          esc(r.applicationCode),
          esc(snapshot.fullName || ''),
          esc(snapshot.studentCode || ''),
          esc(snapshot.faculty || ''),
          esc(snapshot.administrativeClass || ''),
          esc(r.campaignName),
          esc(r.status),
          esc(`${approvedStandards}/5`),
          esc(r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('vi-VN') : ''),
          esc(r.reviewerGeneralNote || r.rejectionReason || ''),
        ].join(',');
      })
    );

    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh-sach-ho-so-sv5t-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setBanner({ ok: true, msg: `Đã xuất ${rowsToExport.length} hồ sơ ra tệp CSV.` });
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCampaignId('');
    setSelectedStatus('');
    setPageIndex(1);
    setSearchParams({});
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-12">
      {/* Header */}
      <AdminPageHeader
        title="Quản lý hồ sơ đăng ký SV5T"
        description="Tiếp nhận, kiểm tra minh chứng 5 nhóm tiêu chuẩn và thẩm định hồ sơ Sinh viên 5 Tốt."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#d7f0df] text-[#1c7a45] text-xs font-medium shadow-xs hover:bg-[#bfe6cc] hover:text-[#145c34] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Download size={13} strokeWidth={2} />
              <span>Xuất CSV{selectedRowIds.size > 0 ? ` (${selectedRowIds.size})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#a6cffb] text-[#244a7d] text-xs font-medium shadow-xs hover:bg-[#8fbff9] hover:text-[#1a3a65] active:scale-[0.98] transition-all cursor-pointer"
            >
              <RefreshCw
                size={13}
                strokeWidth={2}
                className={isPending ? 'animate-spin' : ''}
              />
              <span>Làm mới</span>
            </button>
          </div>
        }
      />

      {/* Banner message */}
      {banner && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            banner.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{banner.msg}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="p-1 hover:bg-white/60 rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top 5 Stat Cards - theo chuẩn giao diện StudentListPage */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            icon: Users,
            label: 'Tổng hồ sơ',
            value: stats.total.toLocaleString('vi-VN'),
            color: 'text-blue-600 bg-blue-50',
            onClick: () => setSelectedStatus(''),
          },
          {
            icon: Clock,
            label: 'Chờ thẩm định',
            value: String(stats.submitted),
            color: 'text-purple-600 bg-purple-50',
            onClick: () => setSelectedStatus('Submitted'),
          },
          {
            icon: CheckCircle2,
            label: 'Đạt chuẩn SV5T',
            value: String(stats.approved),
            color: 'text-emerald-600 bg-emerald-50',
            onClick: () => setSelectedStatus('Approved'),
          },
          {
            icon: AlertTriangle,
            label: 'Cần bổ sung',
            value: String(stats.needsRevision),
            color: 'text-amber-600 bg-amber-50',
            onClick: () => setSelectedStatus('NeedsRevision'),
          },
          {
            icon: AlertCircle,
            label: 'Không đạt / Từ chối',
            value: String(stats.rejected),
            color: 'text-rose-600 bg-rose-50',
            onClick: () => setSelectedStatus('Rejected'),
          },
        ].map((item) => (
          <div
            key={item.label}
            onClick={item.onClick}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3.5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div
              className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center shrink-0`}
            >
              <item.icon size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 font-medium truncate">{item.label}</div>
              <div className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Unified Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.18)] overflow-hidden">
        {/* Filter Toolbar */}
        <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left search */}
          <div className="relative w-full lg:w-[420px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo họ tên sinh viên, MSSV, mã hồ sơ..."
              className="w-full h-9 rounded-xl border border-slate-300 hover:border-slate-400 bg-white pl-9 pr-8 py-0 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none transition-colors shadow-2xs"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Right filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Campaign Select */}
            <div className="relative">
              <select
                value={selectedCampaignId}
                onChange={(e) => {
                  setSelectedCampaignId(e.target.value);
                  setPageIndex(1);
                }}
                className="h-9 rounded-xl border border-slate-300 hover:border-slate-400 bg-white px-3 pr-8 text-xs font-medium text-slate-700 focus:border-[#1683ff] focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả chiến dịch</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.schoolYear})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Status Select */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPageIndex(1);
                }}
                className="h-9 rounded-xl border border-slate-300 hover:border-slate-400 bg-white px-3 pr-8 text-xs font-medium text-slate-700 focus:border-[#1683ff] focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Submitted">Đã nộp — Chờ duyệt</option>
                <option value="UnderReview">Đang thẩm định</option>
                <option value="NeedsRevision">Yêu cầu bổ sung</option>
                <option value="Approved">Đạt danh hiệu SV5T</option>
                <option value="Rejected">Không đạt / Từ chối</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Reset Filter Button */}
            {(search || selectedCampaignId || selectedStatus) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <X size={13} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedRowIds.size === items.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 min-w-[150px]">Mã hồ sơ</th>
                <th className="py-3 px-4 min-w-[220px]">Sinh viên</th>
                <th className="py-3 px-4 min-w-[180px]">Chiến dịch</th>
                <th className="py-3 px-4 min-w-[200px]">5 Tiêu chuẩn</th>
                <th className="py-3 px-4 min-w-[140px]">Trạng thái</th>
                <th className="py-3 px-4 min-w-[120px] text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {isPending ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Đang tải danh sách hồ sơ đăng ký...</span>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-rose-600">
                    <AlertCircle size={24} className="mx-auto mb-1 text-rose-500" />
                    <span>Không thể tải dữ liệu hồ sơ. Vui lòng thử lại.</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-slate-600">Không tìm thấy hồ sơ phù hợp</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Thử điều chỉnh lại bộ lọc tìm kiếm hoặc từ khóa.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((app) => {
                  let snapshot: ApplicantSnapshot = {};
                  try {
                    if (app.applicantSnapshotJson) snapshot = JSON.parse(app.applicantSnapshotJson);
                  } catch {
                    snapshot = {};
                  }

                  const isSelected = selectedRowIds.has(app.id);
                  const statusConf = STATUS_MAP[app.status] || STATUS_MAP.Submitted;
                  const standards = app.standards ?? [];
                  const completedCount = standards.filter((s) => s.complete).length;

                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(app.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Application Code & Submit Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{app.applicationCode}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar size={11} />
                          <span>
                            {app.submittedAt
                              ? new Date(app.submittedAt).toLocaleDateString('vi-VN')
                              : 'Chưa gửi'}
                          </span>
                        </div>
                      </td>

                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {(snapshot.fullName?.charAt(0) || 'S').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {snapshot.fullName || 'Sinh viên'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate font-mono">
                              {snapshot.studentCode || '—'}
                              {snapshot.administrativeClass ? ` • ${snapshot.administrativeClass}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Campaign */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[200px]" title={app.campaignName}>
                          {app.campaignName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {snapshot.faculty ? `Khoa: ${snapshot.faculty}` : 'Sinh viên 5 Tốt'}
                        </div>
                      </td>

                      {/* 5 Standards Progress */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          {(['Ethics', 'Study', 'Fitness', 'Volunteer', 'Integration'] as const).map(
                            (groupKey) => {
                              const std = standards.find((s) => s.groupCode === groupKey);
                              const isComplete = std?.complete ?? false;
                              const conf = GROUP_ICONS[groupKey];
                              const Icon = conf.icon;

                              return (
                                <div
                                  key={groupKey}
                                  title={`${conf.label}: ${std ? `${std.approvedCount}/${std.requiredCount} đã duyệt` : 'Chưa có'}`}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-transform hover:scale-110 ${
                                    isComplete
                                      ? 'bg-emerald-100 text-emerald-700 font-bold'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  <Icon size={12} />
                                </div>
                              );
                            }
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Đạt <strong className={completedCount === 5 ? 'text-emerald-700' : 'text-blue-700'}>{completedCount}/5</strong> nhóm
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                          <span>{statusConf.label}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppId(app.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Eye size={13} />
                          <span>Thẩm định</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageIndex(1);
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 py-0 text-xs font-medium text-slate-700 cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>hồ sơ / trang (Tổng {totalCount})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-600">
              Trang {pageIndex} / {totalPages || 1}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pageIndex <= 1}
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                disabled={pageIndex >= totalPages}
                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail & Evaluation Modal */}
      <ApplicationDetailModal
        isOpen={Boolean(selectedAppId)}
        applicationId={selectedAppId}
        onClose={() => {
          setSelectedAppId(null);
          // Clean id query param
          if (searchParams.has('id')) {
            const next = new URLSearchParams(searchParams);
            next.delete('id');
            setSearchParams(next);
          }
        }}
        onSuccessDecision={() => {
          void refetch();
          setBanner({ ok: true, msg: 'Đã cập nhật kết quả xét duyệt hồ sơ thành công!' });
        }}
      />
    </div>
  );
}
