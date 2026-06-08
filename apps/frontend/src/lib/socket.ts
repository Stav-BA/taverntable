import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getBackendUrl(): string {
  // Explicit env var wins (works locally and when set in Render dashboard)
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
  // Auto-detect: if running on Render, derive backend URL from frontend hostname
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://taverntable-backend.onrender.com';
  }
  return 'http://localhost:3001';
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getBackendUrl(), {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(sessionId: string, playerId: string, isDM: boolean): Socket {
  const s = getSocket();
  s.auth = { sessionId, playerId, isDM };
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// Typed event emitters
export const socketEmit = {
  joinSession: (sessionId: string, playerId: string, playerName: string, isDM: boolean) =>
    getSocket().emit('session:join', { sessionId, playerId, playerName, isDM }),

  tokenMove: (tokenId: string, x: number, y: number) =>
    getSocket().emit('token:move', { tokenId, x, y }),

  tokenAdd: (token: Record<string, unknown>) =>
    getSocket().emit('token:add', token),

  tokenUpdate: (tokenId: string, updates: Record<string, unknown>) =>
    getSocket().emit('token:update', { tokenId, updates }),

  diceRoll: (expression: string, modifier: number, requestId: string) =>
    getSocket().emit('dice:roll', { expression, modifier, requestId }),

  chatMessage: (text: string) => getSocket().emit('chat:message', { text }),

  fogReveal: (area: Record<string, unknown>) => getSocket().emit('fog:reveal', { area }),
  fogHide: (areaId: string) => getSocket().emit('fog:hide', { areaId }),
  fogToggle: (enabled: boolean) => getSocket().emit('fog:toggle', { enabled }),

  initiativeSet: (combatants: unknown[]) => getSocket().emit('initiative:set', { combatants }),
  initiativeNext: () => getSocket().emit('initiative:next'),
  initiativeUpdate: (id: string, updates: Record<string, unknown>) =>
    getSocket().emit('initiative:update', { id, updates }),

  combatStart: () => getSocket().emit('combat:start'),
  combatEnd: () => getSocket().emit('combat:end'),

  mapChange: (mapId: string, mapConfig?: Record<string, unknown>) =>
    getSocket().emit('map:change', { mapId, mapConfig }),

  audioPlay: (trackId: string) => getSocket().emit('audio:play', { trackId }),
  audioPause: () => getSocket().emit('audio:pause'),
  audioVolume: (volume: number) => getSocket().emit('audio:volume', { volume }),

  ping: (x: number, y: number, colour: string) => getSocket().emit('ping', { x, y, colour }),

  restShort: () => getSocket().emit('rest:short'),
  restLong:  () => getSocket().emit('rest:long'),
};
