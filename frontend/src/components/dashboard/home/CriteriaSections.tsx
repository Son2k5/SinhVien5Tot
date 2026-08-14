import type { CSSProperties } from 'react';
import { ArrowUpRight, Check, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import type { CriterionProgress } from '../../../types/welcome';
import type { CriterionDefinition } from './homeDashboardConfig';
import { calculateAverageProgress } from './homeDashboardConfig';

interface CriteriaSectionProps {
  criteria: CriterionDefinition[];
  progressItems: CriterionProgress[];
  onSelect: (criterion: CriterionDefinition) => void;
}

export function CriteriaJourneySection({ criteria, progressItems, onSelect }: CriteriaSectionProps) {
  return (
    <section className='sv2-section' aria-labelledby='journey-title'>
      <div className='sv2-section-heading'>
        <div><span>Hành trình phát triển</span><h2 id='journey-title'>Hành trình 5 tốt</h2></div>
        <p>Chọn một tiêu chí để xem thông tin chi tiết</p>
      </div>
      <div className='sv2-journey-grid'>
        <div className='sv3-journey-track' aria-hidden='true' />
        {criteria.map((criterion, index) => {
          const CriterionIcon = criterion.icon;
          const progress = progressItems.find((item) => item.key === criterion.key);
          return (
            <button
              key={criterion.key}
              type='button'
              className={'sv2-journey-item tone-' + criterion.tone}
              onClick={() => onSelect(criterion)}
              aria-label={'Xem chi tiết ' + criterion.title}
            >
              <span className='sv2-journey-item__number'>{criterion.number}</span>
              <span className='sv2-journey-item__icon'><CriterionIcon size={25} /></span>
              <span className='sv2-journey-item__copy'><strong>{criterion.title}</strong><small>{criterion.shortDescription}</small></span>
              <span className='sv2-journey-item__progress'><i style={{ width: (progress?.progress ?? 0) + '%' }} /><b>{progress?.progress ?? 0}%</b><ChevronRight size={15} /></span>
              {index === 0 && <span className='sv3-journey-start'><Sparkles size={13} /> Bắt đầu</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CriteriaProgressSection({ criteria, progressItems, onSelect }: CriteriaSectionProps) {
  const averageProgress = calculateAverageProgress(progressItems);

  return (
    <section className='sv2-section sv2-progress-section' aria-labelledby='progress-title'>
      <div className='sv2-section-heading'>
        <div><span>Bảng đánh giá</span><h2 id='progress-title'>Tiến độ 5 tiêu chí</h2></div>
        <p>Dữ liệu mẫu · Sẵn sàng thay bằng backend</p>
      </div>
      <div className='sv2-progress-panel'>
        <div className='sv2-progress-summary'>
          <span className='sv2-progress-summary__icon'><TrendingUp size={22} /></span>
          <span className='sv2-progress-summary__label'>Bức tranh tổng thể</span>
          <div className='sv2-progress-ring' style={{ '--progress': averageProgress + '%' } as CSSProperties}>
            <div><strong>{averageProgress}%</strong><small>hoàn thành</small></div>
          </div>
          <h3>Bạn đang đi đúng hướng!</h3>
          <p>Tiếp tục bổ sung minh chứng để hoàn thiện hồ sơ cho cả 5 tiêu chí.</p>
          <div className='sv3-summary-stats'><span><strong>05</strong><small>Tiêu chí</small></span><span><strong>{progressItems.reduce((total, item) => total + item.completedRequirements, 0)}</strong><small>Đã đạt</small></span></div>
        </div>
        <div className='sv2-progress-table' aria-label='Tiến độ từng tiêu chí'>
          {criteria.map((criterion) => {
            const CriterionIcon = criterion.icon;
            const progress = progressItems.find((item) => item.key === criterion.key);
            return (
              <button key={criterion.key} type='button' onClick={() => onSelect(criterion)} className={'sv2-progress-row tone-' + criterion.tone}>
                <span className='sv2-progress-row__head'><span className='sv2-progress-row__icon'><CriterionIcon size={19} /></span><i><strong>{criterion.title}</strong><small>{progress?.status}</small></i><ArrowUpRight size={17} /></span>
                <span className='sv2-progress-row__value'><strong>{progress?.progress ?? 0}%</strong><small><Check size={13} /> {progress?.completedRequirements ?? 0}/{progress?.totalRequirements ?? 0} yêu cầu</small></span>
                <span className='sv2-progress-row__bar'><i style={{ width: (progress?.progress ?? 0) + '%' }} /></span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
