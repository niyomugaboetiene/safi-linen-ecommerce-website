import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

export default function Skeleton({
  className,
  variant = 'rectangular',
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'h-10 w-10 rounded-full',
    rectangular: 'h-24 w-full',
    rounded: 'h-24 w-full rounded-lg',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-neutral-200',
        variantClasses[variant],
        className
      )}
    />
  );
}