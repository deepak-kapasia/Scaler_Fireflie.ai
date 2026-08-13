interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center mb-5 text-gray-300 dark:text-gray-600 transition-colors">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
