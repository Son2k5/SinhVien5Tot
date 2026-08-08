import React, { useState, useEffect } from 'react';

export interface SlideItem {
  id: number;
  imageUrl: string;
  title: string;
  subtitle: string;
  quote: string;
  author: string;
  role: string;
}

const defaultSlides: SlideItem[] = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    title: 'Phong trào Sinh viên 5 Tốt',
    subtitle: 'Đoàn Thanh niên - Hội Sinh viên Việt Nam',
    quote: '"Tiên phong - Bản lĩnh - Phấn đấu - Rèn luyện để trở thành những công dân ưu tú và nguồn nhân lực chất lượng cao."',
    author: 'Hội Sinh viên Việt Nam',
    role: 'Hệ thống Quản lý & Tuyên dương',
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    title: 'Khát vọng & Tri thức',
    subtitle: 'Môi trường phát triển toàn diện',
    quote: '"Hệ thống tích hợp hiện đại giúp tối ưu hóa quy trình xét duyệt và đồng hành cùng sinh viên trong mọi hoạt động phong trào."',
    author: 'Ban Thường vụ Đoàn Trường',
    role: 'Tự hào Sinh viên Việt Nam',
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    title: 'Sức trẻ & Cống hiến',
    subtitle: 'Nhiệt huyết - Sáng tạo - Tự hào',
    quote: '"Không ngừng nỗ lực hoàn thiện 5 tiêu chí: Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt và Hội nhập tốt."',
    author: 'Ban Hội nhập & Học thuật',
    role: 'Chương trình Tuyên dương Quốc gia',
  },
];

export const LeftImageSlider: React.FC<{ customSlides?: SlideItem[] }> = ({ customSlides }) => {
  const slides = customSlides || defaultSlides;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((index) => (index + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    if (index === currentIndex || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    const nextIdx = (currentIndex - 1 + slides.length) % slides.length;
    goToSlide(nextIdx);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    const nextIdx = (currentIndex + 1) % slides.length;
    goToSlide(nextIdx);
  };

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative w-full h-full min-h-[550px] overflow-hidden bg-slate-900 rounded-2xl shadow-xl border border-slate-800 group">
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
          } transition-transform duration-1000`}
        >
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="w-full h-full object-cover object-center filter brightness-[0.7]"
          />
        </div>
      ))}

      <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950 via-slate-950/40 to-doan-900/30" />
      <div className="absolute inset-0 z-20 bg-gradient-to-r from-doan-900/40 via-transparent to-transparent" />

      <div className="relative z-30 p-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-doan-600/90 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
        </div>
        <div>
          <h2 className="text-white font-bold text-sm tracking-wide uppercase">SV5T Portal</h2>
          <p className="text-doan-200 text-xs font-medium">Khung hiển thị hình ảnh Đoàn - Hội</p>
        </div>
      </div>

      <div className="relative z-30 mt-auto p-8 lg:p-12 flex flex-col justify-end h-[calc(100%-80px)]">
        <div className="space-y-4 max-w-lg transition-all duration-500 animate-fade-in">
          <div className="inline-block px-3 py-1 rounded-full bg-doan-600/80 backdrop-blur-md border border-doan-400/30 text-white text-xs font-semibold tracking-wide">
            {currentSlide.subtitle}
          </div>
          <p className="text-xl lg:text-2xl font-semibold text-white leading-relaxed tracking-tight drop-shadow-md">
            {currentSlide.quote}
          </p>
          <div className="pt-2">
            <p className="text-white font-bold text-base">{currentSlide.author}</p>
            <p className="text-doan-200 text-sm font-medium">{currentSlide.role}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-6">
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                aria-label={`Chuyển tới ảnh ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-8 bg-doan-500 shadow-sm shadow-doan-400'
                    : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              aria-label="Ảnh trước"
              className="w-10 h-10 rounded-full border border-white/30 bg-slate-950/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-doan-600 hover:border-doan-500 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              aria-label="Ảnh kế tiếp"
              className="w-10 h-10 rounded-full border border-white/30 bg-slate-950/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-doan-600 hover:border-doan-500 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
