import { useState, useMemo, useEffect } from 'react';
import { useStudentsPaged, useStudentMutations } from './useStudents';
import type { AdminStudentListItem, StudentFilterParams } from '../types/student.types';
import type { StudentFilterValues } from '../components/StudentFilterModal';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import { useAuthStore } from '../../../store/useAuthStore';
import { canAccessAdmin, isAdmin } from '../../../utils/authorization';

const DEFAULT_PAGE_SIZE = 12;

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export function useStudentList() {
  // Search state
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  // Filter states
  const [school, setSchool] = useState('');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [cls, setCls] = useState('');
  const [cohort, setCohort] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [activeF, setActiveF] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  // Sorting & pagination
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Modals & actions
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<AdminStudentListItem | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<AdminStudentListItem | null>(null);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [lockTarget, setLockTarget] = useState<AdminStudentListItem | null>(null);
  const [banner, setBanner] = useState<{ ok: boolean; msg: string } | null>(null);

  const currentUser = useAuthStore((s) => s.user);
  const canLock = canAccessAdmin(currentUser);
  const canDelete = isAdmin(currentUser);

  // Debounce search 350ms
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPageIndex(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Query params
  const params: StudentFilterParams = useMemo(() => ({
    search: debounced.trim() || undefined,
    school: school.trim() || undefined,
    faculty: faculty.trim() || undefined,
    major: major.trim() || undefined,
    administrativeClass: cls.trim() || undefined,
    cohort: cohort.trim() ? Number(cohort.trim()) : undefined,
    schoolYear: schoolYear.trim() || undefined,
    isActive: activeF === '' ? undefined : activeF === '1',
    includeDeleted: showDeleted,
    sortBy,
    sortDir,
    pageIndex,
    pageSize,
  }), [debounced, school, faculty, major, cls, cohort, schoolYear, activeF, showDeleted, sortBy, sortDir, pageIndex, pageSize]);

  const { data, isPending, isError, error, refetch } = useStudentsPaged(params);
  const { deleteStudent, batchDeleteStudents, lockStudent, unlockStudent } = useStudentMutations();
  const items = data?.items ?? [];
  const total = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const activeCount = items.filter((i) => i.isActive).length;
  const inactiveCount = items.length - activeCount;

  // Active filters count
  const advancedFilterCount =
    (school.trim() ? 1 : 0) +
    (faculty.trim() ? 1 : 0) +
    (major.trim() ? 1 : 0) +
    (cls.trim() ? 1 : 0) +
    (cohort.trim() ? 1 : 0) +
    (schoolYear.trim() ? 1 : 0) +
    (activeF !== '' ? 1 : 0) +
    (showDeleted ? 1 : 0);

  const totalFilterCount = advancedFilterCount + (debounced.trim() ? 1 : 0);

  const handleActiveChange = (val: string) => {
    setPageIndex(1);
    setActiveF(val);
  };

  const handleApplyModalFilters = (v: StudentFilterValues) => {
    setSchool(v.school);
    setFaculty(v.faculty);
    setMajor(v.major);
    setCls(v.cls);
    setCohort(v.cohort);
    setSchoolYear(v.schoolYear);
    setActiveF(v.activeF);
    setShowDeleted(v.showDeleted);
    setSortBy(v.sortBy);
    setSortDir(v.sortDir);
    setPageIndex(1);
  };

  const resetAll = () => {
    setSearch('');
    setDebounced('');
    setSchool('');
    setFaculty('');
    setMajor('');
    setCls('');
    setCohort('');
    setSchoolYear('');
    setActiveF('');
    setShowDeleted(false);
    setSortBy('createdAt');
    setSortDir('desc');
    setPageIndex(1);
    setSelected(new Set());
  };

  const toggleSort = (colKey: string) => {
    if (sortBy === colKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(colKey);
      setSortDir(colKey === 'createdAt' ? 'desc' : 'asc');
    }
    setPageIndex(1);
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleAll = (on: boolean) => {
    setSelected(on ? new Set(items.map((i) => i.id)) : new Set());
  };

  const exportCsv = () => {
    const rows = items.filter((i) => (selected.size ? selected.has(i.id) : true));
    if (!rows.length) {
      setBanner({ ok: false, msg: 'Không có dữ liệu để xuất.' });
      return;
    }
    const head = ['Ho ten', 'MSSV', 'Email', 'Khoa', 'Nganh', 'Lop', 'Khoa hoc', 'Truong', 'Hoat dong', 'Ngay tao'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [head.join(',')].concat(
      rows.map((r) => [
        esc(r.fullName),
        esc(r.studentCode),
        esc(r.email),
        esc(r.faculty),
        esc(r.major),
        esc(r.administrativeClass),
        esc(r.academicYear),
        esc(r.school),
        esc(r.isActive ? 'Hoat dong' : 'Vo hieu'),
        esc(fmtDate(r.createdAt)),
      ].join(','))
    );
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sinh-vien-trang-${pageIndex}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setBanner({ ok: true, msg: `Đã xuất ${rows.length} sinh viên ra CSV.` });
  };

  const confirmLockToggle = async (reason: string) => {
    if (!lockTarget) return;
    const wasLocked = !lockTarget.isActive;
    try {
      if (wasLocked) {
        await unlockStudent.mutateAsync({ id: lockTarget.id, body: { reason: reason || null } });
        setBanner({ ok: true, msg: `Đã mở khóa tài khoản ${lockTarget.fullName || lockTarget.email}.` });
      } else {
        await lockStudent.mutateAsync({ id: lockTarget.id, body: { reason: reason || null } });
        setBanner({ ok: true, msg: `Đã khóa tài khoản ${lockTarget.fullName || lockTarget.email}. Sinh viên đã bị đăng xuất khỏi mọi thiết bị.` });
      }
    } catch (e) {
      setBanner({ ok: false, msg: sanitizeApiError(e) });
      throw e instanceof Error ? e : new Error(String(e));
    }
  };

  const confirmDelete = async (reason: string) => {
    if (!deleting) return;
    try {
      await deleteStudent.mutateAsync({ id: deleting.id, body: { confirm: true, reason: reason || null } });
      setBanner({ ok: true, msg: `Đã xóa sinh viên ${deleting.fullName || deleting.email}.` });
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(deleting.id);
        return n;
      });
    } catch (e) {
      setBanner({ ok: false, msg: sanitizeApiError(e) });
      throw e instanceof Error ? e : new Error(String(e));
    }
  };

  const confirmBatchDelete = async (reason: string) => {
    if (selected.size === 0) return;
    try {
      const ids = Array.from(selected);
      const res = await batchDeleteStudents.mutateAsync({
        ids,
        confirm: true,
        reason: reason || null,
      });
      setSelected(new Set());
      setBanner({ ok: true, msg: `Đã xóa thành công ${res.deletedCount} sinh viên.` });
    } catch (e) {
      setBanner({ ok: false, msg: sanitizeApiError(e) });
      throw e instanceof Error ? e : new Error(String(e));
    }
  };

  const allChecked = items.length > 0 && items.every((i) => selected.has(i.id));
  const isIndeterminate = items.length > 0 && items.some((i) => selected.has(i.id)) && !allChecked;

  const effectivePageSize = data?.pageSize ?? pageSize;
  const effectivePageIndex = data?.pageIndex ?? pageIndex;
  const rangeFrom = total === 0 ? 0 : (effectivePageIndex - 1) * effectivePageSize + 1;
  const rangeTo = Math.min(effectivePageIndex * effectivePageSize, total);

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val));
    setPageIndex(1);
  };

  const canPrev = effectivePageIndex <= 1;
  const canNext = totalPages <= 1 ? false : effectivePageIndex >= totalPages;

  return {
    // Data & state
    items,
    total,
    totalPages,
    isPending,
    isError,
    error,
    refetch,

    // Statistics
    activeCount,
    inactiveCount,

    // Search & Filter
    search,
    setSearch,
    debounced,
    school,
    setSchool,
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
    setActiveF,
    showDeleted,
    setShowDeleted,
    handleActiveChange,
    handleApplyModalFilters,
    resetAll,
    advancedFilterCount,
    totalFilterCount,

    // Sorting
    sortBy,
    sortDir,
    toggleSort,

    // Pagination
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

    // Selection
    selected,
    setSelected,
    toggleOne,
    toggleAll,
    allChecked,
    isIndeterminate,

    // Modals
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

    // Action handlers
    confirmLockToggle,
    confirmDelete,
    confirmBatchDelete,
    exportCsv,

    // Permissions
    canLock,
    canDelete,

    // Banner
    banner,
    setBanner,
  };
}
