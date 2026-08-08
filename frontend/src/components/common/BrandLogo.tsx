import type { SVGProps } from 'react';
import brandMark from '../../assets/homePage/Layer 2.png';
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
    <span className="brand-logo" aria-label="Sinh Viên 5 Tốt">
      <span className="brand-logo__mark" aria-hidden="true">
        <img src={brandMark} alt="" />
      </span>
      {!compact && (
        <span className="brand-logo__copy">
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
