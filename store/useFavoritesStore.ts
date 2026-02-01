import { Channel } from '@/lib/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FavoritesState {
  favorites: Channel[];
  addFavorite: (channel: Channel) => void;
  removeFavorite: (id: number) => void;
  toggleFavorite: (channel: Channel) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (channel) => set((state) => {
        if (state.favorites.some(f => f.id === channel.id)) return state;
        return { favorites: [...state.favorites, channel] };
      }),
      removeFavorite: (id) => set((state) => ({ favorites: state.favorites.filter((fav) => fav.id !== id) })),
      toggleFavorite: (channel) => {
        const { favorites } = get();
        const exists = favorites.some(f => f.id === channel.id);
        
        if (exists) {
            set({ favorites: favorites.filter((fav) => fav.id !== channel.id) });
        } else {
            set({ favorites: [...favorites, channel] });
        }
      },
    }),
    {
      name: 'nexus-favorites',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Helper hook para verificar se um item é favorito sem causar re-renders desnecessários
export function useIsFavorite(id: number): boolean {
  return useFavoritesStore((state) => state.favorites.some((fav) => fav.id === id));
}
