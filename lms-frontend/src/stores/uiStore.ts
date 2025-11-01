import { create } from 'zustand';

interface UiStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  modals: Record<string, boolean>;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const useUiStore = create<UiStore>(set => ({
  theme: 'light',
  sidebarOpen: false,
  notifications: [],
  modals: {},
  toggleTheme: () => {
    set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
  },
  toggleSidebar: () => {
    set(state => ({ sidebarOpen: !state.sidebarOpen }));
  },
  addNotification: notification => {
    set(state => ({
      notifications: [...state.notifications, notification],
    }));
  },
  removeNotification: id => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },
  openModal: modalId => {
    set(state => ({ modals: { ...state.modals, [modalId]: true } }));
  },
  closeModal: modalId => {
    set(state => ({ modals: { ...state.modals, [modalId]: false } }));
  },
}));
