import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useStudentDetail, useStudentMutations } from './useStudents';
import type { AdminStudentEvidenceItem } from '../types/student.types';
import type { AdminEvidenceItem } from '../../applications/types/application.types';
import { applicationService as applicationReviewService } from '../../applications/services/application.service';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import { useAuthStore } from '../../../store/useAuthStore';
import { canAccessAdmin } from '../../../utils/authorization';

export function useStudentDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data, isPending, isError, refetch } = useStudentDetail(id);
  const m = useStudentMutations();

  const [tab, setTab] = useState<'profile' | 'applications' | 'evidence' | 'history'>('profile');
  const [reviewing, setReviewing] = useState<AdminStudentEvidenceItem | null>(null);
  const [viewingEvidence, setViewingEvidence] = useState<AdminEvidenceItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ ok: boolean; msg: string } | null>(null);
  const [lockOpen, setLockOpen] = useState(false);

  const cur = useAuthStore((s) => s.user);
  const canLock = canAccessAdmin(cur);

  const handleViewEvidence = async (evidenceId: string) => {
    try {
      const fullEv = await applicationReviewService.getEvidenceById(evidenceId);
      setViewingEvidence(fullEv);
      setViewerOpen(true);
    } catch {
      // ignore
    }
  };

  const stats = useMemo(() => {
    const evs = (data?.evidenceGroups ?? []).flatMap((g) => g.items);
    return {
      apps: data?.applications.length ?? 0,
      evTotal: evs.length,
      evOk: evs.filter((e) => e.status === 'Approved').length,
      evWait: evs.filter((e) => e.status === 'Submitted').length,
      logs: data?.reviewLogs.length ?? 0,
    };
  }, [data]);

  const toggleLock = async (reason: string) => {
    if (!id || !data) return;
    try {
      if (!data.isActive) {
        await m.unlockStudent.mutateAsync({ id, body: { reason: reason || null } });
        setBanner({ ok: true, msg: 'Đã mở khóa tài khoản.' });
      } else {
        await m.lockStudent.mutateAsync({ id, body: { reason: reason || null } });
        setBanner({ ok: true, msg: 'Đã khóa tài khoản.' });
      }
    } catch (e) {
      setBanner({ ok: false, msg: sanitizeApiError(e) });
      throw e instanceof Error ? e : new Error(String(e));
    }
  };

  const submitReview = async (decision: 'Approved' | 'Rejected' | 'NeedsRevision', note: string) => {
    if (!id || !reviewing) return;
    try {
      await m.reviewEvidence.mutateAsync({
        id,
        body: {
          evidenceId: reviewing.id,
          decision,
          note: note || null,
          rowVersion: reviewing.rowVersion,
        },
      });
      setBanner({ ok: true, msg: 'Đã lưu kết quả xét duyệt.' });
    } catch (e) {
      setBanner({ ok: false, msg: sanitizeApiError(e) });
      throw e instanceof Error ? e : new Error(String(e));
    }
  };

  return {
    id,
    student: data,
    isPending,
    isError,
    refetch,

    tab,
    setTab,

    stats,
    canLock,

    // Lock dialog
    lockOpen,
    setLockOpen,
    toggleLock,
    isLockSubmitting: m.lockStudent.isPending || m.unlockStudent.isPending,

    // Evidence viewer
    viewingEvidence,
    viewerOpen,
    setViewerOpen,
    handleViewEvidence,

    // Review evidence modal
    reviewing,
    setReviewing,
    submitReview,
    isReviewSubmitting: m.reviewEvidence.isPending,

    // Application detail modal
    selectedAppId,
    setSelectedAppId,

    // Banner
    banner,
    setBanner,
  };
}
