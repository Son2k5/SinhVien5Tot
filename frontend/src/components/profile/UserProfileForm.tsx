import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Camera, CheckCircle2, Info, LoaderCircle, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { useMyProfile, useUpdateMyAvatar, useUpdateMyProfile } from '../../hooks/profile/useUserProfile';
import type { User } from '../../types/auth';
import type { AddressType, UpdateUserProfilePayload, UserAddress, UserProfile } from '../../types/userProfile';

interface UserProfileFormProps { user: User; }

const emptyAddress = (addressType: AddressType): UserAddress => ({
  addressType,
  provinceOrCity: '',
  district: '',
  streetAddress: '',
});

const emptyProfile = (email = ''): UpdateUserProfilePayload => ({
  fullName: '', birthDate: '', gender: 'Other', identityCardNumber: '', ethnicity: '',
  school: '', major: '', academicYear: 1, studentCode: '', administrativeClass: '',
  faculty: '', currentPosition: '', contactEmail: email, phoneNumber: '', unionPosition: '',
  politicalStatus: 'None',
  addresses: [emptyAddress('Permanent'), emptyAddress('Temporary')],
});

function normalizeProfile(profile: UserProfile | null, email: string): UpdateUserProfilePayload {
  if (!profile) return emptyProfile(email);
  const addresses = Array.isArray(profile.addresses) ? profile.addresses : [];
  const address = (type: AddressType) =>
    addresses.find((item) => item.addressType === type) ?? emptyAddress(type);
  return {
    ...profile,
    fullName: profile.fullName ?? '',
    birthDate: profile.birthDate ? String(profile.birthDate).slice(0, 10) : '',
    gender: profile.gender ?? 'Other',
    identityCardNumber: profile.identityCardNumber ?? '',
    ethnicity: profile.ethnicity ?? '',
    school: profile.school ?? '',
    major: profile.major ?? '',
    academicYear: Number(profile.academicYear) || 1,
    studentCode: profile.studentCode ?? '',
    administrativeClass: profile.administrativeClass ?? '',
    faculty: profile.faculty ?? '',
    currentPosition: profile.currentPosition ?? '',
    contactEmail: profile.contactEmail ?? email,
    phoneNumber: profile.phoneNumber ?? '',
    unionPosition: profile.unionPosition ?? '',
    politicalStatus: profile.politicalStatus ?? 'None',
    addresses: [address('Permanent'), address('Temporary')],
  };
}

interface TextFieldProps {
  label: string;
  name: keyof UpdateUserProfilePayload;
  value: string | number;
  onChange: (name: keyof UpdateUserProfilePayload, value: string) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  full?: boolean;
  maxLength?: number;
  min?: number;
  max?: number | string;
  pattern?: string;
  placeholder?: string;
  hint?: string;
}

function TextField({
  label, name, value, onChange, type = 'text', required = true, readOnly, full,
  maxLength, min, max, pattern, placeholder, hint,
}: TextFieldProps) {
  const id = `profile-${String(name)}`;
  return (
    <div className={`profile-field${full ? ' profile-field--full' : ''}`}>
      <label htmlFor={id}>{label}{required ? <span aria-hidden='true'> *</span> : <em>Không bắt buộc</em>}</label>
      <input
        id={id}
        name={String(name)}
        value={value}
        type={type}
        required={required}
        readOnly={readOnly}
        maxLength={maxLength}
        min={min}
        max={max}
        pattern={pattern}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {hint && <small id={`${id}-hint`}><Info size={13} />{hint}</small>}
    </div>
  );
}

interface ProfileSectionProps {
  number: string;
  tab: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

function ProfileSection({ number, tab, title, subtitle, children }: ProfileSectionProps) {
  return (
    <section className='profile-section-card' aria-labelledby={`profile-section-${number}`}>
      <span className='profile-section-card__ghost' aria-hidden='true'>{number}</span>
      <span className='profile-section-card__tab'><b>{number}</b>{tab}</span>
      <header>
        <h2 id={`profile-section-${number}`}>{title}</h2>
        <p>{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

interface AddressFieldsProps {
  address: UserAddress;
  disabled?: boolean;
  required?: boolean;
  onChange: (type: AddressType, field: keyof Omit<UserAddress, 'addressType'>, value: string) => void;
}

function AddressFields({ address, disabled, required = true, onChange }: AddressFieldsProps) {
  const prefix = address.addressType === 'Permanent' ? 'permanent' : 'temporary';
  return (
    <div className='profile-field-grid'>
      <div className='profile-field'>
        <label htmlFor={`${prefix}-province`}>Tỉnh/Thành phố {required && <span aria-hidden='true'>*</span>}</label>
        <input id={`${prefix}-province`} required={required} maxLength={255} disabled={disabled} value={address.provinceOrCity} onChange={(event) => onChange(address.addressType, 'provinceOrCity', event.target.value)} />
      </div>
      <div className='profile-field'>
        <label htmlFor={`${prefix}-district`}>Quận/Huyện {required && <span aria-hidden='true'>*</span>}</label>
        <input id={`${prefix}-district`} required={required} maxLength={255} disabled={disabled} value={address.district} onChange={(event) => onChange(address.addressType, 'district', event.target.value)} />
      </div>
      <div className='profile-field profile-field--full'>
        <label htmlFor={`${prefix}-street`}>Địa chỉ chi tiết {required && <span aria-hidden='true'>*</span>}</label>
        <textarea id={`${prefix}-street`} required={required} rows={3} maxLength={500} disabled={disabled} value={address.streetAddress} onChange={(event) => onChange(address.addressType, 'streetAddress', event.target.value)} />
      </div>
    </div>
  );
}

export function UserProfileForm({ user }: UserProfileFormProps) {
  const profileQuery = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const updateAvatar = useUpdateMyAvatar();
  const [form, setForm] = useState<UpdateUserProfilePayload>(() => emptyProfile(user.email));
  const [sameAddress, setSameAddress] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
  const [avatarError, setAvatarError] = useState('');
  const maxBirthDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 16);
    return date.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (profileQuery.isSuccess) setForm(normalizeProfile(profileQuery.data, user.email));
  }, [profileQuery.data, profileQuery.isSuccess, user.email]);

  useEffect(() => {
    setAvatarPreview(user.avatarUrl);
  }, [user.avatarUrl]);

  const permanentAddress = form.addresses.find((address) => address.addressType === 'Permanent') ?? emptyAddress('Permanent');
  const temporaryAddress = form.addresses.find((address) => address.addressType === 'Temporary') ?? emptyAddress('Temporary');
  const completionValues = [
    form.fullName, form.birthDate, form.identityCardNumber, form.ethnicity, form.school,
    form.faculty, form.studentCode, form.administrativeClass, form.currentPosition,
    form.contactEmail, form.phoneNumber, permanentAddress.provinceOrCity,
    permanentAddress.district, permanentAddress.streetAddress,
  ];
  const completedFields = completionValues.filter((value) => String(value).trim()).length;
  const completionPercent = Math.round((completedFields / completionValues.length) * 100);

  const setValue = (name: keyof UpdateUserProfilePayload, value: string) => {
    setForm((current) => ({ ...current, [name]: name === 'academicYear' ? Number(value) : value }));
  };

  const setAddress = (type: AddressType, field: keyof Omit<UserAddress, 'addressType'>, value: string) => {
    setForm((current) => ({
      ...current,
      addresses: current.addresses.map((address) => {
        if (address.addressType === type) return { ...address, [field]: value };
        if (sameAddress && type === 'Permanent' && address.addressType === 'Temporary') return { ...address, [field]: value };
        return address;
      }),
    }));
  };

  const toggleSameAddress = (checked: boolean) => {
    setSameAddress(checked);
    if (!checked) return;
    setForm((current) => ({
      ...current,
      addresses: current.addresses.map((address) =>
        address.addressType === 'Temporary' ? { ...permanentAddress, addressType: 'Temporary' } : address),
    }));
  };

  const uploadAvatar = (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setAvatarError('Chỉ chấp nhận JPEG, PNG hoặc WebP không vượt quá 5 MB.');
      return;
    }
    setAvatarError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
    updateAvatar.mutate(file);
  };

  if (profileQuery.isPending) {
    return <div className='profile-loading' aria-label='Đang tải hồ sơ' />;
  }

  if (profileQuery.isError) {
    return (
      <div role='alert' className='profile-error-state'>
        <h2>Không thể tải hồ sơ</h2>
        <p>{profileQuery.error.message}</p>
        <button type='button' onClick={() => void profileQuery.refetch()}><RotateCcw size={17} /> Thử lại</button>
      </div>
    );
  }

  return (
    <form
      className='profile-layout'
      onSubmit={(event) => {
        event.preventDefault();
        updateProfile.mutate({
          ...form,
          addresses: form.addresses.filter((address) =>
            address.addressType === 'Permanent' ||
            address.provinceOrCity.trim() || address.district.trim() || address.streetAddress.trim()),
        });
      }}
    >
      <aside className='profile-sidebar'>
        <div className='profile-glass-card profile-id-card'>
          <div className='profile-avatar'>
            {avatarPreview ? <img src={avatarPreview} alt={`Ảnh đại diện của ${user.name}`} /> : <span>{user.name.slice(0, 2).toUpperCase()}</span>}
          </div>
          <label className='profile-avatar-button'>
            {updateAvatar.isPending ? <LoaderCircle className='profile-spin' size={17} /> : <Camera size={17} />}
            <span>{updateAvatar.isPending ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}</span>
            <input type='file' accept='image/jpeg,image/png,image/webp' disabled={updateAvatar.isPending} onChange={(event) => uploadAvatar(event.target.files?.[0])} />
          </label>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          {form.studentCode && <small>MSSV · {form.studentCode}</small>}
          <div aria-live='polite' className='profile-avatar-message'>
            {(avatarError || updateAvatar.isError) && <span>{avatarError || updateAvatar.error?.message}</span>}
            {updateAvatar.isSuccess && <span className='is-success'>Ảnh đại diện đã được cập nhật.</span>}
          </div>
        </div>

        <div className='profile-glass-card profile-completion-card'>
          <div className='profile-completion-card__head'><h2>Độ hoàn thiện hồ sơ</h2><strong>{completedFields}<span>/{completionValues.length}</span></strong></div>
          <div className='profile-progress' role='progressbar' aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent} aria-label='Độ hoàn thiện hồ sơ'>
            <span style={{ width: `${completionPercent}%` }} />
          </div>
          <p>Hồ sơ đầy đủ giúp hệ thống xác minh chính xác các tiêu chí Sinh viên 5 Tốt.</p>
          <ul><li>Đạo đức</li><li>Học tập</li><li>Thể lực</li><li>Tình nguyện</li><li>Hội nhập</li></ul>
          <div className='profile-verified'><ShieldCheck size={16} /> Tài khoản đã xác thực</div>
        </div>
      </aside>

      <div className='profile-main-column'>
        <ProfileSection number='01' tab='Định danh' title='Định danh cá nhân' subtitle='Thông tin dùng để xác thực hồ sơ của bạn với phòng Công tác sinh viên.'>
          <div className='profile-field-grid'>
            <TextField label='Họ và tên' name='fullName' value={form.fullName} onChange={setValue} maxLength={255} full />
            <TextField label='Ngày sinh' name='birthDate' value={form.birthDate} onChange={setValue} type='date' max={maxBirthDate} />
            <div className='profile-field'><label htmlFor='profile-gender'>Giới tính <span aria-hidden='true'>*</span></label><select id='profile-gender' required value={form.gender} onChange={(event) => setValue('gender', event.target.value)}><option value='Male'>Nam</option><option value='Female'>Nữ</option><option value='Other'>Khác</option></select></div>
            <TextField label='CCCD/Hộ chiếu' name='identityCardNumber' value={form.identityCardNumber} onChange={setValue} maxLength={50} hint='Nhập đúng số trên giấy tờ tùy thân.' />
            <TextField label='Dân tộc' name='ethnicity' value={form.ethnicity} onChange={setValue} maxLength={100} />
          </div>
        </ProfileSection>

        <ProfileSection number='02' tab='Học tập' title='Thông tin học tập' subtitle='Dữ liệu học vụ được đối chiếu với hệ thống quản lý đào tạo của trường.'>
          <div className='profile-field-grid'>
            <TextField label='Trường' name='school' value={form.school} onChange={setValue} maxLength={255} full />
            <TextField label='Khoa/Viện' name='faculty' value={form.faculty} onChange={setValue} maxLength={255} />
            <TextField label='Ngành học' name='major' value={form.major ?? ''} onChange={setValue} required={false} maxLength={255} />
            <TextField label='Năm học hiện tại' name='academicYear' value={form.academicYear} onChange={setValue} type='number' min={1} max={8} />
            <TextField label='Mã sinh viên' name='studentCode' value={form.studentCode} onChange={setValue} maxLength={50} readOnly={Boolean(profileQuery.data?.studentCode)} hint={profileQuery.data?.studentCode ? 'Mã sinh viên đã xác nhận không thể tự thay đổi.' : undefined} />
            <TextField label='Lớp hành chính' name='administrativeClass' value={form.administrativeClass} onChange={setValue} maxLength={100} />
          </div>
        </ProfileSection>

        <ProfileSection number='03' tab='Đoàn thể' title='Đoàn thể - chính trị' subtitle='Vai trò trong tổ chức Đoàn/Hội là một trong các tiêu chí phụ khi xét duyệt danh hiệu.'>
          <div className='profile-field-grid'>
            <TextField label='Chức vụ hiện tại' name='currentPosition' value={form.currentPosition} onChange={setValue} maxLength={255} />
            <TextField label='Chức vụ Đoàn/Hội' name='unionPosition' value={form.unionPosition ?? ''} onChange={setValue} required={false} maxLength={255} />
            <div className='profile-field profile-field--full'><label htmlFor='profile-political-status'>Trạng thái chính trị <span aria-hidden='true'>*</span></label><select id='profile-political-status' required value={form.politicalStatus} onChange={(event) => setValue('politicalStatus', event.target.value)}><option value='None'>Chưa tham gia</option><option value='UnionMember'>Đoàn viên</option><option value='PartyMember'>Đảng viên</option></select></div>
          </div>
        </ProfileSection>

        <ProfileSection number='04' tab='Liên hệ' title='Thông tin liên hệ' subtitle='Dùng để gửi kết quả xét duyệt và các mốc thời gian quan trọng.'>
          <div className='profile-field-grid'>
            <TextField label='Email liên hệ' name='contactEmail' value={form.contactEmail} onChange={setValue} type='email' maxLength={255} />
            <TextField label='Số điện thoại' name='phoneNumber' value={form.phoneNumber} onChange={setValue} type='tel' maxLength={30} pattern='(0|\+84)[0-9]{9,10}' placeholder='0901234567' />
          </div>
        </ProfileSection>

        <ProfileSection number='05' tab='Địa chỉ' title='Địa chỉ' subtitle='Địa chỉ thường trú theo giấy tờ tùy thân; tạm trú chỉ cần khi khác nơi thường trú.'>
          <div className='profile-address-block'><h3>Địa chỉ thường trú <span aria-hidden='true'>*</span></h3><AddressFields address={permanentAddress} onChange={setAddress} /></div>
          <label className='profile-same-address'><input type='checkbox' checked={sameAddress} onChange={(event) => toggleSameAddress(event.target.checked)} /><span>Địa chỉ tạm trú giống địa chỉ thường trú</span></label>
          <div className={`profile-address-block${sameAddress ? ' is-synced' : ''}`}><h3>Địa chỉ tạm trú <em>{sameAddress ? 'Đã tự điền' : 'Không bắt buộc'}</em></h3><AddressFields address={temporaryAddress} disabled={sameAddress} required={false} onChange={setAddress} /></div>
        </ProfileSection>

        <div aria-live='polite' className='profile-submit-message'>
          {updateProfile.isError && <p role='alert'>{updateProfile.error.message}</p>}
          {updateProfile.isSuccess && <p className='is-success'><CheckCircle2 size={18} /> Hồ sơ đã được cập nhật thành công.</p>}
        </div>
        <div className='profile-action-bar'>
          <button type='button' className='profile-button profile-button--secondary' onClick={() => { setForm(normalizeProfile(profileQuery.data, user.email)); setSameAddress(false); }}><RotateCcw size={17} /> Khôi phục</button>
          <button type='submit' className='profile-button profile-button--primary' disabled={updateProfile.isPending}>{updateProfile.isPending ? <LoaderCircle className='profile-spin' size={18} /> : <Save size={18} />}{updateProfile.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </div>
      </div>
    </form>
  );
}
