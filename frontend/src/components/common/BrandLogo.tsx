import type { SVGProps } from 'react';
import brandMark from '../../assets/home-page/layer-2.png';
import {
  Activity, ArrowLeft, ArrowRight, Award, BellRing, BookOpen, Check, ChevronDown,
  Clock3, Cloud, Eye, EyeOff, FileCheck2, Heart, Home, Image as ImageIcon,
  KeyRound, Layers3, LockKeyhole, LogOut, Mail, Menu, MessageCircle, Phone,
  Play, ShieldCheck, Sparkles, Target, TrendingUp, UploadCloud, User, Users, X,
  type LucideIcon,
} from 'lucide-react';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa6';

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-logo inline-flex items-center gap-[11px]`} aria-label="Sinh Viên 5 Tốt">
      <span className={`brand-logo__mark grid w-[46px] h-[46px] overflow-hidden rounded-full bg-white shadow-[0_6px_18px_rgba(18,91,153,.12)] [&_img]:w-full [&_img]:h-full [&_img]:object-contain [&_img]:transform-[scale(.96)] max-[580px]:w-[39px] max-[580px]:h-[39px]`} aria-hidden="true">
        <img src={brandMark} alt="" />
      </span>
      {!compact && (
        <span className={`brand-logo__copy grid gap-[2px] [&_strong]:font-['Be_Vietnam_Pro',_sans-serif] [&_strong]:text-[15px] [&_strong]:leading-[1.1] [&_strong]:tracking-[-.2px] [&_small]:text-[#8190a8] [&_small]:text-[8px] [&_small]:font-bold [&_small]:tracking-[.65px] [&_small]:uppercase max-[580px]:[&_small]:hidden`}>
          <strong>Sinh Viên 5 Tốt</strong>
          <small>Rèn luyện · Cống hiến · Trưởng thành</small>
        </span>
      )}
    </span>
  );
}

export type IconName =
  | 'arrow-right' | 'book' | 'check' | 'chevron-down' | 'clock' | 'cloud' | 'heart'
  | 'home' | 'image' | 'layers' | 'lock' | 'mail' | 'menu' | 'message' | 'phone'
  | 'play' | 'shield' | 'sparkles' | 'target' | 'trend' | 'upload' | 'users' | 'x'
  | 'eye' | 'eye-off' | 'arrow-left' | 'user' | 'key' | 'award' | 'activity'
  | 'bell' | 'file-check' | 'facebook' | 'instagram' | 'youtube' | 'log-out';

type LucideIconName = Exclude<IconName, 'facebook' | 'instagram' | 'youtube'>;

const icons: Record<LucideIconName, LucideIcon> = {
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  book: BookOpen,
  check: Check,
  'chevron-down': ChevronDown,
  clock: Clock3,
  cloud: Cloud,
  heart: Heart,
  home: Home,
  image: ImageIcon,
  layers: Layers3,
  lock: LockKeyhole,
  mail: Mail,
  menu: Menu,
  message: MessageCircle,
  phone: Phone,
  play: Play,
  shield: ShieldCheck,
  sparkles: Sparkles,
  target: Target,
  trend: TrendingUp,
  upload: UploadCloud,
  users: Users,
  x: X,
  eye: Eye,
  'eye-off': EyeOff,
  user: User,
  key: KeyRound,
  award: Award,
  activity: Activity,
  bell: BellRing,
  'file-check': FileCheck2,
  'log-out': LogOut,
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  if (name === 'facebook') return <FaFacebookF aria-hidden="true" className={props.className} />;
  if (name === 'instagram') return <FaInstagram aria-hidden="true" className={props.className} />;
  if (name === 'youtube') return <FaYoutube aria-hidden="true" className={props.className} />;
  const LucideIcon = icons[name];
  return <LucideIcon aria-hidden="true" strokeWidth={1.8} {...props} />;
}
