import { create } from 'zustand';

export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  category: 'tavern' | 'combat' | 'dungeon' | 'forest' | 'city' | 'boss' | 'ambient';
}

export interface AudioState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  volume: number; // 0-1
  tracks: AudioTrack[];
  audioElement: HTMLAudioElement | null;

  // Actions
  setTrack: (track: AudioTrack) => void;
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  setAudioElement: (el: HTMLAudioElement | null) => void;
  stopAll: () => void;
}

const PRESET_TRACKS: AudioTrack[] = [
  {
    id: 'tavern-lively',
    name: 'Lively Tavern',
    url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_12a5498067.mp3',
    category: 'tavern',
  },
  {
    id: 'dungeon-dark',
    name: 'Dark Dungeon',
    url: 'https://cdn.pixabay.com/audio/2022/06/09/audio_b84b5289f3.mp3',
    category: 'dungeon',
  },
  {
    id: 'combat-intense',
    name: 'Intense Combat',
    url: 'https://cdn.pixabay.com/audio/2023/06/15/audio_9d16cf62e4.mp3',
    category: 'combat',
  },
  {
    id: 'forest-calm',
    name: 'Forest Ambiance',
    url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_6af1484fe7.mp3',
    category: 'forest',
  },
  {
    id: 'boss-fight',
    name: 'Boss Encounter',
    url: 'https://cdn.pixabay.com/audio/2022/11/19/audio_fccce17899.mp3',
    category: 'boss',
  },
];

export const useAudioStore = create<AudioState>()((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.4,
  tracks: PRESET_TRACKS,
  audioElement: null,

  setAudioElement: (el) => set({ audioElement: el }),

  setTrack: (track) => {
    const { audioElement, volume } = get();
    if (audioElement) {
      audioElement.src = track.url;
      audioElement.volume = volume;
      audioElement.loop = true;
      audioElement.play().catch(() => {
        // Autoplay blocked - user must click
      });
    }
    set({ currentTrack: track, isPlaying: true });
  },

  play: () => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.play().catch(() => {});
    }
    set({ isPlaying: true });
  },

  pause: () => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.pause();
    }
    set({ isPlaying: false });
  },

  setVolume: (volume) => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.volume = volume;
    }
    set({ volume });
  },

  stopAll: () => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    set({ isPlaying: false, currentTrack: null });
  },
}));
