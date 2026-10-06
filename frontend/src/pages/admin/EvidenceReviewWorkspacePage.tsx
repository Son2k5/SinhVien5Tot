import { AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import {
  useEvidenceReviewWorkspace,
  EvidenceReviewKPIs,
  EvidenceReviewFilterBar,
  EvidenceReviewTable,
  EvidenceReviewPagination,
  StudentEvidenceGroupModal,
  EvidenceViewerModal,
  EvidenceReviewQuickModal,
  ApplicationDetailModal,
  STATUS_CONFIG,
} from '../../features/applications';

const PAGE_SIZE_OPTIONS = [10, 12, 25, 50];

export function EvidenceReviewWorkspacePage() {
  const {
    activeTab,
    campaigns,
    selectedCampaignId,
    setSelectedCampaignId,
    search,
    setSearch,
    debouncedSearch,
    faculties,
    selectedFaculty,
    setSelectedFaculty,
    selectedStandardGroup,
    setSelectedStandardGroup,

    // Specialized filters
    submittedWaitingFilter,
    setSubmittedWaitingFilter,
    revisionStudentStatus,
    setRevisionStudentStatus,
    approvedTimeFilter,
    setApprovedTimeFilter,
    rejectedReasonCategory,
    setRejectedReasonCategory,

    activeFiltersCount,
    resetAllFilters,

    // Data & pagination
    isLoading,
    isError,
    refetch,
    rawItems,
    studentGroups,
    pagedStudentGroups,
    totalStudents,
    totalPages,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,

    // Selection
    selected,
    toggleSelectAll,
    toggleSelectOne,

    // Handlers
    handleDirectApprove,
    handleDirectRevert,
    handleReviewEvidence,

    // Modals
    viewingStudentGroup,
    setViewingStudentGroup,
    viewerOpen,
    setViewerOpen,
    viewingEvidence,
    setViewingEvidence,
    viewingAttachmentIndex,
    handleOpenViewer,
    quickReviewTarget,
    setQuickReviewTarget,
    detailAppId,
    setDetailAppId,

    // Toast
    toastMessage,
    setToastMessage,
  } = useEvidenceReviewWorkspace();

  const currentStatusConf = STATUS_CONFIG[activeTab] || STATUS_CONFIG.Submitted;
  const urgentCount = studentGroups.filter((g) => g.isOver7Days).length;
  const warningCount = studentGroups.filter((g) => g.isOver3Days && !g.isOver7Days).length;

  const rangeFrom = totalStudents === 0 ? 0 : (pageIndex - 1) * pageSize + 1;
  const rangeTo = Math.min(pageIndex * pageSize, totalStudents);
  const canPrev = pageIndex <= 1;
  const canNext = totalPages <= 1 ? false : pageIndex >= totalPages;

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-10 font-inter font-['Inter',_sans-serif] text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-emerald-500/10'
                : 'bg-rose-50 text-rose-900 border-rose-200 shadow-rose-500/10'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <AdminPageHeader
        title={`Thẩm định minh chứng — ${currentStatusConf.label}`}
        description={`${currentStatusConf.description || ''}. Tra cứu và duyệt minh chứng theo từng sinh viên.`}
        actions={
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg font-medium">
                Đã tick chọn: <strong>{selected.size}</strong> sinh viên
              </span>
            )}
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#a6cffb] text-[#244a7d] text-xs font-normal shadow-xs hover:bg-[#8fbff9] hover:text-[#1a3a65] hover:shadow-sm active:scale-[0.98] transition-[background-color,color,box-shadow] cursor-pointer"
            >
              <RefreshCw size={13} strokeWidth={1.8} className={isLoading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        }
      />

      {/* 4 Stat Cards */}
      <EvidenceReviewKPIs
        activeTab={activeTab}
        totalStudents={totalStudents}
        filteredEvidencesCount={rawItems.length}
        warningCount={warningCount}
        urgentCount={urgentCount}
      />

      {/* Unified Card: Filter + Table + Pagination */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.18)] overflow-hidden">
        <EvidenceReviewFilterBar
          activeTab={activeTab}
          search={search}
          setSearch={setSearch}
          debouncedSearch={debouncedSearch}
          campaigns={campaigns}
          selectedCampaignId={selectedCampaignId}
          setSelectedCampaignId={setSelectedCampaignId}
          selectedStandardGroup={selectedStandardGroup}
          setSelectedStandardGroup={setSelectedStandardGroup}
          faculties={faculties}
          selectedFaculty={selectedFaculty}
          setSelectedFaculty={setSelectedFaculty}
          submittedWaitingFilter={submittedWaitingFilter}
          setSubmittedWaitingFilter={setSubmittedWaitingFilter}
          revisionStudentStatus={revisionStudentStatus}
          setRevisionStudentStatus={setRevisionStudentStatus}
          approvedTimeFilter={approvedTimeFilter}
          setApprovedTimeFilter={setApprovedTimeFilter}
          rejectedReasonCategory={rejectedReasonCategory}
          setRejectedReasonCategory={setRejectedReasonCategory}
          activeFiltersCount={activeFiltersCount}
          resetAllFilters={resetAllFilters}
          setPageIndex={setPageIndex}
        />

        {/* Short divider */}
        <div className="flex items-center gap-2 px-2 sm:px-6 pt-0 pb-2.5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
        </div>

        <EvidenceReviewTable
          activeTab={activeTab}
          pagedStudentGroups={pagedStudentGroups}
          isLoading={isLoading}
          isError={isError}
          refetch={refetch}
          selected={selected}
          toggleSelectAll={toggleSelectAll}
          toggleSelectOne={toggleSelectOne}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onSelectGroup={(g) => setViewingStudentGroup(g)}
        />

        <EvidenceReviewPagination
          totalStudents={totalStudents}
          rawItemsCount={rawItems.length}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          pageIndex={pageIndex}
          totalPages={totalPages}
          onPageChange={setPageIndex}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          canPrev={canPrev}
          canNext={canNext}
        />
      </div>

      {/* Student Evidence Group Popup Modal */}
      <StudentEvidenceGroupModal
        isOpen={Boolean(viewingStudentGroup)}
        group={viewingStudentGroup}
        onClose={() => setViewingStudentGroup(null)}
        onOpenViewer={handleOpenViewer}
        onDirectApprove={handleDirectApprove}
        onDirectRevert={handleDirectRevert}
        onOpenReview={(item) => setQuickReviewTarget(item)}
        onOpenFullApp={(appId) => setDetailAppId(appId)}
      />

      {/* Evidence Viewer Modal */}
      <EvidenceViewerModal
        isOpen={viewerOpen}
        evidence={viewingEvidence}
        initialAttachmentIndex={viewingAttachmentIndex}
        onClose={() => {
          setViewerOpen(false);
          setViewingEvidence(null);
        }}
      />

      {/* Quick Evidence Review Modal */}
      <EvidenceReviewQuickModal
        isOpen={Boolean(quickReviewTarget)}
        evidence={quickReviewTarget}
        onClose={() => setQuickReviewTarget(null)}
        onSubmit={async (decision, note) => {
          if (!quickReviewTarget) return;
          try {
            await handleReviewEvidence(quickReviewTarget, decision, note);
            setQuickReviewTarget(null);
          } catch {
            // handled
          }
        }}
      />

      {/* Full Application Detail Modal */}
      {detailAppId && (
        <ApplicationDetailModal
          isOpen={Boolean(detailAppId)}
          applicationId={detailAppId}
          onClose={() => setDetailAppId(null)}
          onSuccessDecision={() => {
            void refetch();
          }}
        />
      )}
    </div>
  );
}
