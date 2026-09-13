import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useStudentsPaged, useStudentMutations } from '../../hooks/admin/useStudents';
import type { AdminStudentListItem, StudentFilterParams } from '../../types/admin/student';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import { ActiveBadge, VerifiedBadge } from '../../components/admin/students/StudentBadges';
import { StudentDeleteDialog } from '../../components/admin/students/StudentDeleteDialog';
import {
  StudentFilterModal,
  StudentDetailModal,
  StudentLockDialog,
  type StudentFilterValues,
} from '../../components/admin/students';
import { sanitizeApiError } from '../../services/apiErrorSanitizer';
import { useAuthStore } from '../../store/useAuthStore';
import { canAccessAdmin, isAdmin } from '../../utils/authorization';
import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Eye, GraduationCap,
  RefreshCw, Search, Trash2, Users, X, Lock, LockOpen,
  BadgeCheck, UserX, ArrowUpDown, ArrowUp, ArrowDown,
  SlidersHorizontal,
} from 'lucide-react';

const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [10, 12, 25, 50];

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export function StudentListPage() {
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
  const [verifiedF, setVerifiedF] = useState('');
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
    isVerified: verifiedF === '' ? undefined : verifiedF === '1',
    includeDeleted: showDeleted,
    sortBy,
    sortDir,
    pageIndex,
    pageSize,
  }), [debounced, school, faculty, major, cls, cohort, schoolYear, activeF, verifiedF, showDeleted, sortBy, sortDir, pageIndex, pageSize]);

  const { data, isPending, isError, error, refetch } = useStudentsPaged(params);
  const { deleteStudent, lockStudent, unlockStudent } = useStudentMutations();
  const items = data?.items ?? [];
  const total = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const verifiedCount = items.filter((i) => i.isVerified).length;
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
    (verifiedF !== '' ? 1 : 0) +
    (showDeleted ? 1 : 0);

  const totalFilterCount = advancedFilterCount + (debounced.trim() ? 1 : 0);

  // Separate status selectors for activity and verification
  const handleActiveChange = (val: string) => {
    setPageIndex(1);
    setActiveF(val);
    // reset verification filter when changing activity to avoid ambiguous combos
    // (optional: keep current verification, but UI now separates concerns)
  };

  const handleVerifiedChange = (val: string) => {
    setPageIndex(1);
    setVerifiedF(val);
  };

  const handleApplyModalFilters = (v: StudentFilterValues) => {
    setSchool(v.school);
    setFaculty(v.faculty);
    setMajor(v.major);
    setCls(v.cls);
    setCohort(v.cohort);
    setSchoolYear(v.schoolYear);
    setActiveF(v.activeF);
    setVerifiedF(v.verifiedF);
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
    setVerifiedF('');
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
    const head = ['Ho ten', 'MSSV', 'Email', 'Khoa', 'Nganh', 'Lop', 'Khoa hoc', 'Truong', 'Xac minh', 'Hoat dong', 'Ngay tao'];
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
        esc(r.isVerified ? 'Da xac minh' : 'Chua xac minh'),
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

  const allChecked = items.length > 0 && items.every((i) => selected.has(i.id));

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

  // ── Resizable columns (Excel-like): lưu width từng cột, kéo ở mép phải header ──
  type StudentColKey =
    | 'check' | 'stt' | 'fullname' | 'email' | 'studentcode'
    | 'class' | 'faculty' | 'major' | 'verified' | 'status' | 'createdAt' | 'actions';

  const DEFAULT_COL_WIDTHS: Record<StudentColKey, number> = {
    check: 44, stt: 52, fullname: 190, email: 230, studentcode: 120,
    class: 110, faculty: 160, major: 170, verified: 128, status: 148,
    createdAt: 115, actions: 124,
  };
  const MIN_COL_WIDTHS: Record<StudentColKey, number> = {
    check: 40, stt: 44, fullname: 120, email: 150, studentcode: 88,
    class: 80, faculty: 100, major: 100, verified: 108, status: 122,
    createdAt: 96, actions: 110,
  };
  const COL_STORAGE_KEY = 'sv5t-student-table-colwidths-v1';

  const [colWidths, setColWidths] = useState<Record<StudentColKey, number>>(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<StudentColKey, number>>;
        return { ...DEFAULT_COL_WIDTHS, ...parsed };
      }
    } catch { /* ignore */ }
    return DEFAULT_COL_WIDTHS;
  });
  const resizingRef = useRef<{ key: StudentColKey; startX: number; startW: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(colWidths));
    } catch { /* ignore */ }
  }, [colWidths]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, key: StudentColKey) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = { key, startX: e.clientX, startW: colWidths[key] };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMove = (ev: MouseEvent) => {
        const cur = resizingRef.current;
        if (!cur) return;
        const delta = ev.clientX - cur.startX;
        const next = Math.max(MIN_COL_WIDTHS[cur.key], cur.startW + delta);
        setColWidths((prev) => (prev[cur.key] === next ? prev : { ...prev, [cur.key]: next }));
      };
      const onUp = () => {
        resizingRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [colWidths],
  );

  // Tay kéo ở mép phải mỗi <th> — vạch | ngắn 16px nằm giữa header (như mẫu), vùng kéo vẫn full-height để dễ bắt chuột
  const ResizeHandle = ({ colKey }: { colKey: StudentColKey }) => (
    <span
      onMouseDown={(e) => onResizeStart(e, colKey)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setColWidths((prev) => ({ ...prev, [colKey]: DEFAULT_COL_WIDTHS[colKey] }));
      }}
      title="Kéo để đổi độ rộng cột (double-click để reset)"
      className="absolute top-0 right-0 h-full w-3 cursor-col-resize select-none touch-none group/resize flex items-center justify-end"
    >
      <span className="block mr-[3px] h-4 w-px bg-[#C9CDD3] transition-colors group-hover/resize:bg-[#1683ff] group-active/resize:bg-[#1683ff]" />
    </span>
  );

  const col = (_key: StudentColKey, extra: string = '') =>
    `relative px-3 ${extra}`;

  const totalTableWidth = useMemo(
    () => Object.values(colWidths).reduce((a, b) => a + b, 0),
    [colWidths],
  );

  // Clean sort indicator — tuned for blue-tinted premium header
  const renderSortIndicator = (colKey: string) => {
    if (sortBy !== colKey) {
      return <ArrowUpDown size={12} className="text-black/30 group-hover:text-[#0866db] transition-colors" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="text-[#1683ff]" />
    ) : (
      <ArrowDown size={12} className="text-[#1683ff]" />
    );
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-10">
      {/* Header */}
      <AdminPageHeader
        title="Quản lý sinh viên"
        description="Tra cứu và quản lý danh sách hồ sơ sinh viên SV5T."
        actions={
          <>
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

      {/* Banner */}
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

      {/* 4 Stat Cards - Bé, đơn giản, giảm height tối đa, trực quan cho người dùng */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Tổng sinh viên', value: total.toLocaleString('vi-VN'), color: 'text-blue-600 bg-blue-50' },
          { icon: BadgeCheck, label: 'Đã xác minh', value: String(verifiedCount), color: 'text-emerald-600 bg-emerald-50' },
          { icon: GraduationCap, label: 'Đang hoạt động', value: String(activeCount), color: 'text-violet-600 bg-violet-50' },
          { icon: UserX, label: 'Vô hiệu hoá', value: String(inactiveCount), color: 'text-amber-600 bg-amber-50' },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3.5 shadow-xs hover:border-slate-300 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
              <item.icon size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-600 font-medium truncate">{item.label}</div>
              <div className="text-xl font-bold tracking-tight text-slate-900 leading-tight">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Unified card: Filter + Table - premium soft surface, clear rhythm  */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.18)] overflow-hidden">
        {/* Zone 1: Filter toolbar - gọn, thấp */}
        <div className="px-3 sm:px-4 py-2 space-y-1 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="filter-no-ring flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5">
            {/* Search - ngan 1 nua, nam ben trai */}
            <div className="relative w-full lg:w-[46%] lg:max-w-[490px] shrink-0">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm theo họ tên, mã sinh viên (MSSV), email..."
                    className="input-compact w-full !h-9 !rounded-md !bg-white pl-7 pr-8 !py-0 !text-[12px] !leading-9 font-medium !text-slate-900 placeholder:!text-slate-500 placeholder:font-normal focus:!border-slate-200 focus:!ring-0 focus:!outline-none focus:!shadow-none"
                  />
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                </div>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
                title="Xóa tìm kiếm"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Cum phai: 2 selects + nut filter icon */}
          <div className="flex flex-1 flex-col sm:flex-row sm:justify-end sm:items-center gap-1 lg:pl-2">
            <div className="flex w-full sm:w-auto gap-1.5">
              {/* Activity status */}
              <div className="relative w-full sm:w-[150px] shrink-0">
                <select
                  value={activeF}
                  onChange={(e) => handleActiveChange(e.target.value)}
                  className="select-compact appearance-none w-full !h-9 !rounded-md !bg-white !pl-2.5 !pr-7 !py-0 !text-[12px] !leading-9 font-medium !text-slate-800 focus:!border-slate-200 focus:!ring-0 focus:!outline-none focus:!shadow-none"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="1">Đang hoạt động</option>
                  <option value="0">Vô hiệu hoá</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
              {/* Verification status */}
              <div className="relative w-full sm:w-[150px] shrink-0">
                <select
                  value={verifiedF}
                  onChange={(e) => handleVerifiedChange(e.target.value)}
                  className="select-compact appearance-none w-full !h-9 !rounded-md !bg-white !pl-2.5 !pr-7 !py-0 !text-[12px] !leading-9 font-medium !text-slate-800 focus:!border-slate-200 focus:!ring-0 focus:!outline-none focus:!shadow-none"
                >
                  <option value="">Tất cả xác minh</option>
                  <option value="1">Đã xác minh</option>
                  <option value="0">Chưa xác minh</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

          {/* Nut filter chi icon */}
          <div className="w-full sm:w-auto flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              title="Bộ lọc nâng cao"
              aria-label="Bộ lọc nâng cao"
               className={`relative !h-9 !w-9 !p-0 !rounded-md inline-flex items-center justify-center border transition-all cursor-pointer ${
                 advancedFilterCount > 0
                   ? 'bg-[#1683ff] text-white border-transparent shadow-[0_6px_16px_-6px_rgba(22,131,255,0.55)] hover:bg-[#0866db]'
                   : 'bg-white text-slate-500 border-slate-200 hover:border-[#1683ff]/40 hover:text-[#0866db] hover:bg-[#f1f9ff]'
               }`}
            >
              <SlidersHorizontal size={13} />
              {advancedFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#102340] text-white text-[11px] font-medium flex items-center justify-center">
                  {advancedFilterCount}
                </span>
              )}
            </button>
          </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {totalFilterCount > 0 && (
          <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-[11px] font-normal text-slate-500 mr-0.5">Đang lọc:</span>

            {debounced.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/80 text-slate-600 font-normal text-[11px]">
                "{debounced}"
                <button type="button" onClick={() => setSearch('')} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {faculty.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                Khoa: {faculty}
                <button type="button" onClick={() => setFaculty('')} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {major.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                Ngành: {major}
                <button type="button" onClick={() => setMajor('')} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {cls.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                Lớp: {cls}
                <button type="button" onClick={() => setCls('')} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {cohort.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                Khóa: {cohort}
                <button type="button" onClick={() => setCohort('')} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {schoolYear.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                Năm: {schoolYear}
                <button type="button" onClick={() => setSchoolYear('')} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {activeF !== '' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50/80 text-violet-600 font-normal text-[11px] border border-violet-100">
                {activeF === '1' ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                <button type="button" onClick={() => setActiveF('')} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {verifiedF !== '' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50/80 text-emerald-600 font-normal text-[11px] border border-emerald-100">
                {verifiedF === '1' ? 'Đã xác minh' : 'Chưa xác minh'}
                <button type="button" onClick={() => setVerifiedF('')} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {showDeleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50/80 text-rose-600 font-normal text-[11px] border border-rose-100">
                Đã xóa
                <button type="button" onClick={() => setShowDeleted(false)} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}


          </div>
        )}
        </div>
        {/* Short divider: 120px centered gradient rule separating filter / table */}
        <div className="flex items-center gap-2 px-2 sm:px-6 py-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
        </div>
        {/* Zone 2: Table — header có handle kéo  |  rows sạch, chỉ giãn theo header */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="tbl-div border-collapse text-xs table-fixed" style={{ width: totalTableWidth, minWidth: '100%' }}>
            <colgroup>
              {(Object.keys(DEFAULT_COL_WIDTHS) as StudentColKey[]).map((k) => (
                <col key={k} style={{ width: colWidths[k] }} />
              ))}
            </colgroup>
            {/* Table Header: neutral gray (#ECEDEF) - clean, balanced */}
            <thead>
              <tr className="bg-[#ECEDEF] border-y border-[#D9DCE1] text-black select-none">
                {/* 1. Checkbox */}
                <th className={col('check', 'py-3.5 text-center')} style={{ width: colWidths.check }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                    aria-label="Chọn tất cả"
                  />
                  <ResizeHandle colKey="check" />
                </th>

                {/* 2. STT */}
                <th className={col('stt', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black')} style={{ width: colWidths.stt }}>
                  <span className="block truncate">STT</span>
                  <ResizeHandle colKey="stt" />
                </th>

                {/* 3. Họ tên */}
                <th
                  onClick={() => toggleSort('fullname')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('fullname'); } }}
                  tabIndex={0}
                  className={col('fullname', 'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden')}
                  style={{ width: colWidths.fullname }}
                  role="button"
                  aria-label="Sắp xếp theo họ tên"
                >
                  <div className="inline-flex items-center justify-start gap-1 max-w-full">
                    <span className="truncate">Họ tên</span>
                    {renderSortIndicator('fullname')}
                  </div>
                  <ResizeHandle colKey="fullname" />
                </th>

                {/* 4. Email */}
                <th className={col('email', 'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.email }}>
                  <span className="block truncate">Email</span>
                  <ResizeHandle colKey="email" />
                </th>

                {/* 5. MSSV - mã ngắn -> căn phải */}
                <th
                  onClick={() => toggleSort('studentcode')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('studentcode'); } }}
                  tabIndex={0}
                  className={col('studentcode', 'py-3.5 text-right font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden')}
                  style={{ width: colWidths.studentcode }}
                  role="button"
                  aria-label="Sắp xếp theo MSSV"
                >
                  <div className="inline-flex items-center justify-end gap-1 max-w-full">
                    <span className="truncate">MSSV</span>
                    {renderSortIndicator('studentcode')}
                  </div>
                  <ResizeHandle colKey="studentcode" />
                </th>

                {/* 6. Lớp */}
                <th className={col('class', 'py-3.5 text-right font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.class }}>
                  <span className="block truncate">Lớp</span>
                  <ResizeHandle colKey="class" />
                </th>

                {/* 7. Khoa */}
                <th className={col('faculty', 'py-3.5 text-right font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.faculty }}>
                  <span className="block truncate">Khoa</span>
                  <ResizeHandle colKey="faculty" />
                </th>

                {/* 8. Ngành */}
                <th className={col('major', 'py-3.5 text-right font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.major }}>
                  <span className="block truncate">Ngành</span>
                  <ResizeHandle colKey="major" />
                </th>

                {/* 9. Xác minh */}
                <th className={col('verified', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.verified }}>
                  <span className="block truncate">Xác minh</span>
                  <ResizeHandle colKey="verified" />
                </th>

                {/* 10. Trạng thái */}
                <th className={col('status', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.status }}>
                  <span className="block truncate">Trạng thái</span>
                  <ResizeHandle colKey="status" />
                </th>

                {/* 11. Ngày tạo */}
                <th
                  onClick={() => toggleSort('createdAt')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('createdAt'); } }}
                  tabIndex={0}
                  className={col('createdAt', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden')}
                  style={{ width: colWidths.createdAt }}
                  role="button"
                  aria-label="Sắp xếp theo ngày tạo"
                >
                  <div className="inline-flex items-center justify-center gap-1 max-w-full">
                    <span className="truncate">Ngày tạo</span>
                    {renderSortIndicator('createdAt')}
                  </div>
                  <ResizeHandle colKey="createdAt" />
                </th>

                {/* 12. Thao tác */}
                <th className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden" style={{ width: colWidths.actions }}>
                  <span className="block truncate">Thao tác</span>
                </th>
              </tr>
            </thead>

            {/* Table Body: sạch, không vạch dọc — chỉ header có handle kéo, body tự co giãn theo */}
            <tbody className="divide-y divide-slate-100/80 [&>tr:nth-child(even)]:bg-slate-50/50">
              {/* Loading State */}
              {isPending && (
                <>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 py-2.5 text-center"><div className="w-3.5 h-3.5 bg-slate-200 rounded mx-auto" /></td>
                      <td className="px-2 py-2 text-center"><div className="w-3.5 h-3 bg-slate-200 rounded mx-auto" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-3/4" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-5/6" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-2/3 ml-auto" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-2/3 ml-auto" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-3/4 ml-auto" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-3/4 ml-auto" /></td>
                      <td className="px-3 py-2"><div className="h-5 bg-slate-200 rounded-full w-16 mx-auto" /></td>
                      <td className="px-3 py-2"><div className="h-5 bg-slate-200 rounded-full w-[72px] mx-auto" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-14 mx-auto" /></td>
                      <td className="px-3 py-2.5 text-center"><div className="h-7 bg-slate-200 rounded w-20 mx-auto" /></td>
                    </tr>
                  ))}
                </>
              )}

              {/* Error State */}
              {!isPending && isError && (
                <tr>
                  <td colSpan={12} className="py-10 text-center">
                    <div className="space-y-2">
                      <AlertCircle size={24} className="text-rose-500 mx-auto" />
                      <div className="text-sm font-medium text-slate-700">Không thể tải dữ liệu</div>
                      <p className="text-xs text-slate-400 max-w-md mx-auto break-words">{sanitizeApiError(error)}</p>
                      <button
                        type="button"
                        onClick={() => void refetch()}
                        className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer shadow-xs"
                      >
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty State */}
              {!isPending && !isError && items.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-600">Chưa có sinh viên phù hợp</div>
                      <p className="text-xs text-slate-400">
                        {totalFilterCount > 0
                          ? 'Thử thay đổi từ khóa hoặc điều chỉnh tiêu chí bộ lọc.'
                          : 'Hiện chưa có dữ liệu sinh viên trong hệ thống.'}
                      </p>
                      {totalFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={resetAll}
                          className="px-4 py-2 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 cursor-pointer transition-colors"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!isPending && !isError && items.map((s, idx) => (
                <tr key={s.id} className="hover:bg-blue-50/60 transition-colors duration-200 hover:shadow-[inset_2px_0_0_0_#3b82f6]">
                  {/* Checkbox */}
                  <td className="px-3 py-2.5 text-center align-middle overflow-hidden">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleOne(s.id)}
                      className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                      aria-label={`Chọn ${s.fullName}`}
                    />
                  </td>

                  {/* STT */}
                  <td className="px-2 py-3 text-center align-middle text-slate-500 text-[11px] overflow-hidden whitespace-nowrap">
                    {(effectivePageIndex - 1) * effectivePageSize + idx + 1}
                  </td>

                  {/* Họ tên */}
                  <td className="px-3 py-2.5 text-left align-middle overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setViewingStudent(s)}
                      className="cursor-pointer group/link block text-left max-w-full"
                      title={s.fullName || s.displayName || ''}
                    >
                      <div className="text-[13px] text-slate-700 truncate text-left font-normal">
                        {s.fullName || s.displayName || '—'}
                      </div>
                    </button>
                  </td>

                  {/* Email */}
                  <td className="px-3 py-2.5 text-left align-middle overflow-hidden">
                    <div className="text-[12px] text-slate-700 truncate text-left font-normal" title={s.email}>
                      {s.email}
                    </div>
                  </td>

                  {/* MSSV */}
                  <td className="px-3 py-2.5 text-right align-middle text-slate-800 whitespace-nowrap overflow-hidden">
                    <span className="block truncate" title={s.studentCode || ''}>{s.studentCode || '—'}</span>
                  </td>

                  {/* Lớp */}
                  <td className="px-3 py-2.5 text-right align-middle text-slate-600 whitespace-nowrap overflow-hidden">
                    <span className="block truncate" title={s.administrativeClass || ''}>{s.administrativeClass || '—'}</span>
                  </td>

                  {/* Khoa */}
                  <td className="px-3 py-2.5 text-right align-middle text-slate-600 overflow-hidden">
                    <div className="truncate text-right" title={s.faculty || ''}>{s.faculty || '—'}</div>
                  </td>

                  {/* Ngành */}
                  <td className="px-3 py-2.5 text-right align-middle text-slate-600 overflow-hidden">
                    <div className="truncate text-right" title={s.major || s.school || ''}>{s.major || s.school || '—'}</div>
                  </td>

                  {/* Xác minh — luôn 1 dòng, không wrap dù kéo hẹp */}
                  <td className="px-3 py-2.5 text-center align-middle overflow-hidden whitespace-nowrap">
                    <div className="inline-flex justify-center max-w-full overflow-hidden whitespace-nowrap">
                      <VerifiedBadge verified={s.isVerified} />
                    </div>
                  </td>

                  {/* Trạng thái — luôn 1 dòng, không wrap dù kéo hẹp */}
                  <td className="px-3 py-2.5 text-center align-middle overflow-hidden whitespace-nowrap">
                    <div className="inline-flex justify-center max-w-full overflow-hidden whitespace-nowrap">
                      <ActiveBadge active={s.isActive} />
                    </div>
                  </td>

                  {/* Ngày tạo */}
                  <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                    <span className="block truncate">{fmtDate(s.createdAt)}</span>
                  </td>

                  {/* Thao tác - xem / khóa-mở / xóa */}
                  <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <button
                        type="button"
                        onClick={() => setViewingStudent(s)}
                        className="h-7 w-7 rounded-full bg-[#e8f3ff] text-[#0866db] hover:bg-[#1683ff] hover:text-white border border-[#dceafd] hover:border-[#1683ff] flex items-center justify-center transition-all cursor-pointer"
                        title="Xem chi tiết hồ sơ"
                        aria-label={`Xem chi tiết ${s.fullName || s.email}`}
                      >
                        <Eye size={14} />
                      </button>
                      {canLock && (
                        <button
                          type="button"
                          onClick={() => setLockTarget(s)}
                          className={`h-7 w-7 rounded-full flex items-center justify-center border shadow-sm transition-all cursor-pointer ${
                            s.isActive
                              ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white border-amber-200 hover:border-amber-600'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-200 hover:border-emerald-600'
                          }`}
                          title={s.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          aria-label={`${s.isActive ? 'Khóa' : 'Mở khóa'} ${s.fullName || s.email}`}
                        >
                          {s.isActive ? <Lock size={14} /> : <LockOpen size={14} />}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleting(s)}
                          className="h-7 w-7 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 flex items-center justify-center shadow-sm transition-all cursor-pointer"
                          title="Xóa sinh viên"
                          aria-label={`Xóa ${s.fullName || s.email}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer - gọn hiện đại: Tổng số | Số dòng/trang | range | 4 nút */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 sm:px-4 pt-3 pb-2 text-[11px] text-slate-500">
          <span className="font-normal">
            Tổng số: <span className="font-semibold text-slate-700">{total}</span>
          </span>

          <div className="flex-1" />

          <label className="inline-flex items-center gap-1.5 font-normal">
            Số dòng/trang
            <span className="relative inline-flex items-center">
              <select
                value={String(pageSize)}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="appearance-none h-7 pl-2.5 pr-7 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-600 cursor-pointer hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </span>
          </label>

          <span className="font-medium text-slate-600 tabular-nums whitespace-nowrap">
            {rangeFrom} - {rangeTo}
          </span>

          <div className="inline-flex items-center gap-0.5">
            <button
              type="button"
              disabled={canPrev}
              onClick={() => setPageIndex(1)}
              title="Trang đầu"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronsLeft size={13} />
            </button>
            <button
              type="button"
              disabled={canPrev}
              onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
              title="Trang trước"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              disabled={canNext}
              onClick={() => setPageIndex((p) => p + 1)}
              title="Trang sau"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight size={13} />
            </button>
            <button
              type="button"
              disabled={canNext}
              onClick={() => setPageIndex(totalPages)}
              title="Trang cuối"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronsRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filter Modal */}
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
          verifiedF,
          showDeleted,
          sortBy,
          sortDir,
        }}
        onApply={handleApplyModalFilters}
        onReset={resetAll}
      />

      {/* Student Detail Modal */}
      <StudentDetailModal
        isOpen={Boolean(viewingStudent)}
        studentId={viewingStudent?.id ?? null}
        fallbackItem={viewingStudent}
        onClose={() => setViewingStudent(null)}
      />

      {/* Delete Dialog */}
      {canDelete && (
        <StudentDeleteDialog
          isOpen={Boolean(deleting)}
          student={deleting}
          isLoading={deleteStudent.isPending}
          onClose={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}

      {/* Lock / Unlock Dialog */}
      <StudentLockDialog
        isOpen={Boolean(lockTarget)}
        student={lockTarget}
        isLoading={lockStudent.isPending || unlockStudent.isPending}
        onClose={() => setLockTarget(null)}
        onConfirm={confirmLockToggle}
      />
    </div>
  );
}
