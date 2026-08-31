import { Package } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
        {icon || <Package className="h-8 w-8 text-neutral-400" />}
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {actionLabel && (actionHref || onAction) && (
        <Button
          href={actionHref}
          onClick={onAction}
          variant="primary"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}