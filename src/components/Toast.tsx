'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (toast: Omit<Toast, 'id'>) => void;
    dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const duration = toast.duration || 4000;
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onDismiss, 200);
        }, duration);

        return () => clearTimeout(timer);
    }, [toast.duration, onDismiss]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(onDismiss, 200);
    };

    return (
        <div
            className={`${styles.toast} ${styles[toast.type]} ${isExiting ? styles.exiting : ''}`}
            role="alert"
            aria-live="polite"
        >
            <span className={styles.icon}>{icons[toast.type]}</span>
            <div className={styles.content}>
                <p className={styles.title}>{toast.title}</p>
                {toast.message && <p className={styles.message}>{toast.message}</p>}
            </div>
            <button
                className={styles.dismissButton}
                onClick={handleDismiss}
                aria-label="Dismiss notification"
            >
                <X size={16} />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts(prev => [...prev, { ...toast, id }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, dismissToast }}>
            {children}
            <div className={styles.container} aria-label="Notifications">
                {toasts.map(toast => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onDismiss={() => dismissToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
