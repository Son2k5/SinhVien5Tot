import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentPortalService } from '../services/student-portal.service';
import {
  isDraftStatus,
  normalizeSubmissionStatus,
  SubmissionStatus,
  type StudentEvidenceItemResponse,
  parseStudentPortalApiError,
} from '../types/student-portal.types';

export const studentEvidenceSubmissionQueryKeys = {
  application: (id: string) => ['student-application-detail', id] as const,
  campaign: (campaignId: string) => ['student-campaign-detail', campaignId] as const,
};

export function useStudentEvidenceSubmission(id?: string) {
  const queryClient = useQueryClient();

  const [activeGroupCode, setActiveGroupCode] = useState<string>('Ethics');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Query: Application Detail
  const {
    data: application,
    isLoading: appLoading,
    error: appError,
    refetch: refetchApplication,
  } = useQuery({
    queryKey: studentEvidenceSubmissionQueryKeys.application(id ?? ''),
    queryFn: () => studentPortalService.getApplicationDetail(id!),
    enabled: Boolean(id),
  });

  // Query: Campaign Detail (for criteria tree)
  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useQuery({
    queryKey: studentEvidenceSubmissionQueryKeys.campaign(application?.campaignId ?? ''),
    queryFn: () => studentPortalService.getCampaignDetail(application!.campaignId),
    enabled: Boolean(application?.campaignId),
  });

  // Build a map of criterionId -> Evidence for O(1) lookup
  const evidencesMap = useMemo(() => {
    const map = new Map<string, StudentEvidenceItemResponse>();
    if (application?.evidences) {
      application.evidences.forEach((ev) => {
        map.set(ev.criterionId, ev);
      });
    }
    return map;
  }, [application?.evidences]);

  // Overall completion & progress computation
  const totalCriteria = campaign?.criteria?.length || 0;
  const completedCount = useMemo(() => {
    if (!campaign?.criteria) return 0;
    return campaign.criteria.filter((c) => {
      const ev = evidencesMap.get(c.id);
      if (!ev) return false;
      const hasData = Boolean(ev.dataJson && ev.dataJson.trim().length > 2);
      const hasFiles = Boolean(
        ev.attachmentsJson &&
          ev.attachmentsJson.trim().length > 2 &&
          ev.attachmentsJson !== '[]'
      );
      return hasData || hasFiles;
    }).length;
  }, [campaign?.criteria, evidencesMap]);

  const approvedCount = useMemo(() => {
    if (!application?.evidences) return 0;
    return application.evidences.filter((ev) => ev.status === 3).length; // 3 = Approved
  }, [application?.evidences]);

  const progressPercent = totalCriteria > 0 ? Math.round((completedCount / totalCriteria) * 100) : 0;

  // Editable rules: Draft or NeedsRevision
  const isEditable = useMemo(() => {
    if (!application) return false;
    const statusNum = normalizeSubmissionStatus(application.status);
    return isDraftStatus(application.status) || statusNum === SubmissionStatus.NeedsRevision;
  }, [application]);

  // Check deadline
  const isExpired = useMemo(() => {
    if (!campaign?.submitDeadline) return false;
    return new Date() > new Date(campaign.submitDeadline);
  }, [campaign?.submitDeadline]);

  // Submit Application Mutation
  const submitMutation = useMutation({
    mutationFn: () => studentPortalService.submitApplication(application!.id, application!.rowVersion),
    onSuccess: (updated) => {
      queryClient.setQueryData(studentEvidenceSubmissionQueryKeys.application(id ?? ''), updated);
      queryClient.invalidateQueries({ queryKey: ['student-applications', 'my'] });
      setIsSubmitModalOpen(false);
      setSuccessNotification('Hồ sơ của bạn đã được nộp thành công! Ban thẩm định sẽ sớm đánh giá minh chứng của bạn.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: unknown) => {
      setIsSubmitModalOpen(false);
      setActionError(parseStudentPortalApiError(err));
    },
  });

  // Clear all evidences
  const handleClearAllEvidences = async () => {
    if (!application || !campaign?.criteria) return;
    setIsClearing(true);
    setActionError(null);
    try {
      for (const ev of application.evidences) {
        let attachments: unknown[] = [];
        try {
          if (ev.attachmentsJson) attachments = JSON.parse(ev.attachmentsJson);
        } catch {
          // ignore
        }
        if (Array.isArray(attachments)) {
          let currVer = ev.rowVersion;
          for (let i = attachments.length - 1; i >= 0; i--) {
            try {
              const res = await studentPortalService.deleteEvidenceFile(ev.id, i, currVer);
              currVer = res.rowVersion;
            } catch {
              // ignore
            }
          }
        }
        await studentPortalService.upsertEvidence(
          application.id,
          ev.criterionId,
          JSON.stringify({ description: '', driveLink: '' }),
          ev.rowVersion
        );
      }
      await refetchApplication();
      setIsClearModalOpen(false);
      setSuccessNotification('Đã xóa trắng toàn bộ dữ liệu minh chứng nháp.');
    } catch (err: unknown) {
      setActionError(parseStudentPortalApiError(err));
    } finally {
      setIsClearing(false);
    }
  };

  const handleEvidenceUpdated = (updatedEvidence: StudentEvidenceItemResponse) => {
    queryClient.setQueryData(
      studentEvidenceSubmissionQueryKeys.application(id ?? ''),
      (old: typeof application) => {
        if (!old) return old;
        const exists = old.evidences.some((ev) => ev.id === updatedEvidence.id);
        const nextEvidences = exists
          ? old.evidences.map((ev) => (ev.id === updatedEvidence.id ? updatedEvidence : ev))
          : [...old.evidences, updatedEvidence];
        return {
          ...old,
          evidences: nextEvidences,
        };
      }
    );
  };

  return {
    application,
    appLoading,
    appError,
    campaign,
    campaignLoading,
    campaignError,
    evidencesMap,
    totalCriteria,
    completedCount,
    approvedCount,
    progressPercent,
    isEditable,
    isExpired,
    activeGroupCode,
    setActiveGroupCode,
    isSubmitModalOpen,
    setIsSubmitModalOpen,
    isClearModalOpen,
    setIsClearModalOpen,
    isClearing,
    isGuideModalOpen,
    setIsGuideModalOpen,
    agreementChecked,
    setAgreementChecked,
    actionError,
    setActionError,
    successNotification,
    setSuccessNotification,
    submitMutation,
    handleClearAllEvidences,
    handleEvidenceUpdated,
    refetchApplication,
  };
}
