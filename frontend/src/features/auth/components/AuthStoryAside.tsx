import { Icon } from '../../../components/common/BrandLogo';

export interface SlideItem {
  image: string;
  badge: string;
  title: string;
  text: string;
}

export const AUTH_SLIDES: SlideItem[] = [
  {
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85',
    badge: 'HÀNH TRÌNH 5 TỐT',
    title: 'Mỗi nỗ lực hôm nay là một dấu ấn của ngày mai.',
    text: 'Lưu giữ thành tích, theo dõi tiến độ và tự tin tiến gần hơn đến danh hiệu Sinh viên 5 Tốt.',
  },
  {
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1400&q=85',
    badge: 'KẾT NỐI & TRƯỞNG THÀNH',
    title: 'Cùng nhau tạo nên một thế hệ sinh viên toàn diện.',
    text: 'Kết nối hoạt động học tập, tình nguyện và hội nhập trên một nền tảng duy nhất.',
  },
  {
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=85',
    badge: 'RÈN LUYỆN MỖI NGÀY',
    title: 'Nhìn thấy tiến bộ để thêm động lực bước tiếp.',
    text: 'Mọi tiêu chí đều rõ ràng, mọi cột mốc đều được ghi nhận và bảo vệ an toàn.',
  },
];

interface AuthStoryAsideProps {
  slide: number;
  onSelectSlide: (index: number) => void;
}

export function AuthStoryAside({ slide, onSelectSlide }: AuthStoryAsideProps) {
  return (
    <aside className={`auth-story relative min-w-0 min-h-[clamp(560px,_calc(100dvh_-_240px),_720px)] overflow-hidden text-white border-[length:8px] border-solid border-[rgba(255,_255,_255,_.88)] rounded-[54px_150px_70px_118px_/_88px_64px_142px_76px] bg-[#123c77] shadow-[0_34px_76px_rgba(15,_77,_139,_.24),_0_12px_28px_rgba(15,_77,_139,_.12)] transform-[rotate(-.65deg)] before:content-[''] before:absolute before:z-[5] before:inset-[14px] before:pointer-events-none before:border before:border-[rgba(255,_255,_255,_.24)] before:rounded-[44px_132px_58px_104px_/_70px_54px_126px_64px] [&_.auth-slider-dots]:relative [&_.auth-slider-dots]:z-[8] [&_.auth-slider-dots]:flex [&_.auth-slider-dots]:gap-[8px] [&_.auth-slider-dots]:mt-[30px] [&_.auth-slider-dots_button]:w-[9px] [&_.auth-slider-dots_button]:h-[9px] [&_.auth-slider-dots_button]:p-0 [&_.auth-slider-dots_button]:border-0 [&_.auth-slider-dots_button]:rounded-full [&_.auth-slider-dots_button]:bg-[rgba(255,255,255,.42)] [&_.auth-slider-dots_button]:cursor-pointer [&_.auth-slider-dots_button]:transition-[width,background] [&_.auth-slider-dots_button]:duration-[.25s,.25s] [&_.auth-slider-dots_button]:ease-[ease,ease] [&_.auth-slider-dots_button.is-active]:w-[34px] [&_.auth-slider-dots_button.is-active]:bg-white max-[1080px]:min-h-[650px] max-[900px]:hidden max-[900px]:min-h-[420px] max-[900px]:rounded-[42px_110px_48px_82px_/_58px_46px_100px_56px] max-[900px]:before:rounded-[32px_92px_38px_68px_/_48px_36px_86px_44px] max-[900px]:[&_.auth-slider-dots]:mt-[22px] max-[640px]:min-h-[325px] max-[640px]:border-[length:6px] max-[640px]:rounded-[32px_76px_38px_58px_/_44px_34px_72px_42px] max-[640px]:before:inset-[10px] max-[640px]:before:rounded-[24px_64px_28px_48px_/_34px_26px_62px_32px] max-[640px]:[&_.auth-slider-dots]:mt-[16px]`} aria-label="Thông tin về hành trình Sinh viên 5 Tốt">
      <div className={`absolute inset-0 z-[2] left-[auto] top-[-90px] right-[-70px] w-[320px] h-[320px] rounded-full bg-[rgba(67,_204,_255,_.28)] filter-[blur(42px)]`} aria-hidden="true" />
      <div className={`absolute z-[4] right-[36px] top-[32px] w-[110px] h-[86px] opacity-[.5] bg-[image:radial-gradient(rgba(255,255,255,.85)_1.6px,_transparent_1.6px)] bg-[length:13px_13px] transform-[rotate(9deg)]`} aria-hidden="true" />
      <div className={`auth-story__media absolute inset-0 [&_img]:absolute [&_img]:inset-0 [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:transition-[opacity,transform] [&_img]:duration-[.8s,7s] [&_img]:ease-[ease,ease]`} aria-hidden="true">
        {AUTH_SLIDES.map((item, index) => (
          <img
            key={item.image}
            src={item.image}
            alt=""
            className={index === slide ? 'opacity-100 scale-[1.04]' : 'opacity-0 scale-[1.12]'}
          />
        ))}
      </div>
      <div className={`absolute inset-0 bg-[linear-gradient(180deg,_rgba(3,_24,_58,_.12)_8%,_rgba(5,_33,_76,_.28)_42%,_rgba(5,_25,_59,_.93)_100%),_linear-gradient(115deg,_rgba(8,_69,_143,_.28),_transparent_62%)]`} aria-hidden="true" />
      <div className={`absolute z-[7] inset-[auto_54px_52px] max-w-[530px] transform-[rotate(.65deg)] [&_h2]:m-[18px_0_14px] [&_h2]:font-['Be_Vietnam_Pro',_sans-serif] [&_h2]:text-[clamp(34px,_3.2vw,_48px)] [&_h2]:leading-[1.12] [&_h2]:tracking-[-1.8px] [&_h2]:text-balance [&>p]:max-w-[510px] [&>p]:m-0 [&>p]:text-[rgba(229,_241,_255,_.84)] [&>p]:text-[14px] [&>p]:leading-[1.75] max-[1080px]:inset-x-[40px] max-[1080px]:bottom-[44px] max-[900px]:inset-[auto_42px_36px] max-[900px]:max-w-[560px] max-[900px]:[&_h2]:max-w-[500px] max-[900px]:[&_h2]:text-[34px] max-[900px]:[&>p]:max-w-[500px] max-[640px]:inset-[auto_25px_25px] max-[640px]:[&_h2]:m-[12px_0_8px] max-[640px]:[&_h2]:max-w-[370px] max-[640px]:[&_h2]:text-[27px] max-[640px]:[&_h2]:tracking-[-1px] max-[640px]:[&>p]:text-[12px] max-[640px]:[&>p]:leading-[1.55]`}>
        <span className={`inline-flex items-center min-h-[32px] p-[0_13px] border border-[rgba(255,_255,_255,_.26)] rounded-[999px] bg-[rgba(255,_255,_255,_.13)] shadow-[inset_0_1px_0_rgba(255,255,255,.15)] backdrop-blur-[12px] text-[10px] font-extrabold tracking-[1.4px] max-[640px]:min-h-[27px] max-[640px]:px-[10px] max-[640px]:text-[8px]`}>{AUTH_SLIDES[slide].badge}</span>
        <h2>{AUTH_SLIDES[slide].title}</h2>
        <p>{AUTH_SLIDES[slide].text}</p>
        <div className={`flex flex-wrap gap-[10px_18px] mt-[23px] [&_span]:inline-flex [&_span]:items-center [&_span]:gap-[7px] [&_span]:text-[rgba(241,_248,_255,_.9)] [&_span]:text-[12px] [&_span]:font-semibold [&_svg]:w-[17px] [&_svg]:h-[17px] [&_svg]:p-[3px] [&_svg]:rounded-full [&_svg]:text-[#0b5b47] [&_svg]:bg-[#83efd0] [&_svg]:stroke-[length:3] max-[900px]:mt-[18px] max-[640px]:hidden`}>
          <span><Icon name="check" /> Xác minh qua email HANU</span>
          <span><Icon name="check" /> Theo dõi hành trình tập trung</span>
        </div>
        <div className={`auth-slider-dots relative z-[2] flex gap-[6px] mt-[28px] [&_button]:w-[7px] [&_button]:h-[7px] [&_button]:p-0 [&_button]:border-0 [&_button]:rounded-[9px] [&_button]:bg-[rgba(255,255,255,.35)] [&_button]:cursor-pointer [&_button]:transition-[width,background-color] [&_button]:duration-[.25s] [&_button]:ease-[ease] [&_button.is-active]:w-[28px] [&_button.is-active]:bg-white [&_button:focus-visible]:outline-[length:3px] [&_button:focus-visible]:outline-solid [&_button:focus-visible]:outline-[color:rgba(22,_131,_255,_.3)] [&_button:focus-visible]:outline-offset-[4px]`}>
          {AUTH_SLIDES.map((item, index) => (
            <button
              type="button"
              key={item.badge}
              className={index === slide ? 'is-active' : ''}
              onClick={() => onSelectSlide(index)}
              aria-label={`Chuyển đến nội dung ${index + 1}`}
              aria-current={index === slide ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
      <div className={`absolute z-[9] top-[48px] right-[36px] flex items-center gap-[9px] w-[122px] h-[122px] p-[17px] text-[#124475] border-[length:7px] border-solid border-[rgba(255,255,255,.82)] rounded-[44%_56%_50%_50%_/_58%_42%_58%_42%] bg-[linear-gradient(145deg,_#eafffb,_#9fead9)] shadow-[0_18px_34px_rgba(3,_35,_68,_.22)] transform-[rotate(8deg)] [&_strong]:font-['Be_Vietnam_Pro',_sans-serif] [&_strong]:text-[43px] [&_strong]:leading-[1] [&_strong]:tracking-[-3px] [&_span]:text-[8px] [&_span]:font-extrabold [&_span]:leading-[1.45] [&_span]:tracking-[.5px] [&_span]:uppercase max-[1080px]:w-[104px] max-[1080px]:h-[104px] max-[1080px]:right-[28px] max-[1080px]:[&_strong]:text-[36px] max-[900px]:top-[28px] max-[640px]:hidden`} aria-hidden="true">
        <strong>5</strong>
        <span>tiêu chí<br />một hành trình</span>
      </div>
    </aside>
  );
}

export default AuthStoryAside;
