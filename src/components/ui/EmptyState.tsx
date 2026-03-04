import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-12 h-12 rounded-2xl bg-navy-50 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-navy-400" />
      </div>
      <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
      {description && (
        <p className="text-sm text-navy-500 mt-1 text-center max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
