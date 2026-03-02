export const Colors = {
  primary: {
    50:  '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
  },
  pink: {
    50:  '#FDF2F8',
    100: '#FCE7F3',
    400: '#F472B6',
    500: '#EC4899',
    600: '#DB2777',
  },
  gray: {
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',

  // Semantic aliases
  background: '#F5F3FF',
  cardBg: 'rgba(255,255,255,0.6)',
  text: {
    primary:   '#111827',
    secondary: '#4B5563',
    muted:     '#9CA3AF',
    white:     '#FFFFFF',
  },
  kakao: '#FEE500',
} as const;

export const Gradients = {
  primary: ['#7C3AED', '#DB2777'] as const,
  background: ['#F5F3FF', '#FDF2F8', '#EFF6FF'] as const,
  card: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)'] as const,
  overlay: ['rgba(0,0,0,0.2)', 'transparent'] as const,
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const BorderRadius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const FontSize = {
  xs:   12,
  sm:   13,
  base: 14,
  md:   16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

export const FontWeight = {
  normal:    '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const MOODS = [
  { emoji: '😊', label: '행복해요',  value: 'happy',     gradient: ['#FACC15', '#FB923C'] as const },
  { emoji: '😌', label: '평온해요',  value: 'peaceful',  gradient: ['#60A5FA', '#22D3EE'] as const },
  { emoji: '🥳', label: '신나요',    value: 'excited',   gradient: ['#F472B6', '#C084FC'] as const },
  { emoji: '😔', label: '우울해요',  value: 'sad',       gradient: ['#C084FC', '#818CF8'] as const },
  { emoji: '💭', label: '생각중',    value: 'thinking',  gradient: ['#9CA3AF', '#64748B'] as const },
  { emoji: '🔥', label: '열정적',    value: 'passionate',gradient: ['#F87171', '#F97316'] as const },
] as const;

export const SUBSCRIPTION_PLANS = {
  monthly: {
    price: '₩9,900',
    period: '월',
    label: '월간 구독',
    total: '매월 ₩9,900',
  },
  yearly: {
    price: '₩99,000',
    period: '년',
    label: '연간 구독',
    total: '연간 ₩99,000',
  },
} as const;
