import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Content Container */}
      <div
        className={cn(
          'relative bg-card text-card-foreground rounded-xl border border-border shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-150',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-input text-muted-foreground hover:text-foreground transition-all"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
