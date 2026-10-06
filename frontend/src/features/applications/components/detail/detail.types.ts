import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';

export interface DetailStatusConfigItem {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const DETAIL_STATUS_CONFIG: Record<string, DetailStatusConfigItem> = {
  Draft: { label: 'Bản nháp', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200', icon: Clock },
  Submitted: { label: 'Đã nộp', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: Clock },
  UnderReview: { label: 'Đang thẩm định', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: Clock },
  NeedsRevision: { label: 'Yêu cầu bổ sung', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  Resubmitted: { label: 'Đã nộp lại', color: 'text-cyan-800', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: RefreshCw },
  Approved: { label: 'Đạt danh hiệu SV5T', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  Rejected: { label: 'Không đạt / Từ chối', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: AlertCircle },
  Withdrawn: { label: 'Đã rút hồ sơ', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: Clock },
};

export const DETAIL_EVIDENCE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  Approved: { label: 'Đã duyệt', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Rejected: { label: 'Từ chối', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  NeedsRevision: { label: 'Cần sửa đổi', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Submitted: { label: 'Chờ thẩm định', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Draft: { label: 'Bản nháp', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
};

export const RADAR_AXES = [
  { code: 'Ethics', label: 'Đạo đức', angle: -Math.PI / 2, anchor: 'middle' as const, dx: 0, dy: -8 },
  { code: 'Study', label: 'Học tập', angle: -Math.PI / 2 + (2 * Math.PI) / 5, anchor: 'start' as const, dx: 6, dy: 4 },
  { code: 'Fitness', label: 'Thể lực', angle: -Math.PI / 2 + (4 * Math.PI) / 5, anchor: 'start' as const, dx: 6, dy: 10 },
  { code: 'Volunteer', label: 'Tình nguyện', angle: -Math.PI / 2 + (6 * Math.PI) / 5, anchor: 'end' as const, dx: -6, dy: 10 },
  { code: 'Integration', label: 'Hội nhập', angle: -Math.PI / 2 + (8 * Math.PI) / 5, anchor: 'end' as const, dx: -6, dy: 4 },
];

export function parseData(jsonStr?: string): { description: string; driveLink: string } {
  if (!jsonStr) return { description: '', driveLink: '' };
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      description: parsed.description || parsed.notes || '',
      driveLink: parsed.driveLink || parsed.link || parsed.url || '',
    };
  } catch {
    return { description: jsonStr, driveLink: '' };
  }
}

export function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}
