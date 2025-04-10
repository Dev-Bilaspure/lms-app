import { Inbox } from 'lucide-react'; // Or any relevant icon
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  message = "No items found",
  description,
  icon = <Inbox className="h-12 w-12 text-muted-foreground" />,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "p-8 md:p-12 lg:p-16", // Responsive padding
        "border-2 border-dashed border-border rounded-lg bg-card", // Visual container
        className
      )}
    >
      <div className="mb-4">{icon}</div>
      <p className="text-lg font-medium text-foreground mb-1">{message}</p>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}