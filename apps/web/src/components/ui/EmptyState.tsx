import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && <div className="mb-4 text-gray-300">{icon}</div>}
    <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
    {description && <p className="mt-2 text-sm text-gray-500 max-w-sm">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
