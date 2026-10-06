import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Save,
} from 'lucide-react';
import { StaffMeError, type StaffProfile } from '../types/staff-me.types';

const PHONE_REGEX = /^(0|\+84)\d{9,10}$/;

export interface StaffProfileFormProps {
  profile: StaffProfile;
  isUpdating: boolean;
  updateError: unknown;
  onUpdate: (payload: { fullName: string; phone: string | null; rowVersion: string }) => Promise<void>;
  onConflict: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function StaffProfileForm({
  profile,
  isUpdating,
  updateError,
  onUpdate,
  onConflict,
  onDirtyChange,
}: StaffProfileFormProps) {
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [formErrors, setFormErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Sync server profile to local form state
  useEffect(() => {
    setFullName(profile.fullName || '');
    setPhone(profile.phone || '');
    setFormErrors({});
    setSaveSuccessNotice(false);
  }, [profile]);

  const isDirty = Boolean(
    fullName.trim() !== (profile.fullName || '').trim() ||
      phone.trim() !== (profile.phone || '').trim()
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const validateForm = (): boolean => {
    const errors: { fullName?: string; phone?: string } = {};
    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      errors.fullName = 'Họ tên không được để trống.';
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      errors.fullName = 'Họ tên phải có từ 2 đến 100 ký tự.';
    } else if (Array.from(trimmedName).some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)) {
      errors.fullName = 'Họ tên chứa ký tự không hợp lệ.';
    }

    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      errors.phone = 'Số điện thoại không đúng định dạng (VD: 0912345678 hoặc +84912345678).';
    }

    setFormErrors(errors);

    if (errors.fullName && fullNameInputRef.current) {
      fullNameInputRef.current.focus();
      return false;
    }
    if (errors.phone && phoneInputRef.current) {
      phoneInputRef.current.focus();
      return false;
    }

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaveSuccessNotice(false);

    try {
      await onUpdate({
        fullName: fullName.trim(),
        phone: phone.trim() ? phone.trim() : null,
        rowVersion: profile.rowVersion,
      });
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 5000);
    } catch (err: unknown) {
      if (err instanceof StaffMeError && err.isConflict) {
        onConflict();
      }
    }
  };

  const handleReset = () => {
    setFullName(profile.fullName || '');
    setPhone(profile.phone || '');
    setFormErrors({});
    setSaveSuccessNotice(false);
  };

  const hasFormErrors = Boolean(formErrors.fullName || formErrors.phone);

  return (
    <div className="lg:col-span-7 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            Thông tin cá nhân
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cập nhật họ tên hiển thị và số điện thoại liên lạc của bạn trong ban quản trị.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          {/* Inline Save Success Banner */}
          {saveSuccessNotice && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in"
            >
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="font-medium">
                Đã cập nhật thông tin cá nhân thành công!
              </span>
            </div>
          )}

          {/* General API error (other than 409) */}
          {Boolean(updateError) &&
            (!(updateError instanceof StaffMeError) || !updateError.isConflict) && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fade-in"
              >
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Lưu thay đổi thất bại</div>
                  <div className="mt-0.5 text-rose-700">
                    {updateError instanceof Error
                      ? updateError.message
                      : 'Đã có lỗi xảy ra khi cập nhật hồ sơ.'}
                  </div>
                </div>
              </div>
            )}

          {/* Full Name Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="staff-fullname"
              className="block text-xs font-bold text-slate-700"
            >
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              id="staff-fullname"
              ref={fullNameInputRef}
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (formErrors.fullName) {
                  setFormErrors((prev) => ({ ...prev, fullName: undefined }));
                }
              }}
              maxLength={100}
              placeholder="Nhập họ và tên đầy đủ"
              aria-invalid={Boolean(formErrors.fullName)}
              aria-describedby={formErrors.fullName ? 'staff-fullname-error' : undefined}
              className={`w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-[border-color,box-shadow] ${
                formErrors.fullName
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              }`}
            />
            {formErrors.fullName && (
              <p
                id="staff-fullname-error"
                className="text-[11px] text-rose-600 flex items-center gap-1.5 mt-1"
              >
                <AlertCircle size={13} className="shrink-0" />
                <span>{formErrors.fullName}</span>
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              Tên hiển thị tại thanh điều hướng và trong các biên bản thẩm định (từ 2 đến 100 ký tự).
            </p>
          </div>

          {/* Phone Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="staff-phone"
              className="block text-xs font-bold text-slate-700"
            >
              Số điện thoại <span className="text-slate-400 font-normal">(không bắt buộc)</span>
            </label>
            <input
              id="staff-phone"
              ref={phoneInputRef}
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (formErrors.phone) {
                  setFormErrors((prev) => ({ ...prev, phone: undefined }));
                }
              }}
              maxLength={15}
              placeholder="VD: 0912345678 hoặc +84912345678"
              aria-invalid={Boolean(formErrors.phone)}
              aria-describedby={formErrors.phone ? 'staff-phone-error' : undefined}
              className={`w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-[border-color,box-shadow] ${
                formErrors.phone
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              }`}
            />
            {formErrors.phone && (
              <p
                id="staff-phone-error"
                className="text-[11px] text-rose-600 flex items-center gap-1.5 mt-1"
              >
                <AlertCircle size={13} className="shrink-0" />
                <span>{formErrors.phone}</span>
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              Định dạng hợp lệ: Bắt đầu bằng 0 hoặc +84 kèm 9-10 chữ số tiếp theo.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || isUpdating}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Hoàn tác</span>
            </button>

            <button
              type="submit"
              disabled={!isDirty || isUpdating || hasFormErrors}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {isUpdating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StaffProfileForm;
