import { useEffect, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface StudentFilterValues {
  school: string;
  faculty: string;
  major: string;
  cls: string;
  cohort: string;
  schoolYear: string;
  activeF: string;
  verifiedF: string;
  showDeleted: boolean;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

interface StudentFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues: StudentFilterValues;
  onApply: (values: StudentFilterValues) => void;
  onReset: () => void;
}

export function StudentFilterModal({ isOpen, onClose, initialValues, onApply, onReset }: StudentFilterModalProps) {
  const [values, setValues] = useState<StudentFilterValues>(initialValues);

  useEffect(() => {
    if (isOpen) setValues(initialValues);
  }, [isOpen, initialValues]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = () => { onApply(values); onClose(); };
  const handleReset = () => {
    const d: StudentFilterValues = { school: '', faculty: '', major: '', cls: '', cohort: '', schoolYear: '', activeF: '', verifiedF: '', showDeleted: false, sortBy: 'createdAt', sortDir: 'desc' };
    setValues(d); onReset(); onClose();
  };

  const activeCount =
    (values.school.trim() ? 1 : 0) + (values.faculty.trim() ? 1 : 0) + (values.major.trim() ? 1 : 0) + (values.cls.trim() ? 1 : 0) +
    (values.cohort.trim() ? 1 : 0) + (values.schoolYear.trim() ? 1 : 0) +
    (values.activeF !== '' ? 1 : 0) + (values.verifiedF !== '' ? 1 : 0) + (values.showDeleted ? 1 : 0);

  const inputCls = 'w-full h-10 px-3 text-[13px] font-normal text-slate-700 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white outline-none transition-colors focus:border-slate-400';
  const labelCls = 'block text-[13px] font-medium text-slate-600 mb-1.5';
  const segWrap = 'flex p-1 gap-1 bg-slate-100 rounded-xl';
  const segBtn = (active: boolean, color: string) =>
    `flex-1 h-9 px-2 rounded-lg text-[13px] whitespace-nowrap cursor-pointer transition-all ${active ? `bg-white shadow-sm font-medium ${color}` : 'font-normal text-slate-500 hover:text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 animate-in fade-in duration-150" onClick={onClose} role="dialog" aria-modal="true" aria-label="Bộ lọc chi tiết">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-800">Bộ lọc chi tiết</h3>
            <p className="mt-0.5 text-[13px] font-normal text-slate-500">
              Lọc theo trường, khoa, ngành, lớp và trạng thái hồ sơ
              {activeCount > 0 && <span className="ml-1 text-slate-400">({activeCount} đang chọn)</span>}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="w-8 h-8 shrink-0 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto space-y-6">
          <div>
            <p className="text-[13px] font-semibold text-slate-800">Thông tin đào tạo</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Trường</label>
                <input value={values.school} onChange={(e) => setValues({ ...values, school: e.target.value })} placeholder="VD: Đại học Bách khoa" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Khoa</label>
                <input value={values.faculty} onChange={(e) => setValues({ ...values, faculty: e.target.value })} placeholder="VD: Công nghệ thông tin" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ngành</label>
                <input value={values.major} onChange={(e) => setValues({ ...values, major: e.target.value })} placeholder="VD: Kỹ thuật phần mềm" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Lớp</label>
                <input value={values.cls} onChange={(e) => setValues({ ...values, cls: e.target.value })} placeholder="VD: 21TCLC1" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Khoá học</label>
                <input value={values.cohort} onChange={(e) => setValues({ ...values, cohort: e.target.value })} placeholder="VD: 2021" inputMode="numeric" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Năm học</label>
                <input value={values.schoolYear} onChange={(e) => setValues({ ...values, schoolYear: e.target.value })} placeholder="VD: 2024-2025" className={inputCls} />
              </div>
            </div>
          </div>
          <div className="h-px bg-slate-100" />
          <div>
            <p className="text-[13px] font-semibold text-slate-800">Trạng thái hồ sơ</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tình trạng tài khoản</label>
                <div className={segWrap}>
                  <button type="button" onClick={() => setValues({ ...values, activeF: '' })} className={segBtn(values.activeF === '', 'text-blue-600')}>Tất cả</button>
                  <button type="button" onClick={() => setValues({ ...values, activeF: '1' })} className={segBtn(values.activeF === '1', 'text-blue-600')}>Hoạt động</button>
                  <button type="button" onClick={() => setValues({ ...values, activeF: '0' })} className={segBtn(values.activeF === '0', 'text-blue-600')}>Vô hiệu hoá</button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Xác minh hồ sơ</label>
                <div className={segWrap}>
                  <button type="button" onClick={() => setValues({ ...values, verifiedF: '' })} className={segBtn(values.verifiedF === '', 'text-emerald-600')}>Tất cả</button>
                  <button type="button" onClick={() => setValues({ ...values, verifiedF: '1' })} className={segBtn(values.verifiedF === '1', 'text-emerald-600')}>Đã duyệt</button>
                  <button type="button" onClick={() => setValues({ ...values, verifiedF: '0' })} className={segBtn(values.verifiedF === '0', 'text-emerald-600')}>Chưa duyệt</button>
                </div>
              </div>
            </div>
          </div>
          <div className="h-px bg-slate-100" />
          <div>
            <p className="text-[13px] font-semibold text-slate-800">Sắp xếp & hiển thị</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className={labelCls}>Sắp xếp theo</label>
                <div className="relative">
                  <select value={`${values.sortBy}:${values.sortDir}`} onChange={(e) => { const [sortBy, sortDir] = e.target.value.split(':'); setValues({ ...values, sortBy, sortDir: sortDir as 'asc' | 'desc' }); }} className={`${inputCls} pr-9 appearance-none cursor-pointer`}>
                    <option value="createdAt:desc">Mới nhất trước</option>
                    <option value="createdAt:asc">Cũ nhất trước</option>
                    <option value="fullname:asc">Tên sinh viên (A-Z)</option>
                    <option value="fullname:desc">Tên sinh viên (Z-A)</option>
                    <option value="studentcode:asc">MSSV tăng dần</option>
                    <option value="email:asc">Email (A-Z)</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none pb-2">
                <input type="checkbox" checked={values.showDeleted} onChange={(e) => setValues({ ...values, showDeleted: e.target.checked })} className="w-4 h-4 rounded accent-slate-700 cursor-pointer" />
                <span className="text-[13px] font-normal text-slate-600">Bao gồm sinh viên đã xoá</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-white">
          <button type="button" onClick={handleReset} className="text-[13px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer transition-colors">Đặt lại</button>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={onClose} className="h-10 px-5 text-[13px] font-medium rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">Huỷ</button>
            <button type="button" onClick={handleApply} className="h-10 px-6 text-[13px] font-medium rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer">Áp dụng</button>
          </div>
        </div>
      </div>
    </div>
  );
}
