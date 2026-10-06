import { Info } from 'lucide-react';
import type { UpdateUserProfilePayload } from '../types/user-profile.types';

export interface ProfileTextFieldProps {
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

export function ProfileTextField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = true,
  readOnly,
  full,
  maxLength,
  min,
  max,
  pattern,
  placeholder,
  hint,
}: ProfileTextFieldProps) {
  const id = `profile-${String(name)}`;
  return (
    <div className={`profile-field${full ? ' profile-field--full' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required ? <span aria-hidden='true'> *</span> : <em>Không bắt buộc</em>}
      </label>
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
      {hint && (
        <small id={`${id}-hint`}>
          <Info size={13} />
          {hint}
        </small>
      )}
    </div>
  );
}

export default ProfileTextField;
