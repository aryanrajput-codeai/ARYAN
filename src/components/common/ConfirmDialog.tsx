import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-sm text-slate-600 leading-relaxed pt-1">{message}</div>
      </div>
      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
            confirmVariant === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700 shadow-xs'
              : 'bg-slate-900 hover:bg-slate-800 shadow-xs'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
