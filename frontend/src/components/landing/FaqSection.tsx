import { useState } from 'react';
import { Icon } from '../common/BrandLogo';
import { landingFaqs } from './landingData';

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section id="faq" className={`p-[100px_0] max-[580px]:p-[75px_0] max-[420px]:py-[66px] pt-[80px]`}>
      <div className={`landing-container w-[min(1180px,_calc(100%_-_48px))] mx-auto max-[850px]:w-[min(100%_-_36px,_680px)] max-[580px]:w-[calc(100%_-_30px)] max-[700px]:w-[calc(100%_-_30px)] max-[420px]:w-[calc(100%_-_24px)] grid grid-cols-[.65fr_1.35fr] gap-[90px] max-[850px]:grid-cols-[1fr] max-[850px]:gap-[45px]`}>
        <div
          className={`[&_h2]:m-[17px_0_13px] [&_h2]:font-['Be_Vietnam_Pro',_sans-serif] [&_h2]:text-[clamp(31px,_3.7vw,_44px)] [&_h2]:leading-[1.15] [&_h2]:tracking-[-1.7px] [&>p]:text-[var(--muted)] [&>p]:text-[14px] [&>p]:leading-[1.75] sticky top-[100px] self-[start] [&>p]:max-w-[320px] [&_.text-link]:mt-[12px] max-[850px]:static max-[580px]:[&_h2]:text-[31px] max-[420px]:[&_h2]:text-[28px] max-[420px]:[&_h2]:tracking-[-1.15px] [&_h2]:text-[var(--landing-heading)] [&_h2]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_h2]:font-bold [&>p]:text-[var(--landing-muted)]`}
          data-reveal
        >
          <span className={`inline-flex items-center gap-[8px] text-[var(--blue)] p-[7px_11px] border border-[#d7e4fb] rounded-full bg-[rgba(255,255,255,.75)] text-[9.5px] font-extrabold tracking-[1.25px] uppercase`}>
            <span className={`eyebrow__dot relative w-[6px] h-[6px] rounded-full bg-[var(--blue)] shadow-[0_0_0_4px_rgba(36,99,235,.12)]`} /> Giải đáp nhanh
          </span>
          <h2>
            Bạn đang có<br />
            <span className="inline-block bg-gradient-to-r from-[#0878f5] to-[#24b6f7] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">câu hỏi?</span>
          </h2>
          <p>Không tìm thấy câu trả lời? Đội ngũ hỗ trợ luôn sẵn sàng lắng nghe bạn.</p>
          <a href="mailto:lienhe@sv5t.edu.vn" className={`text-link inline-flex items-center gap-[8px] text-[var(--blue)] text-[11px] font-extrabold [&_svg]:w-[15px] [&_svg]:transition-[transform] [&_svg]:duration-[.2s] [&_svg]:ease-[ease] [&:hover_svg]:transform-[translateX(4px)]`}>
            Liên hệ hỗ trợ <Icon name="arrow-right" />
          </a>
        </div>
        <div className={`border-t border-t-[#e2e8f1]`} data-reveal>
          {landingFaqs.map((faq, index) => (
            <article
              key={faq.question}
              className={`border-b border-b-[#e2e8f1] [&>button]:w-full [&>button]:flex [&>button]:justify-between [&>button]:items-center [&>button]:gap-[20px] [&>button]:p-[21px_4px] [&>button]:text-[#26334c] [&>button]:border-0 [&>button]:bg-none [&>button]:text-left [&>button]:cursor-pointer [&>button>span]:flex [&>button>span]:items-center [&>button>span]:gap-[18px] [&>button>span]:text-[11px] [&>button>span]:font-bold [&>button_i]:text-[#a0acc0] [&>button_i]:text-[8px] [&>button_i]:not-italic [&>button_svg]:w-[16px] [&>button_svg]:text-[#718099] [&>button_svg]:transition-[transform] [&>button_svg]:duration-[.3s] [&>button_svg]:ease-[ease] [&.is-open>button]:text-[var(--blue)] [&.is-open>button_svg]:transform-[rotate(180deg)] [&.is-open_.faq-answer]:grid-rows-[1fr] [&.is-open_.faq-answer_p]:p-[0_45px_20px] max-[580px]:[&.is-open_.faq-answer_p]:pl-[0] [&>button]:font-bold ${openFaq === index ? 'is-open' : ''}`}
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                aria-expanded={openFaq === index}
              >
                <span>
                  <i>{String(index + 1).padStart(2, '0')}</i>
                  {faq.question}
                </span>
                <Icon name="chevron-down" />
              </button>
              <div className={`faq-answer grid grid-rows-[0fr] transition-[grid-template-rows] duration-[.35s] ease-[ease] [&>p]:min-h-0 [&>p]:m-0 [&>p]:overflow-hidden [&>p]:text-[#6d788d] [&>p]:text-[9.5px] [&>p]:leading-[1.8] [&>p]:text-[var(--landing-muted)]`}>
                <p>{faq.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
