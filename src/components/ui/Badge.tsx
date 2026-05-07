import { AppointmentStatus, PaymentStatus } from '@/types';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'purple';
  children: React.ReactNode;
  dot?: boolean;
}

const variantClasses = {
  success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-100 text-amber-700 border border-amber-200',
  danger: 'bg-red-100 text-red-700 border border-red-200',
  info: 'bg-sky-100 text-sky-700 border border-sky-200',
  gray: 'bg-gray-100 text-gray-600 border border-gray-200',
  purple: 'bg-purple-100 text-purple-700 border border-purple-200',
};

const dotColors = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
  gray: 'bg-gray-400',
  purple: 'bg-purple-500',
};

export default function Badge({ variant = 'gray', children, dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const map: Record<AppointmentStatus, { variant: BadgeProps['variant']; label: string }> = {
    'chờ khám': { variant: 'warning', label: 'Chờ khám' },
    'đang khám': { variant: 'info', label: 'Đang khám' },
    'hoàn thành': { variant: 'success', label: 'Hoàn thành' },
    'hủy': { variant: 'danger', label: 'Đã hủy' },
  };
  const { variant, label } = map[status] || { variant: 'gray', label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { variant: BadgeProps['variant']; label: string }> = {
    'đã thanh toán': { variant: 'success', label: 'Đã thanh toán' },
    'chưa thanh toán': { variant: 'danger', label: 'Chưa thanh toán' },
    'một phần': { variant: 'warning', label: 'Thanh toán một phần' },
  };
  const { variant, label } = map[status] || { variant: 'gray', label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
}
