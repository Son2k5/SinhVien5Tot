import { Camera, LoaderCircle, ShieldCheck } from 'lucide-react';
import type { User } from '../../auth/types/auth.types';

export interface ProfileSidebarCardsProps {
  user: User;
  avatarPreview?: string;
  avatarError?: string;
  studentCode?: string;
  isAvatarPending: boolean;
  isAvatarError: boolean;
  isAvatarSuccess: boolean;
  avatarErrorMessage?: string;
  completedFields: number;
  totalFields: number;
  completionPercent: number;
  onUploadAvatar: (file?: File) => void;
}

export function ProfileSidebarCards({
  user,
  avatarPreview,
  avatarError,
  studentCode,
  isAvatarPending,
  isAvatarError,
  isAvatarSuccess,
  avatarErrorMessage,
  completedFields,
  totalFields,
  completionPercent,
  onUploadAvatar,
}: ProfileSidebarCardsProps) {
  return (
    <aside className='profile-sidebar'>
      <div className='profile-glass-card profile-id-card'>
        <div className='profile-avatar'>
          {avatarPreview ? (
            <img src={avatarPreview} alt={`Ảnh đại diện của ${user.name}`} />
          ) : (
            <span>{user.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <label className='profile-avatar-button'>
          {isAvatarPending ? (
            <LoaderCircle className='profile-spin' size={17} />
          ) : (
            <Camera size={17} />
          )}
          <span>{isAvatarPending ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}</span>
          <input
            type='file'
            accept='image/jpeg,image/png,image/webp'
            disabled={isAvatarPending}
            onChange={(event) => onUploadAvatar(event.target.files?.[0])}
          />
        </label>
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        {studentCode && <small>MSSV · {studentCode}</small>}
        <div aria-live='polite' className='profile-avatar-message'>
          {(avatarError || isAvatarError) && (
            <span>{avatarError || avatarErrorMessage}</span>
          )}
          {isAvatarSuccess && (
            <span className='is-success'>Ảnh đại diện đã được cập nhật.</span>
          )}
        </div>
      </div>

      <div className='profile-glass-card profile-completion-card'>
        <div className='profile-completion-card__head'>
          <h2>Độ hoàn thiện hồ sơ</h2>
          <strong>
            {completedFields}
            <span>/{totalFields}</span>
          </strong>
        </div>
        <div
          className='profile-progress'
          role='progressbar'
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionPercent}
          aria-label='Độ hoàn thiện hồ sơ'
        >
          <span style={{ width: `${completionPercent}%` }} />
        </div>
        <p>Hồ sơ đầy đủ giúp hệ thống xác minh chính xác các tiêu chí Sinh viên 5 Tốt.</p>
        <ul>
          <li>Đạo đức</li>
          <li>Học tập</li>
          <li>Thể lực</li>
          <li>Tình nguyện</li>
          <li>Hội nhập</li>
        </ul>
        <div className='profile-verified'>
          <ShieldCheck size={16} /> Tài khoản đã xác thực
        </div>
      </div>
    </aside>
  );
}

export default ProfileSidebarCards;
