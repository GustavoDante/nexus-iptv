import { create } from 'zustand';

interface PlayerState {
  isPlaying: boolean;
  streamUrl: string | null;
  streamTitle: string | null;
  isMuted: boolean;
  volume: number;
  setPlaying: (isPlaying: boolean) => void;
  playChannel: (url: string, title: string) => void;
  closePlayer: () => void;
  setMuted: (isMuted: boolean) => void;
  setVolume: (volume: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  streamUrl: null,
  streamTitle: null,
  isMuted: false,
  volume: 1,
  setPlaying: (isPlaying) => set({ isPlaying }),
  playChannel: (url, title) => set({ isPlaying: true, streamUrl: url, streamTitle: title }),
  closePlayer: () => set({ isPlaying: false, streamUrl: null, streamTitle: null }),
  setMuted: (isMuted) => set({ isMuted }),
  setVolume: (volume) => set({ volume }),
}));
