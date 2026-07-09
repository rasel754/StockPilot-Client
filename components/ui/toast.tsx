'use client';

import React, { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: Array<(toast: ToastItem) => void> = [];

export const toast = (message: string, type: ToastType = 'info') => {
  const id = Math.random().toString(36).substring(2, 9);
  toastListeners.forEach((listener) => listener({ id, message, type }));
};

// Also export as a helper object
export const showToast = {
  success: (msg: string) => toast(msg, 'success'),
  error: (msg: string) => toast(msg, 'error'),
  info: (msg: string) => toast(msg, 'info'),
  warning: (msg: string) => toast(msg, 'warning'),
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const addToast = (newToast: ToastItem) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((listener) => listener !== addToast);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full p-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`p-4 rounded-xl shadow-xl border text-white font-medium flex items-center justify-between gap-4 transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            t.type === 'success'
              ? 'bg-emerald-600 border-emerald-700 dark:bg-emerald-700'
              : t.type === 'error'
              ? 'bg-red-600 border-red-700 dark:bg-red-700'
              : t.type === 'warning'
              ? 'bg-amber-600 border-amber-700 dark:bg-amber-700'
              : 'bg-slate-700 border-slate-800 dark:bg-slate-800'
          }`}
        >
          <span className="text-xs md:text-sm">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="text-white hover:opacity-75 transition-opacity text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
