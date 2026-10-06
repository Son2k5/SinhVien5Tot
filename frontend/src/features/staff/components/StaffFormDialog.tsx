import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Send,
  Shield,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  type CreateStaffPayload,
  type Staff,
  type StaffApiError,
  type UpdateStaffPayload,
} from '../types/staff.types';
import {
  getFreshStaff,
  useCreateStaff,
  useSendInvitation,
  useUpdateStaff,
} from '../hooks/useStaff';

export interface StaffFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: Staff | null;
  onSuccess?: (staff: Staff, invitationSent?: boolean) => void;
}

interface FormValues {
  email: string;
  fullName: string;
  phone: string;
  role: 'Mentor';
  rowVersion: string;
}

interface FormErrors {
  email?: string;
  fullName?: string;
  phone?: string;
  role?: string;
  general?: string;
}

const VIETNAMESE_PHONE_REGEX = /^(0|\+84)\d{9,10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StaffFormDialog({
  isOpen,
  onClose,
  staff,
  onSuccess,
}: StaffFormDialogProps) {
  const isEdit = Boolean(staff);

  const [values, setValues] = useState<FormValues>({
    email: '',
    fullName: '',
    phone: '',
    role: 'Mentor',
    rowVersion: '',
  });

  const [initialValues, setInitialValues] = useState<FormValues>({
    email: '',
    fullName: '',
    phone: '',
    role: 'Mentor',
    rowVersion: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [creationResult, setCreationResult] = useState<{
    staff: Staff;
    invitationSent: boolean;
  } | null>(null);
  const [isReloadingFresh, setIsReloadingFresh] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const sendInvitation = useSendInvitation();

  const isSubmitting = createStaff.isPending || updateStaff.isPending;

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const init: FormValues = {
        email: staff?.email ?? '',
        fullName: staff?.fullName ?? '',
        phone: staff?.phone ?? '',
        role: 'Mentor',
        rowVersion: staff?.rowVersion ?? '',
      };
      setValues(init);
      setInitialValues(init);
      setErrors({});
      setShowDiscardConfirm(false);
      setShowConflictDialog(false);
      setCreationResult(null);

      // Focus first input
      setTimeout(() => {
        if (isEdit) {
          fullNameInputRef.current?.focus();
        } else {
          emailInputRef.current?.focus();
        }
      }, 50);
    }
  }, [isOpen, staff, isEdit]);

  const isDirty =
    values.email !== initialValues.email ||
    values.fullName !== initialValues.fullName ||
    values.phone !== initialValues.phone ||
    values.role !== initialValues.role;

  // Handle Close / Cancel
  const handleRequestClose = () => {
    if (creationResult) {
      onClose();
      return;
    }
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Keyboard navigation & Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showConflictDialog) {
          setShowConflictDialog(false);
          return;
        }
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
          return;
        }
        handleRequestClose();
      }

      // Simple focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty, showConflictDialog, showDiscardConfirm, creationResult]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!isEdit) {
      const emailTrim = values.email.trim();
      if (!emailTrim) {
        newErrors.email = 'Email không được để trống.';
      } else if (emailTrim.length > 254) {
        newErrors.email = 'Email không được vượt quá 254 ký tự.';
      } else if (!EMAIL_REGEX.test(emailTrim)) {
        newErrors.email = 'Định dạng email không hợp lệ.';
      }
    }

    const nameTrim = values.fullName.trim();
    if (!nameTrim) {
      newErrors.fullName = 'Họ và tên không được để trống.';
    } else if (nameTrim.length > 100) {
      newErrors.fullName = 'Họ và tên không được vượt quá 100 ký tự.';
    }

    const phoneTrim = values.phone.trim();
    if (phoneTrim) {
      if (phoneTrim.length > 20 || !VIETNAMESE_PHONE_REGEX.test(phoneTrim)) {
        newErrors.phone =
          'Số điện thoại không hợp lệ (ví dụ: 0912345678 hoặc +84912345678).';
      }
    }

    setErrors(newErrors);

    // Focus first error
    if (newErrors.email && emailInputRef.current) {
      emailInputRef.current.focus();
    } else if (newErrors.fullName && fullNameInputRef.current) {
      fullNameInputRef.current.focus();
    } else if (newErrors.phone && phoneInputRef.current) {
      phoneInputRef.current.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    setErrors({});

    if (!isEdit) {
      // CREATE
      const payload: CreateStaffPayload = {
        email: values.email.trim(),
        fullName: values.fullName.trim(),
        phone: values.phone.trim() || null,
        role: 'Mentor',
      };

      try {
        const res = await createStaff.mutateAsync(payload);
        setCreationResult({
          staff: res.staff,
          invitationSent: res.invitationSent,
        });
        onSuccess?.(res.staff, res.invitationSent);
      } catch (err: unknown) {
        const apiError = err as StaffApiError;
        if (apiError.isConflict || apiError.code === 'email_taken') {
          setErrors({ email: 'Email này đã được sử dụng.' });
          emailInputRef.current?.focus();
        } else {
          setErrors({ general: apiError.message });
        }
      }
    } else if (staff) {
      // UPDATE
      const payload: UpdateStaffPayload = {
        fullName: values.fullName.trim(),
        phone: values.phone.trim() || null,
        role: 'Mentor',
        rowVersion: values.rowVersion,
      };

      try {
        const updated = await updateStaff.mutateAsync({
          id: staff.id,
          payload,
        });
        onSuccess?.(updated);
        onClose();
      } catch (err: unknown) {
        const apiError = err as StaffApiError;
        if (
          apiError.isConflict ||
          apiError.code === 'concurrency_conflict' ||
          apiError.code === 'staff_concurrency_conflict'
        ) {
          setShowConflictDialog(true);
        } else {
          setErrors({ general: apiError.message });
        }
      }
    }
  };

  // Reload fresh copy on concurrency conflict
  const handleReloadFresh = async () => {
    if (!staff) return;
    setIsReloadingFresh(true);
    try {
      const fresh = await getFreshStaff(staff.id);
      const updatedValues: FormValues = {
        email: fresh.email,
        fullName: fresh.fullName,
        phone: fresh.phone ?? '',
        role: 'Mentor',
        rowVersion: fresh.rowVersion,
      };
      setValues(updatedValues);
      setInitialValues(updatedValues);
      setErrors({});
      setShowConflictDialog(false);
    } catch (err: unknown) {
      const apiError = err as StaffApiError;
      setErrors({ general: `Không thể tải lại dữ liệu mới: ${apiError.message}` });
    } finally {
      setIsReloadingFresh(false);
    }
  };

  // Resend invitation if creation invitation failed
  const handleResendCreatedInvitation = async () => {
    if (!creationResult?.staff.id) return;
    try {
      await sendInvitation.mutateAsync(creationResult.staff.id);
      setCreationResult((prev) => (prev ? { ...prev, invitationSent: true } : null));
    } catch (err: unknown) {
      const apiError = err as StaffApiError;
      setErrors({ general: apiError.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-dialog-title"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserIcon size={18} />
            </div>
            <div>
              <h2
                id="staff-dialog-title"
                className="text-base font-bold text-slate-800 m-0"
              >
                {isEdit ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự mới'}
              </h2>
              <p className="text-xs text-slate-500 m-0">
                {isEdit
                  ? 'Cập nhật thông tin nhân sự trong hệ thống'
                  : 'Tạo tài khoản và gửi email thiết lập mật khẩu'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
          {/* Success After Creation View */}
          {creationResult && (
            <div className="space-y-4">
              {creationResult.invitationSent ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Tạo tài khoản thành công</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Đã gửi email đặt mật khẩu tới{' '}
                      <strong className="font-semibold text-emerald-900">
                        {creationResult.staff.email}
                      </strong>
                      . Nhân sự có thể kiểm tra hộp thư để kích hoạt tài khoản.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-semibold">
                      Đã tạo tài khoản nhưng chưa gửi được email
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Tài khoản cho{' '}
                      <strong className="font-semibold text-amber-900">
                        {creationResult.staff.email}
                      </strong>{' '}
                      đã được tạo thành công, tuy nhiên hệ thống email chưa gửi được thư kích hoạt.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendCreatedInvitation}
                      disabled={sendInvitation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {sendInvitation.isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      <span>Gửi lại lời mời ngay</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Staff Details Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Họ và tên:</span>
                  <span className="font-semibold text-slate-800">
                    {creationResult.staff.fullName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-800">{creationResult.staff.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vai trò:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                    <Shield size={12} /> Mentor
                  </span>
                </div>
                {creationResult.staff.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số điện thoại:</span>
                    <span className="font-mono text-slate-800">
                      {creationResult.staff.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Normal Form */}
          {!creationResult && (
            <form id="staff-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* General error banner */}
              {errors.general && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="staff-email"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Email đăng nhập <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={15} />
                  </div>
                  <input
                    ref={emailInputRef}
                    id="staff-email"
                    type="email"
                    value={values.email}
                    onChange={(e) => {
                      setValues((prev) => ({ ...prev, email: e.target.value }));
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    disabled={isEdit || isSubmitting}
                    readOnly={isEdit}
                    placeholder="example@hcmut.edu.vn"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-all outline-none ${
                      isEdit
                        ? 'bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed select-none'
                        : errors.email
                        ? 'bg-white border-rose-400 text-slate-900 focus:ring-2 focus:ring-rose-200'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-slate-400'
                    }`}
                  />
                </div>
                {isEdit ? (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Info size={12} className="shrink-0" /> Email không thể thay đổi sau khi tạo tài khoản.
                  </p>
                ) : errors.email ? (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.email}
                  </p>
                ) : null}
              </div>

              {/* Full Name field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="staff-fullname"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon size={15} />
                  </div>
                  <input
                    ref={fullNameInputRef}
                    id="staff-fullname"
                    type="text"
                    maxLength={100}
                    value={values.fullName}
                    onChange={(e) => {
                      setValues((prev) => ({ ...prev, fullName: e.target.value }));
                      if (errors.fullName)
                        setErrors((prev) => ({ ...prev, fullName: undefined }));
                    }}
                    disabled={isSubmitting}
                    placeholder="Nguyễn Văn A"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-all outline-none ${
                      errors.fullName
                        ? 'bg-white border-rose-400 text-slate-900 focus:ring-2 focus:ring-rose-200'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-slate-400'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.fullName}
                  </p>
                )}
              </div>

              {/* Phone field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="staff-phone"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Số điện thoại <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={15} />
                  </div>
                  <input
                    ref={phoneInputRef}
                    id="staff-phone"
                    type="tel"
                    maxLength={20}
                    value={values.phone}
                    onChange={(e) => {
                      setValues((prev) => ({ ...prev, phone: e.target.value }));
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    disabled={isSubmitting}
                    placeholder="0912345678 hoặc +84912345678"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-all outline-none font-mono ${
                      errors.phone
                        ? 'bg-white border-rose-400 text-slate-900 focus:ring-2 focus:ring-rose-200'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-slate-400'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.phone}
                  </p>
                )}
              </div>

              {/* Role selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Vai trò quản trị <span className="text-rose-500">*</span>
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      M
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 m-0">Mentor</p>
                      <p className="text-[11px] text-slate-500 m-0">
                        Cán bộ hướng dẫn, thẩm định minh chứng và theo dõi hồ sơ
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Mặc định
                  </span>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          {creationResult ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRequestClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="staff-form"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                <span>{isEdit ? 'Lưu thay đổi' : 'Thêm nhân sự'}</span>
              </button>
            </>
          )}
        </div>

        {/* Concurrency Conflict Dialog (409 on Update) */}
        {showConflictDialog && (
          <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    Hồ sơ đã được người khác chỉnh sửa
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Dữ liệu trên máy chủ đã thay đổi trong lúc bạn thao tác. Bạn có thể tải lại bản mới nhất hoặc ở lại để sao chép thông tin đang nhập.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConflictDialog(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Ở lại
                </button>
                <button
                  type="button"
                  onClick={handleReloadFresh}
                  disabled={isReloadingFresh}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isReloadingFresh ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <RefreshCw size={12} />
                  )}
                  <span>Tải lại bản mới</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discard changes confirm */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    Hủy bỏ các thay đổi?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bạn có những thay đổi chưa lưu. Nếu đóng, các thông tin này sẽ bị mất.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Tiếp tục chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                >
                  Bỏ thay đổi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffFormDialog;
