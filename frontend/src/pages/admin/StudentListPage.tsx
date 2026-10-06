import { Download, RefreshCw, Trash2, X } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import {
  useStudentList,
  StudentStatsCards,
  StudentFilterBar,
  StudentTable,
  StudentPagination,
  StudentFilterModal,
  StudentDetailModal,
  StudentLockDialog,
  StudentDeleteDialog,
  BatchDeleteStudentDialog,
} from '../../features/students';

export function StudentListPage() {
  const {
    items,
    total,
    totalPages,
    isPending,
    isError,
    error,
    refetch,
    activeCount,
    inactiveCount,
    search,
    setSearch,
    debounced,
    school,
    faculty,
    setFaculty,
    major,
    setMajor,
    cls,
    setCls,
    cohort,
    setCohort,
    schoolYear,
    setSchoolYear,
    activeF,
    showDeleted,
    setShowDeleted,
    handleActiveChange,
    handleApplyModalFilters,
    resetAll,
    advancedFilterCount,
    totalFilterCount,
    sortBy,
    sortDir,
    toggleSort,
    pageIndex,
    setPageIndex,
    pageSize,
    handlePageSizeChange,
    effectivePageIndex,
    effectivePageSize,
    rangeFrom,
    rangeTo,
    canPrev,
    canNext,
    selected,
    setSelected,
    toggleOne,
    toggleAll,
    allChecked,
    isIndeterminate,
    isFilterModalOpen,
    setIsFilterModalOpen,
    viewingStudent,
    setViewingStudent,
    deleting,
    setDeleting,
    isBatchDeleteOpen,
    setIsBatchDeleteOpen,
    lockTarget,
    setLockTarget,
    confirmLockToggle,
    confirmDelete,
    confirmBatchDelete,
    exportCsv,
    canLock,
    canDelete,
    banner,
    setBanner,
  } = useStudentList();

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-10">
      <AdminPageHeader
        title="Quản lý sinh viên"
        description="Tra cứu và quản lý danh sách hồ sơ sinh viên SV5T."
        actions={
          <>
            {selected.size > 0 && canDelete && (
              <button
                type="button"
                onClick={() => setIsBatchDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-normal shadow-xs hover:bg-rose-600 hover:text-white hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <Trash2 size={13} strokeWidth={1.8} />
                <span>Xóa đã chọn ({selected.size})</span>
              </button>
            )}
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#d7f0df] text-[#1c7a45] text-xs font-normal shadow-xs hover:bg-[#bfe6cc] hover:text-[#145c34] hover:shadow-sm active:scale-[0.98] transition-[background-color,color,box-shadow] cursor-pointer"
            >
              <Download size={13} strokeWidth={1.8} />
              <span>Xuất CSV{selected.size > 0 ? ` (${selected.size})` : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#a6cffb] text-[#244a7d] text-xs font-normal shadow-xs hover:bg-[#8fbff9] hover:text-[#1a3a65] hover:shadow-sm active:scale-[0.98] transition-[background-color,color,box-shadow] cursor-pointer"
            >
              <RefreshCw size={13} strokeWidth={1.8} className={isPending ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </>
        }
      />

      {banner && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            banner.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
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

      <StudentStatsCards total={total} activeCount={activeCount} inactiveCount={inactiveCount} />

      <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.18)] overflow-hidden">
        <StudentFilterBar
          search={search}
          onSearchChange={setSearch}
          debouncedSearch={debounced}
          activeF={activeF}
          onActiveChange={handleActiveChange}
          onOpenFilterModal={() => setIsFilterModalOpen(true)}
          advancedFilterCount={advancedFilterCount}
          totalFilterCount={totalFilterCount}
          faculty={faculty}
          onClearFaculty={() => setFaculty('')}
          major={major}
          onClearMajor={() => setMajor('')}
          cls={cls}
          onClearCls={() => setCls('')}
          cohort={cohort}
          onClearCohort={() => setCohort('')}
          schoolYear={schoolYear}
          onClearSchoolYear={() => setSchoolYear('')}
          showDeleted={showDeleted}
          onClearShowDeleted={() => setShowDeleted(false)}
          onClearActive={() => handleActiveChange('')}
        />

        <StudentTable
          items={items}
          isPending={isPending}
          isError={isError}
          error={error}
          refetch={refetch}
          selected={selected}
          onToggleOne={toggleOne}
          onToggleAll={toggleAll}
          allChecked={allChecked}
          isIndeterminate={isIndeterminate}
          effectivePageIndex={effectivePageIndex}
          effectivePageSize={effectivePageSize}
          sortBy={sortBy}
          sortDir={sortDir}
          onToggleSort={toggleSort}
          totalFilterCount={totalFilterCount}
          onResetFilters={resetAll}
          onViewStudent={setViewingStudent}
          onLockTarget={setLockTarget}
          onDeleteStudent={setDeleting}
          canLock={canLock}
          canDelete={canDelete}
        />

        <StudentPagination
          total={total}
          selectedCount={selected.size}
          onClearSelection={() => setSelected(new Set())}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          canPrev={canPrev}
          canNext={canNext}
          totalPages={totalPages}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
        />
      </div>

      <StudentFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        initialValues={{
          school,
          faculty,
          major,
          cls,
          cohort,
          schoolYear,
          activeF,
          showDeleted,
          sortBy,
          sortDir,
        }}
        onApply={handleApplyModalFilters}
        onReset={resetAll}
      />

      <StudentDetailModal
        isOpen={Boolean(viewingStudent)}
        studentId={viewingStudent?.id ?? null}
        fallbackItem={viewingStudent}
        onClose={() => setViewingStudent(null)}
      />

      <StudentLockDialog
        isOpen={Boolean(lockTarget)}
        student={lockTarget}
        onClose={() => setLockTarget(null)}
        onConfirm={confirmLockToggle}
      />

      <StudentDeleteDialog
        isOpen={Boolean(deleting)}
        student={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />

      <BatchDeleteStudentDialog
        isOpen={isBatchDeleteOpen}
        selectedCount={selected.size}
        onClose={() => setIsBatchDeleteOpen(false)}
        onConfirm={confirmBatchDelete}
      />
    </div>
  );
}

export default StudentListPage;
