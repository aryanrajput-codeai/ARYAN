import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="modal-backdrop"
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Dialog Box / Bottom Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            id="modal-dialog"
            className={`surface-modal rounded-t-2xl sm:rounded-2xl border border-[#E7E9EE] bg-white w-full ${maxWidthClasses} overflow-hidden relative z-10 shadow-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-[#E7E9EE] rounded-full mx-auto mt-2.5 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E9EE] bg-[#F7F8FA]">
              <div>
                <h3 className="text-base font-semibold text-[#171A21]">{title}</h3>
                {subtitle && <p className="text-xs text-[#687080] mt-0.5">{subtitle}</p>}
              </div>
              <button
                id="modal-close-btn"
                onClick={onClose}
                className="text-[#687080] hover:text-[#171A21] p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#E7E9EE] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
