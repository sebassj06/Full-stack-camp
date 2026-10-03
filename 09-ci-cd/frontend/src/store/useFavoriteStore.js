import { create } from "zustand";
import { useAuthStore } from "./AuthStore";

export const useFavoriteStore = create((set, get) => ({
  // Estado
  favorites: [],

  //Actions
  addFavorite: (jobId) => {
    set((state) => ({
      favorites: state.favorites.includes(jobId)
        ? state.favorites
        : [...state.favorites, jobId],
    }));
  },

  removeFavorites: (jobId) => {
    set((state) => ({
      favorites: state.favorites.filter((id) => id !== jobId),
    }));
  },

  isFavorite: (jobId) => {
    return get().favorites.includes(jobId);
  },

  toggleFavorite: (jobId) => {
    const { isLoggedIn } = useAuthStore.getState();
    const { addFavorite, removeFavorites, isFavorite } = get();
    const isFav = isFavorite(jobId);

    if (isLoggedIn) {
      isFav ? removeFavorites(jobId) : addFavorite(jobId);
    }
  },

  countFavorites: () => {
    return get().favorites.length;
  },
}));
