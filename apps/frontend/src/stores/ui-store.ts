import { create } from 'zustand'
import type { ToastMessage } from '@/types'

interface UiState {
  sidebarOpen: boolean
  toasts: ToastMessage[]
  // Actions
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

let toastCounter = 0

export const useUiStore = create<UiState>()((set, get) => ({
  sidebarOpen: true,
  toasts: [],

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

  addToast: (toast) => {
    const id = String(++toastCounter)
    set({ toasts: [...get().toasts, { ...toast, id }] })
    // Auto-dismiss after 4 s
    setTimeout(() => get().removeToast(id), 4000)
  },

  removeToast: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))
