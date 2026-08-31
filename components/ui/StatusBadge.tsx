import { cn, generateOrderStatusColor, generatePaymentStatusColor } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment';
  className?: string;
}

export default function StatusBadge({
  status,
  type = 'order',
  className,
}: StatusBadgeProps) {
  const colorClass = type === 'order'
    ? generateOrderStatusColor(status)
    : generatePaymentStatusColor(status);

  const label = status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}