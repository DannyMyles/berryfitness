import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  /** Smaller icon/spacing for use inside dense contexts like table cells. */
  compact?: boolean;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  compact = false,
}: EmptyStateProps) {
  const renderAction = (a: EmptyStateAction, primary: boolean) => {
    const content = (
      <>
        {a.icon && <a.icon size={18} />}
        {a.label}
      </>
    );
    const className = primary
      ? 'btn-primary inline-flex items-center gap-2'
      : 'inline-flex items-center gap-2 text-fitness-primary font-medium hover:text-fitness-primary-dark transition-colors';

    return a.href ? (
      <Link href={a.href} className={className}>
        {content}
      </Link>
    ) : (
      <button type="button" onClick={a.onClick} className={className}>
        {content}
      </button>
    );
  };

  if (compact) {
    return (
      <div className={`flex flex-col items-center justify-center text-center py-6 px-4 ${className}`}>
        <Icon size={22} className="text-gray-300 mb-2" />
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5 max-w-xs">{description}</p>}
        {(action || secondaryAction) && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm">
            {action && renderAction(action, false)}
            {secondaryAction && renderAction(secondaryAction, false)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-gray-500 max-w-sm">{description}</p>}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
          {action && renderAction(action, true)}
          {secondaryAction && renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  );
}
