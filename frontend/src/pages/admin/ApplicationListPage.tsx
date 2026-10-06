import { useSearchParams } from 'react-router-dom';
import { Download, RefreshCw, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import {
  useApplicationList,
  ApplicationKPIs,
  ApplicationFilterBar,
  ApplicationTable,
  ApplicationPagination,
  ApplicationDetailModal,
} from '../../features/applications';

export function ApplicationListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    items,
    totalCount,
    totalPages,
    isPending,
    isError,
    error,
    refetch,
    stats,
    campaigns,

    // Filters
    search,
    setSearch,
    debouncedSearch,
    selectedCampaignId,
    handleCampaignChange,
    selectedStatus,
    setSelectedStatus,
    resetAllFilters,

    // Pagination
    pageSize,
    handlePageSizeChange,
    effectivePageIndex,
    effectivePageSize,
    rangeFrom,
    rangeTo,
    canPrev,
    canNext,
    setPageIndex,

    // Selection
    selectedRowIds,
    allChecked,
    isIndeterminate,
    toggleSelectAll,
    toggleSelectRow,

    // Modal
    selectedAppId,
    setSelectedAppId,

    // Banner & CSV
    banner,
    setBanner,
    exportCsv,
  } = useApplicationList();

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-10 font-inter font-['Inter',_sans-serif] text-slate-800">
      {/* Toast / Banner */}
      {banner && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-medium ${
              banner.ok
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-emerald-500/10'
                : 'bg-rose-50 text-rose-900 border-rose-200 shadow-rose-500/10'
            }`}
          >
            {banner.ok ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{banner.msg}</span>
            <button
              onClick={() => setBanner(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <AdminPageHeader
        title="Quản lý hồ sơ Sinh viên 5 Tốt"
        description="Tra cứu, theo dõi tiến độ nộp hồ sơ, đánh giá tiêu chí và phê duyệt danh hiệu."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-normal shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Download size={13} strokeWidth={1.8} />
              <span>Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#a6cffb] text-[#244a7d] text-xs font-normal shadow-xs hover:bg-[#8fbff9] hover:text-[#1a3a65] hover:shadow-sm active:scale-[0.98] transition-[background-color,color,box-shadow] cursor-pointer"
            >
              <RefreshCw size={13} strokeWidth={1.8} className={isPending ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        }
      />

      {/* 3 KPI Cards */}
      <ApplicationKPIs
        totalCount={stats.total}
        submittedCount={stats.submitted}
        approvedAll5Count={stats.approvedAll5}
      />

      {/* Unified Table Container: Filter Toolbar + Table + Pagination */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.18)] overflow-hidden">
        <ApplicationFilterBar
          search={search}
          onSearchChange={setSearch}
          debouncedSearch={debouncedSearch}
          campaigns={campaigns}
          selectedCampaignId={selectedCampaignId}
          onCampaignChange={handleCampaignChange}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onResetFilters={resetAllFilters}
        />

        {/* Divider */}
        <div className="flex items-center gap-2 px-2 sm:px-6 pt-0 pb-2.5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
        </div>

        <ApplicationTable
          items={items}
          isPending={isPending}
          isError={isError}
          error={error}
          refetch={refetch}
          selectedRowIds={selectedRowIds}
          allChecked={allChecked}
          isIndeterminate={isIndeterminate}
          toggleSelectAll={toggleSelectAll}
          toggleSelectRow={toggleSelectRow}
          effectivePageIndex={effectivePageIndex}
          effectivePageSize={effectivePageSize}
          onSelectApplication={(id) => setSelectedAppId(id)}
        />

        <ApplicationPagination
          totalCount={totalCount}
          pageSize={pageSize}
          handlePageSizeChange={handlePageSizeChange}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          canPrev={canPrev}
          canNext={canNext}
          setPageIndex={setPageIndex}
          totalPages={totalPages}
        />
      </div>

      {/* Detail Modal */}
      <ApplicationDetailModal
        isOpen={Boolean(selectedAppId)}
        applicationId={selectedAppId}
        onClose={() => {
          setSelectedAppId(null);
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
