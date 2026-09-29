import { create } from "zustand";
export const useAuthStore = create((set) => ({
  // State
  isLoggedIn: false,

  // Actions

  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),
}));
