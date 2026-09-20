import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  id?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  id = 'empty-state',
}) => {
  return (
    <div
      id={id}
      className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50"
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-4 border border-slate-200">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          id={`${id}-action-btn`}
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
