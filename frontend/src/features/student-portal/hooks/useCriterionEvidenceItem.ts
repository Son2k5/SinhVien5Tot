import { useState, useEffect } from 'react';
import { studentPortalService } from '../services/student-portal.service';
import {
  type StudentCriterionItemResponse,
  type StudentEvidenceItemResponse,
  type EvidenceAttachment,
  parseStudentPortalApiError,
} from '../types/student-portal.types';

interface UseCriterionEvidenceItemProps {
  criterion: StudentCriterionItemResponse;
  evidence?: StudentEvidenceItemResponse | null;
  applicationId: string;
  onEvidenceUpdated: (evidence: StudentEvidenceItemResponse) => void;
}

export function useCriterionEvidenceItem({
  criterion,
  evidence,
  applicationId,
  onEvidenceUpdated,
}: UseCriterionEvidenceItemProps) {
  // Parse dataJson
  const parseData = () => {
    if (!evidence?.dataJson) return { description: '', driveLink: '' };
    try {
      const parsed = JSON.parse(evidence.dataJson);
      return {
        description: parsed.description || parsed.notes || '',
        driveLink: parsed.driveLink || parsed.link || parsed.url || '',
      };
    } catch {
      return { description: evidence.dataJson, driveLink: '' };
    }
  };

  // Parse attachmentsJson
  const parseAttachments = (): EvidenceAttachment[] => {
    if (!evidence?.attachmentsJson) return [];
    try {
      const parsed = JSON.parse(evidence.attachmentsJson);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  };

  const initialData = parseData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState(initialData.description);
  const [driveLink, setDriveLink] = useState(initialData.driveLink);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync state when evidence prop changes
  useEffect(() => {
    const fresh = parseData();
    setDescription(fresh.description);
    setDriveLink(fresh.driveLink);
  }, [evidence?.dataJson]);

  const attachments = parseAttachments();

  const handleSaveEvidence = async (options?: { autoSubmit?: boolean }) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessToast(null);

    const payload = JSON.stringify({
      description: description.trim(),
      driveLink: driveLink.trim(),
    });

    try {
      const updated = await studentPortalService.upsertEvidence(
        applicationId,
        criterion.id,
        payload,
        evidence?.rowVersion
      );

      let finalEvidence = updated;
      if (options?.autoSubmit) {
        const submitted = await studentPortalService.submitEvidence(
          updated.id,
          updated.rowVersion
        );
        finalEvidence = submitted;
        setSuccessToast('Đã lưu và nộp thẩm định thành công!');
      } else {
        setSuccessToast('Đã lưu minh chứng thành công!');
      }

      onEvidenceUpdated(finalEvidence);
      setTimeout(() => setSuccessToast(null), 3000);
      return finalEvidence;
    } catch (err: unknown) {
      setErrorMessage(parseStudentPortalApiError(err));
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMessage(null);
    setSuccessToast(null);

    try {
      let currentEvidence = evidence;
      if (!currentEvidence) {
        const payload = JSON.stringify({
          description: description.trim(),
          driveLink: driveLink.trim(),
        });
        currentEvidence = await studentPortalService.upsertEvidence(
          applicationId,
          criterion.id,
          payload
        );
      }

      const updated = await studentPortalService.uploadEvidenceFile(
        currentEvidence.id,
        file
      );
      onEvidenceUpdated(updated);
      setSuccessToast(`Đã tải lên tệp: ${file.name}`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(parseStudentPortalApiError(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileIndex: number) => {
    if (!evidence) return;
    setErrorMessage(null);
    try {
      const updated = await studentPortalService.deleteEvidenceFile(
        evidence.id,
        fileIndex,
        evidence.rowVersion
      );
      onEvidenceUpdated(updated);
      setSuccessToast('Đã xóa tệp đính kèm.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(parseStudentPortalApiError(err));
    }
  };

  const handleReopenEvidence = async () => {
    if (!evidence) return;
    setErrorMessage(null);
    try {
      const updated = await studentPortalService.reopenEvidence(
        evidence.id,
        evidence.rowVersion
      );
      onEvidenceUpdated(updated);
      setSuccessToast('Đã mở lại minh chứng để chỉnh sửa.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(parseStudentPortalApiError(err));
    }
  };

  const handleSubmitEvidence = async () => {
    if (!evidence) return;
    setErrorMessage(null);
    try {
      const updated = await studentPortalService.submitEvidence(
        evidence.id,
        evidence.rowVersion
      );
      onEvidenceUpdated(updated);
      setSuccessToast('Đã nộp thẩm định minh chứng thành công!');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(parseStudentPortalApiError(err));
    }
  };

  return {
    isExpanded,
    setIsExpanded,
    description,
    setDescription,
    driveLink,
    setDriveLink,
    isSaving,
    isUploading,
    errorMessage,
    setErrorMessage,
    successToast,
    attachments,
    handleSaveEvidence,
    handleFileUpload,
    handleDeleteFile,
    handleReopenEvidence,
    handleSubmitEvidence,
  };
}
