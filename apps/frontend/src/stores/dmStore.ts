import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NPC {
  id: string;
  name: string;
  role: 'merchant' | 'guard' | 'noble' | 'villain' | 'ally' | 'shopkeeper' | 'innkeeper' | 'quest-giver' | 'monster' | 'other';
  disposition: 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'ally';
  hp: number;
  maxHp: number;
  portrait: string; // emoji
  notes: string;
}

export interface Monster {
  slug: string;
  name: string;
  cr: number;
  hp: number;
  ac: number;
  type: string;
  xp: number;
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  sessionNumber: number;
  title: string;
  body: string;
  tags: Array<'combat' | 'roleplay' | 'discovery' | 'milestone'>;
  characterTags: string[];
}

export interface AIDMMessage {
  id: string;
  role: 'dm' | 'user';
  content: string;
  timestamp: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed' | 'unknown';
}

interface DMState {
  // NPC management
  npcs: NPC[];
  addNPC: (npc: NPC) => void;
  updateNPC: (id: string, update: Partial<NPC>) => void;
  removeNPC: (id: string) => void;

  // Encounter builder
  encounterMonsters: { monster: Monster; count: number }[];
  addToEncounter: (monster: Monster) => void;
  removeFromEncounter: (slug: string) => void;
  setCount: (slug: string, count: number) => void;
  clearEncounter: () => void;

  // Campaign journal
  journalEntries: JournalEntry[];
  currentSession: number;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;

  // AI DM state
  campaignName: string;
  campaignTone: 'heroic' | 'gritty' | 'comedic' | 'horror' | 'mystery';
  campaignLore: string;
  campaignSetting: string;
  currentScene: string;
  aiMessages: AIDMMessage[];
  isAIStreaming: boolean;
  setCampaignName: (name: string) => void;
  setCampaignTone: (tone: DMState['campaignTone']) => void;
  setCampaignLore: (lore: string) => void;
  setCampaignSetting: (setting: string) => void;
  setCurrentScene: (scene: string) => void;
  addAIMessage: (msg: AIDMMessage) => void;
  appendAIChunk: (chunk: string) => void;
  setAIStreaming: (val: boolean) => void;

  // World state
  currentLocation: string;
  activeQuests: Quest[];
  addQuest: (quest: Quest) => void;
  updateQuestStatus: (id: string, status: Quest['status']) => void;
  setLocation: (loc: string) => void;
}

export const useDMStore = create<DMState>()(
  persist(
    (set) => ({
      npcs: [],
      addNPC: (npc) => set((s) => ({ npcs: [...s.npcs, npc] })),
      updateNPC: (id, update) =>
        set((s) => ({ npcs: s.npcs.map((n) => (n.id === id ? { ...n, ...update } : n)) })),
      removeNPC: (id) => set((s) => ({ npcs: s.npcs.filter((n) => n.id !== id) })),

      encounterMonsters: [],
      addToEncounter: (monster) =>
        set((s) => {
          const existing = s.encounterMonsters.find((e) => e.monster.slug === monster.slug);
          if (existing) {
            return {
              encounterMonsters: s.encounterMonsters.map((e) =>
                e.monster.slug === monster.slug ? { ...e, count: e.count + 1 } : e
              ),
            };
          }
          return { encounterMonsters: [...s.encounterMonsters, { monster, count: 1 }] };
        }),
      removeFromEncounter: (slug) =>
        set((s) => ({ encounterMonsters: s.encounterMonsters.filter((e) => e.monster.slug !== slug) })),
      setCount: (slug, count) =>
        set((s) => ({
          encounterMonsters: count <= 0
            ? s.encounterMonsters.filter((e) => e.monster.slug !== slug)
            : s.encounterMonsters.map((e) => e.monster.slug === slug ? { ...e, count } : e),
        })),
      clearEncounter: () => set({ encounterMonsters: [] }),

      journalEntries: [],
      currentSession: 1,
      addJournalEntry: (entry) =>
        set((s) => ({
          journalEntries: [
            ...s.journalEntries,
            { ...entry, id: Math.random().toString(36).slice(2), timestamp: Date.now() },
          ],
        })),

      campaignName: '',
      campaignTone: 'heroic',
      campaignLore: '',
      campaignSetting: '',
      currentScene: '',
      aiMessages: [],
      isAIStreaming: false,
      setCampaignName: (campaignName) => set({ campaignName }),
      setCampaignTone: (campaignTone) => set({ campaignTone }),
      setCampaignLore: (campaignLore) => set({ campaignLore }),
      setCampaignSetting: (campaignSetting) => set({ campaignSetting }),
      setCurrentScene: (currentScene) => set({ currentScene }),
      addAIMessage: (msg) => set((s) => ({ aiMessages: [...s.aiMessages, msg] })),
      appendAIChunk: (chunk) =>
        set((s) => {
          if (s.aiMessages.length === 0) return s;
          const msgs = [...s.aiMessages];
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + chunk };
          return { aiMessages: msgs };
        }),
      setAIStreaming: (isAIStreaming) => set({ isAIStreaming }),

      currentLocation: '',
      activeQuests: [],
      addQuest: (quest) => set((s) => ({ activeQuests: [...s.activeQuests, quest] })),
      updateQuestStatus: (id, status) =>
        set((s) => ({ activeQuests: s.activeQuests.map((q) => (q.id === id ? { ...q, status } : q)) })),
      setLocation: (currentLocation) => set({ currentLocation }),
    }),
    {
      name: 'taverntable-dm',
      partialize: (state) => ({
        npcs: state.npcs,
        journalEntries: state.journalEntries,
        currentSession: state.currentSession,
        campaignName: state.campaignName,
        campaignTone: state.campaignTone,
        campaignLore: state.campaignLore,
        campaignSetting: state.campaignSetting,
        currentScene: state.currentScene,
        currentLocation: state.currentLocation,
        activeQuests: state.activeQuests,
      }),
    }
  )
);
