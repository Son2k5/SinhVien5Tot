import type { Testimonial } from '../../types/testimonial';
import { Icon } from '../common/BrandLogo';

type TestimonialsSectionProps = {
  testimonials: readonly Testimonial[];
};

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section className="section testimonials-section">
      <div className="landing-container">
        <div className="section-heading section-heading--center" data-reveal>
          <span className="eyebrow"><span className="eyebrow__dot" /> Câu chuyện thật</span>
          <h2>Sinh viên nói gì về <span>SV5T?</span></h2>
        </div>

        {testimonials.length > 0 ? (
          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <article className="testimonial-card" key={testimonial.id} data-reveal>
                <Icon name="message" />
                <p>“{testimonial.message}”</p>
                <div>
                  <span aria-hidden="true">{testimonial.initials}</span>
                  <div>
                    <strong>{testimonial.studentName}</strong>
                    <small>{testimonial.faculty}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="testimonial-empty" data-reveal>Chưa có chia sẻ nào được cập nhật.</p>
        )}
      </div>
    </section>
  );
}
