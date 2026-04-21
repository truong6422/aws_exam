import { create } from 'zustand'
import type { ToastMessage } from '@/types'

interface UiState {
  sidebarOpen: boolean
  mobileDrawerOpen: boolean
  toasts: ToastMessage[]
  // Actions
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  openMobileDrawer: () => void
  closeMobileDrawer: () => void
  toggleMobileDrawer: () => void
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

let toastCounter = 0

export const useUiStore = create<UiState>()((set, get) => ({
  sidebarOpen: true,
  mobileDrawerOpen: false,
  toasts: [],

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  openMobileDrawer: () => set({ mobileDrawerOpen: true }),
  closeMobileDrawer: () => set({ mobileDrawerOpen: false }),
  toggleMobileDrawer: () => set((s) => ({ mobileDrawerOpen: !s.mobileDrawerOpen })),

  addToast: (toast) => {
    const id = String(++toastCounter)
    set({ toasts: [...get().toasts, { ...toast, id }] })
    // Auto-dismiss after 4 s
    setTimeout(() => get().removeToast(id), 4000)
  },

  removeToast: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))
