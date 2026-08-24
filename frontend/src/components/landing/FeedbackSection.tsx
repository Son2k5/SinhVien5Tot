import type { Feedback } from '../../types/feedback';
import { Icon } from '../common/BrandLogo';

type FeedbackSectionProps = {
  feedbackItems: readonly Feedback[];
};

export function FeedbackSection({ feedbackItems }: FeedbackSectionProps) {
  return (
    <section className={`p-[100px_0] max-[580px]:p-[75px_0] max-[420px]:py-[66px] bg-[linear-gradient(#f7f9fd,#fff)]`}>
      <div className={`landing-container w-[min(1180px,_calc(100%_-_48px))] mx-auto max-[850px]:w-[min(100%_-_36px,_680px)] max-[580px]:w-[calc(100%_-_30px)] max-[700px]:w-[calc(100%_-_30px)] max-[420px]:w-[calc(100%_-_24px)]`}>
        <div className={`mb-[48px] [&_h2]:m-[17px_0_13px] [&_h2]:font-['Be_Vietnam_Pro',_sans-serif] [&_h2]:text-[clamp(31px,_3.7vw,_44px)] [&_h2]:leading-[1.15] [&_h2]:tracking-[-1.7px] [&_p]:text-[var(--muted)] [&_p]:text-[14px] [&_p]:leading-[1.75] max-[580px]:mb-[35px] max-[580px]:[&_h2]:text-[31px] max-[420px]:[&_h2]:text-[28px] max-[420px]:[&_h2]:tracking-[-1.15px] [&_h2]:text-[var(--landing-heading)] [&_h2]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_h2]:font-bold [&>p]:text-[var(--landing-muted)] max-w-[720px] mx-auto text-center [&_p]:max-w-[580px] [&_p]:m-[auto]`} data-reveal>
          <span className={`inline-flex items-center gap-[8px] text-[var(--blue)] p-[7px_11px] border border-[#d7e4fb] rounded-full bg-[rgba(255,255,255,.75)] text-[9.5px] font-extrabold tracking-[1.25px] uppercase`}><span className={`eyebrow__dot relative w-[6px] h-[6px] rounded-full bg-[var(--blue)] shadow-[0_0_0_4px_rgba(36,99,235,.12)]`} /> Câu chuyện thật</span>
          <h2>Sinh viên nói gì về <span className="inline-block bg-gradient-to-r from-[#0878f5] to-[#24b6f7] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">SV5T?</span></h2>
        </div>

        {feedbackItems.length > 0 ? (
          <div className={`grid grid-cols-[repeat(3,1fr)] gap-[18px] max-[580px]:grid-cols-[1fr]`}>
            {feedbackItems.map((feedback) => (
              <article className={`m-0 p-[28px] border border-[#dce9f5] rounded-[22px] bg-white shadow-[0_12px_30px_rgba(32,83,132,.07)] transition-[transform,box-shadow] duration-[.3s] ease-[ease] hover:transform-[translateY(-5px)] hover:shadow-[0_20px_45px_rgba(35,65,120,.1)] [&>svg]:w-[28px] [&>svg]:text-[#7eb8ee] [&>svg]:fill-[#eaf5ff] [&>p]:min-h-[104px] [&>p]:m-[18px_0_23px] [&>p]:text-[#354b63] [&>p]:text-[14px] [&>p]:font-medium [&>p]:leading-[1.8] [&>div]:flex [&>div]:items-center [&>div]:gap-[12px] [&>div>span]:grid [&>div>span]:place-items-center [&>div>span]:flex-[0_0_40px] [&>div>span]:h-[40px] [&>div>span]:rounded-full [&>div>span]:text-white [&>div>span]:bg-[linear-gradient(145deg,#69bdf4,#1683e8)] [&>div>span]:shadow-[0_8px_18px_rgba(22,131,232,.2)] [&>div>span]:text-[10px] [&>div>span]:font-extrabold [&>div>div]:grid [&>div>div]:gap-[3px] [&_strong]:text-[#173958] [&_strong]:text-[11.5px] [&_strong]:font-extrabold [&_small]:text-[#74899e] [&_small]:text-[9.5px] max-[580px]:[&>p]:min-h-[auto] [&_strong]:text-[var(--landing-heading)] [&_strong]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_strong]:font-bold [&>p]:text-[var(--landing-muted)] [&_small]:text-[var(--landing-muted)] [&>p]:text-[var(--landing-body)]`} key={feedback.id} data-reveal>
                <Icon name="message" />
                <p>“{feedback.message}”</p>
                <div>
                  <span aria-hidden="true">{feedback.initials}</span>
                  <div>
                    <strong>{feedback.studentName}</strong>
                    <small>{feedback.faculty}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className={`max-w-[520px] mx-auto my-0 p-[28px] text-[var(--muted)] border border-dashed border-[#bfdcf2] rounded-[18px] bg-[#f5fbff] text-center text-[13px]`} data-reveal>Chưa có chia sẻ nào được cập nhật.</p>
        )}
      </div>
    </section>
  );
}
