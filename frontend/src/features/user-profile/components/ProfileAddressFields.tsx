import type { AddressType, UserAddress } from '../types/user-profile.types';

export interface ProfileAddressFieldsProps {
  address: UserAddress;
  disabled?: boolean;
  required?: boolean;
  onChange: (type: AddressType, field: keyof Omit<UserAddress, 'addressType'>, value: string) => void;
}

export function ProfileAddressFields({
  address,
  disabled,
  required = true,
  onChange,
}: ProfileAddressFieldsProps) {
  const prefix = address.addressType === 'Permanent' ? 'permanent' : 'temporary';
  return (
    <div className='profile-field-grid'>
      <div className='profile-field'>
        <label htmlFor={`${prefix}-province`}>
          Tỉnh/Thành phố {required && <span aria-hidden='true'>*</span>}
        </label>
        <input
          id={`${prefix}-province`}
          required={required}
          maxLength={255}
          disabled={disabled}
          value={address.provinceOrCity}
          onChange={(event) => onChange(address.addressType, 'provinceOrCity', event.target.value)}
        />
      </div>
      <div className='profile-field'>
        <label htmlFor={`${prefix}-district`}>
          Quận/Huyện {required && <span aria-hidden='true'>*</span>}
        </label>
        <input
          id={`${prefix}-district`}
          required={required}
          maxLength={255}
          disabled={disabled}
          value={address.district}
          onChange={(event) => onChange(address.addressType, 'district', event.target.value)}
        />
      </div>
      <div className='profile-field profile-field--full'>
        <label htmlFor={`${prefix}-street`}>
          Địa chỉ chi tiết {required && <span aria-hidden='true'>*</span>}
        </label>
        <textarea
          id={`${prefix}-street`}
          required={required}
          rows={3}
          maxLength={500}
          disabled={disabled}
          value={address.streetAddress}
          onChange={(event) => onChange(address.addressType, 'streetAddress', event.target.value)}
        />
      </div>
    </div>
  );
}

export default ProfileAddressFields;
