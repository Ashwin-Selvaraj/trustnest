/**
 * ToastProvider — app-wide non-blocking feedback.
 *
 * Usage: const { showToast } = useToast();
 *        showToast('Interest sent to owner');
 *        showToast('Something failed', 'danger');
 *
 * Feedback hierarchy (see ui-kit Toast docs): toast for no-action success/info,
 * Banner for persistent inline state, Alert only for destructive confirms.
 */
import * as React from 'react';
import { Toast, type ToastVariant } from '@trustnest/ui-kit';

interface ToastState {
  visible: boolean;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toast, setToast] = React.useState<ToastState>({
    visible: false,
    message: '',
    variant: 'success',
  });

  const showToast = React.useCallback((message: string, variant: ToastVariant = 'success') => {
    // Retrigger cleanly if one is already showing
    setToast({ visible: false, message: '', variant });
    requestAnimationFrame(() => setToast({ visible: true, message, variant }));
  }, []);

  const hide = React.useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={hide}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
