import type { ReactNode } from 'react';

export interface ProfileSectionProps {
  number: string;
  tab: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function ProfileSection({ number, tab, title, subtitle, children }: ProfileSectionProps) {
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

export default ProfileSection;
