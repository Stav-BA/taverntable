import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, default 4000
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => string;
  remove: (id: string) => void;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
}

let _counter = 0;
function nextId() {
  return `toast-${Date.now()}-${++_counter}`;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  add(toast) {
    const id = nextId();
    const duration = toast.duration ?? 4000;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id, duration }] }));

    if (duration > 0) {
      setTimeout(() => get().remove(id), duration);
    }

    return id;
  },

  remove(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  success(message, duration) {
    return get().add({ type: 'success', message, duration });
  },
  error(message, duration) {
    return get().add({ type: 'error', message, duration });
  },
  info(message, duration) {
    return get().add({ type: 'info', message, duration });
  },
  warning(message, duration) {
    return get().add({ type: 'warning', message, duration });
  },
}));

// Convenience export for use outside of React components
export const toast = {
  success: (msg: string, dur?: number) => useToastStore.getState().success(msg, dur),
  error: (msg: string, dur?: number) => useToastStore.getState().error(msg, dur),
  info: (msg: string, dur?: number) => useToastStore.getState().info(msg, dur),
  warning: (msg: string, dur?: number) => useToastStore.getState().warning(msg, dur),
  remove: (id: string) => useToastStore.getState().remove(id),
};
