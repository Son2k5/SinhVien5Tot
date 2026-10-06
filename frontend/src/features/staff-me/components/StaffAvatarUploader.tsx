import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export interface StaffAvatarUploaderProps {
  avatarUrl: string | null;
  fullName: string;
  isUpdating: boolean;
  isRemoving: boolean;
  uploadProgress: number | null;
  onUpload: (file: File) => Promise<void>;
  onRemoveRequest: () => void;
}

export function StaffAvatarUploader({
  avatarUrl,
  fullName,
  isUpdating,
  isRemoving,
  uploadProgress,
  onUpload,
  onRemoveRequest,
}: StaffAvatarUploaderProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const cleanupPreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupPreviewUrl();
    };
  }, [cleanupPreviewUrl]);

  const validateAvatarFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
    const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type);

    if (!isAllowedExt && !isAllowedMime) {
      return 'Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WebP.';
    }
    if (file.size <= 0) {
      return 'Tập tin ảnh không hợp lệ hoặc rỗng.';
    }
    if (file.size > MAX_AVATAR_SIZE) {
      return 'Kích thước ảnh đại diện không được vượt quá 5 MB.';
    }
    return null;
  };

  const processAvatarUpload = async (file: File) => {
    const errorMsg = validateAvatarFile(file);
    if (errorMsg) {
      setAvatarError(errorMsg);
      return;
    }

    setAvatarError(null);
    setPendingAvatarFile(file);

    cleanupPreviewUrl();
    const localUrl = URL.createObjectURL(file);
    previewUrlRef.current = localUrl;
    setAvatarPreview(localUrl);

    try {
      await onUpload(file);
      setPendingAvatarFile(null);
      cleanupPreviewUrl();
      setAvatarPreview(null);
    } catch {
      setAvatarError('Không thể tải lên ảnh đại diện. Vui lòng bấm "Thử lại".');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processAvatarUpload(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processAvatarUpload(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleRetry = () => {
    if (pendingAvatarFile) {
      void processAvatarUpload(pendingAvatarFile);
    }
  };

  const avatarDisplay = avatarPreview || avatarUrl;
  const initial = fullName ? fullName.trim().charAt(0).toUpperCase() : 'U';

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`relative group rounded-full p-1 transition-all ${
          isDraggingOver
            ? 'ring-4 ring-blue-400 ring-offset-2 scale-105'
            : 'ring-2 ring-slate-100'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center relative shadow-sm">
          {avatarDisplay ? (
            <img
              src={avatarDisplay}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white font-extrabold text-4xl flex items-center justify-center select-none">
              {initial}
            </div>
          )}

          {/* Loading spinner overlay */}
          {(isUpdating || isRemoving) && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white">
              <Loader2 size={24} className="animate-spin text-white" />
              <span className="text-[10px] font-medium mt-1">Đang xử lý...</span>
            </div>
          )}

          {/* Hover upload trigger overlay */}
          {!isUpdating && !isRemoving && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
              title="Bấm hoặc kéo-thả để đổi ảnh"
              aria-label="Đổi ảnh đại diện"
            >
              <Camera size={22} />
              <span className="text-[10px] font-medium mt-1">Đổi ảnh</span>
            </button>
          )}
        </div>

        {/* Quick Camera Action Badge */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUpdating || isRemoving}
          className="absolute bottom-1 right-1 p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
          title="Tải ảnh mới"
          aria-label="Chọn tệp ảnh đại diện"
        >
          <Camera size={14} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Progress bar */}
      {uploadProgress !== null && (
        <div className="w-48 mt-3">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
            <span>Đang tải lên</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Avatar error feedback & retry */}
      {avatarError && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center justify-between gap-2 max-w-sm">
          <span className="flex-1 text-left leading-tight">{avatarError}</span>
          {pendingAvatarFile && (
            <button
              type="button"
              onClick={handleRetry}
              className="px-2 py-1 text-[11px] font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-md shrink-0 cursor-pointer"
            >
              Thử lại
            </button>
          )}
        </div>
      )}

      {/* Upload instructions & remove avatar button */}
      <div className="mt-3 space-y-1.5">
        <p className="text-[11px] text-slate-400">
          Hỗ trợ JPG, PNG, WebP (tối đa 5 MB). Kéo thả ảnh trực tiếp vào khung.
        </p>

        {avatarUrl && !isUpdating && !isRemoving && (
          <button
            type="button"
            onClick={onRemoveRequest}
            className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:underline pt-1 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Xoá ảnh đại diện</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default StaffAvatarUploader;
