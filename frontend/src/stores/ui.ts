import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ToastTone = 'info' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  text: string;
}

interface ToastState {
  toasts: Toast[];
  push: (text: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

let nextToastId = 1;

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (text, tone = 'info') => {
    const id = nextToastId++;
    set({ toasts: [...get().toasts.slice(-3), { id, tone, text }] });
    window.setTimeout(() => get().dismiss(id), tone === 'error' ? 7000 : 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}));

export const toast = (text: string) => useToasts.getState().push(text, 'info');
export const toastError = (text: string) => useToasts.getState().push(text, 'error');

interface PrefsState {
  hideCompleted: boolean;
  setHideCompleted: (value: boolean) => void;
}

const safeStorage = createJSONStorage(() => {
  try {
    const probe = '__cloudbase_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => void memory.set(key, value),
      removeItem: (key: string) => void memory.delete(key),
    };
  }
});

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      hideCompleted: false,
      setHideCompleted: (hideCompleted) => set({ hideCompleted }),
    }),
    { name: 'cloudbase-prefs', storage: safeStorage },
  ),
);
