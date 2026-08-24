import { Link } from 'react-router-dom';
import { BrandLogo, Icon } from '../common/BrandLogo';

interface LandingHeaderProps {
  scrolled: boolean;
  scrollProgress: number;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}

export function LandingHeader({
  scrolled,
  scrollProgress,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
}: LandingHeaderProps) {
  return (
    <>
      <div
        className={`fixed z-[100] inset-[0_auto_auto_0] h-[3px] bg-[linear-gradient(90deg,_#6ee7ff,_#1683ff,_#35c5ff)] transition-[width] duration-[.1s] ease-[linear]`}
        style={{ width: `${scrollProgress}%` }}
      />
      <header
        className={`fixed z-[90] inset-[0_0_auto] h-[80px] border-b border-b-[transparent] transition-[height,background-color,border-color,box-shadow,backdrop-filter] duration-[.35s] ease-[ease] max-[580px]:h-[68px] ${scrolled ? `h-[70px] bg-[rgba(255,255,255,.88)] border-[rgba(216,225,239,.9)] shadow-[0_10px_40px_rgba(31,_59,_115,_.08)] backdrop-blur-[18px]` : ''}`}
      >
        <div className={`landing-container w-[min(1180px,_calc(100%_-_48px))] mx-auto max-[850px]:w-[min(100%_-_36px,_680px)] max-[580px]:w-[calc(100%_-_30px)] max-[700px]:w-[calc(100%_-_30px)] max-[420px]:w-[calc(100%_-_24px)] h-full flex items-center justify-between gap-[24px]`}>
          <a href="#trang-chu" onClick={onCloseMobile}>
            <BrandLogo />
          </a>
          <nav
            className={`flex items-center gap-[27px] ml-[auto] [&>a]:relative [&>a]:text-[#526078] [&>a]:text-[12.5px] [&>a]:font-semibold [&>a]:transition-[color] [&>a]:duration-[.2s] [&>a]:ease-[ease] [&>a:hover]:text-[var(--blue)] [&>a::after]:content-[''] [&>a::after]:absolute [&>a::after]:inset-[auto_50%_-9px] [&>a::after]:h-[2px] [&>a::after]:rounded-[2px] [&>a::after]:bg-[var(--blue)] [&>a::after]:transition-[inset,width] [&>a::after]:duration-[.2s] [&>a::after]:ease-[ease] [&>a:hover::after]:inset-x-[0] max-[1050px]:gap-[17px] max-[1050px]:[&>a]:text-[11px] max-[850px]:absolute max-[850px]:z-[20] max-[850px]:top-[72px] max-[850px]:left-[18px] max-[850px]:right-[18px] max-[850px]:grid max-[850px]:gap-[0] max-[850px]:p-[12px] max-[850px]:invisible max-[850px]:opacity-0 max-[850px]:border max-[850px]:border-[#e0e7f1] max-[850px]:rounded-[16px] max-[850px]:bg-[rgba(255,255,255,.97)] max-[850px]:shadow-[var(--shadow)] max-[850px]:transform-[translateY(-8px)] max-[850px]:transition-[opacity,transform,visibility] max-[850px]:duration-[.25s] max-[850px]:ease-[ease] max-[850px]:[&.is-open]:visible max-[850px]:[&.is-open]:opacity-100 max-[850px]:[&.is-open]:transform-none max-[850px]:[&>a]:p-[12px_10px] max-[850px]:[&>a::after]:hidden max-[420px]:left-[12px] max-[420px]:right-[12px] [&>a]:text-[var(--landing-muted)] ${mobileOpen ? 'is-open' : ''}`}
            aria-label="Điều hướng chính"
          >
            <a href="#trang-chu" onClick={onCloseMobile}>Trang chủ</a>
            <a href="#gioi-thieu" onClick={onCloseMobile}>Giới thiệu</a>
            <a href="#tieu-chi" onClick={onCloseMobile}>Tiêu chí</a>
            <a href="#tinh-nang" onClick={onCloseMobile}>Tính năng</a>
            <a href="#thu-vien" onClick={onCloseMobile}>Thư viện</a>
            <a href="#lien-he" onClick={onCloseMobile}>Liên hệ</a>
            <div className={`hidden max-[850px]:hidden max-[580px]:grid max-[580px]:grid-cols-[1fr_1fr] max-[580px]:items-center max-[580px]:gap-[8px] max-[580px]:mt-[7px] max-[580px]:border-t max-[580px]:border-t-[#ebeff5] max-[580px]:pt-[10px] max-[580px]:text-center max-[580px]:[&>a:first-child]:text-[var(--blue)] max-[580px]:[&>a:first-child]:text-[11px] max-[580px]:[&>a:first-child]:font-bold`}>
              <Link to="/login" onClick={onCloseMobile}>Đăng nhập</Link>
              <Link
                to="/register"
                onClick={onCloseMobile}
                className={`button inline-flex justify-center items-center gap-[8px] min-h-[42px] p-[0_17px] border border-[transparent] rounded-[11px] text-[12.5px] font-bold cursor-pointer transition-[transform,box-shadow,color,background] duration-[.2s,.2s,.2s,.2s] ease-[ease,ease,ease,ease] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:transition-[transform] [&_svg]:duration-[.2s] [&_svg]:ease-[ease] hover:transform-[translateY(-2px)] [&:hover_svg]:transform-[translateX(3px)] text-white bg-[linear-gradient(135deg,_#20a4ff,_#0876ef)] shadow-[0_10px_25px_rgba(8,118,239,.25)] hover:shadow-[0_14px_30px_rgba(8,118,239,.38)]`}
              >
                Đăng ký ngay
              </Link>
            </div>
          </nav>
          <div className={`flex items-center gap-[7px] ml-[12px] max-[1050px]:m-0 max-[850px]:ml-[auto] max-[580px]:hidden`}>
            <Link
              to="/login"
              className={`button inline-flex justify-center items-center gap-[8px] min-h-[42px] p-[0_17px] border border-[transparent] rounded-[11px] text-[12.5px] font-bold cursor-pointer transition-[transform,box-shadow,color,background] duration-[.2s,.2s,.2s,.2s] ease-[ease,ease,ease,ease] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:transition-[transform] [&_svg]:duration-[.2s] [&_svg]:ease-[ease] hover:transform-[translateY(-2px)] [&:hover_svg]:transform-[translateX(3px)] text-[#27344b] hover:text-[var(--blue)] hover:bg-[#f0f5ff]`}
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className={`button inline-flex justify-center items-center gap-[8px] min-h-[42px] p-[0_17px] border border-[transparent] rounded-[11px] text-[12.5px] font-bold cursor-pointer transition-[transform,box-shadow,color,background] duration-[.2s,.2s,.2s,.2s] ease-[ease,ease,ease,ease] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:transition-[transform] [&_svg]:duration-[.2s] [&_svg]:ease-[ease] hover:transform-[translateY(-2px)] [&:hover_svg]:transform-[translateX(3px)] text-white bg-[linear-gradient(135deg,_#20a4ff,_#0876ef)] shadow-[0_10px_25px_rgba(8,118,239,.25)] hover:shadow-[0_14px_30px_rgba(8,118,239,.38)]`}
            >
              Đăng ký ngay <Icon name="arrow-right" />
            </Link>
          </div>
          <button
            className={`hidden max-[850px]:grid max-[850px]:place-items-center max-[850px]:w-[39px] max-[850px]:h-[39px] max-[850px]:p-0 max-[850px]:text-[#33435e] max-[850px]:border max-[850px]:border-[#dbe3ee] max-[850px]:rounded-[11px] max-[850px]:bg-white max-[850px]:[&_svg]:w-[19px]`}
            onClick={onToggleMobile}
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
          >
            <Icon name={mobileOpen ? 'x' : 'menu'} />
          </button>
        </div>
      </header>
    </>
  );
}
