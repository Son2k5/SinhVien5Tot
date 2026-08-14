import { useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import type { CriterionProgress } from '../../../types/welcome';
import type { CriterionDefinition } from './homeDashboardConfig';

interface CriterionDetailsDialogProps {
  criterion: CriterionDefinition;
  progress: CriterionProgress;
  onClose: () => void;
}

export function CriterionDetailsDialog({ criterion, progress, onClose }: CriterionDetailsDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const CriterionIcon = criterion.icon;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const triggerElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      triggerElement?.focus();
    };
  }, [onClose]);

  return (
    <div className='sv2-modal-root'>
      <button type='button' className='sv2-modal-backdrop' aria-label='Đóng thông tin tiêu chí' onClick={onClose} />
      <section role='dialog' aria-modal='true' aria-labelledby='criterion-dialog-title' className={'sv2-criterion-dialog tone-' + criterion.tone}>
        <button ref={closeButtonRef} type='button' className='sv2-dialog-close' onClick={onClose} aria-label='Đóng'><X size={19} /></button>
        <div className='sv2-dialog-head'>
          <span><CriterionIcon size={28} /></span>
          <div><small>Tiêu chí {criterion.number}</small><h2 id='criterion-dialog-title'>{criterion.title}</h2></div>
        </div>
        <p className='sv2-dialog-description'>{criterion.description}</p>
        <div className='sv2-dialog-progress'>
          <div><span>Tiến độ hiện tại</span><strong>{progress.progress}%</strong></div>
          <span><i style={{ width: progress.progress + '%' }} /></span>
          <small>{progress.completedRequirements}/{progress.totalRequirements} yêu cầu đã hoàn thành · {progress.status}</small>
        </div>
        <div className='sv2-dialog-requirements'>
          <h3>Những nội dung cần rèn luyện</h3>
          {criterion.requirements.map((requirement) => <p key={requirement}><CheckCircle2 size={17} /> {requirement}</p>)}
        </div>
        <button type='button' className='sv2-dialog-action' onClick={onClose}>Đã hiểu <ArrowRight size={16} /></button>
      </section>
    </div>
  );
}
