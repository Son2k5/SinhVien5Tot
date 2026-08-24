import type { User } from '../types/auth';

export type AppRole = 'Admin' | 'Mentor' | 'User';

export function normalizeRole(role?: string | number | null): AppRole {
  if (role === null || role === undefined) return 'User';
  if (typeof role === 'number') {
    if (role === 3) return 'Admin';
    if (role === 2) return 'Mentor';
    return 'User';
  }
  const normalized = String(role).trim().toLocaleLowerCase('en-US');
  if (normalized === 'admin' || normalized === '3') return 'Admin';
  if (normalized === 'mentor' || normalized === '2') return 'Mentor';
  return 'User';
}

export function canAccessAdmin(user: User | null | undefined): boolean {
  const role = normalizeRole(user?.role);
  return role === 'Admin' || role === 'Mentor';
}

export function isAdmin(user: User | null | undefined): boolean {
  return normalizeRole(user?.role) === 'Admin';
}

export function authenticatedHome(user: User | null | undefined): string {
  return canAccessAdmin(user) ? '/admin' : '/dashboard';
}
