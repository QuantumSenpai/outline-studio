import { create } from 'zustand';
import { connectionSchema, type Connection, type ProviderId } from '@outline-studio/schemas';
import { z } from 'zod';

export const savedConnectionsSchema = z.array(connectionSchema).max(4);
export type ConfiguredConnection = Connection & { validated: boolean; verifiedAt: string };
type ProviderState = {
  connections: ConfiguredConnection[]; fallback: boolean; primary: ProviderId | null; cooldowns: Partial<Record<ProviderId, number>>;
  put: (connection: ConfiguredConnection) => void; remove: (provider: ProviderId) => void;
  setPrimary: (provider: ProviderId) => void; setFallback: (value: boolean) => void;
  move: (provider: ProviderId, direction: -1 | 1) => void; cooldown: (provider: ProviderId, seconds: number) => void;
  lock: () => void;
};
export const useProviders = create<ProviderState>((set) => ({
  connections: [], fallback: false, primary: null, cooldowns: {},
  put: connection => set(state => ({ connections: [...state.connections.filter(c => c.provider !== connection.provider), connection], primary: state.primary ?? connection.provider })),
  remove: provider => set(state => ({ connections: state.connections.filter(c => c.provider !== provider),
    primary: state.primary === provider ? state.connections.find(c => c.provider !== provider)?.provider ?? null : state.primary })),
  setPrimary: primary => set({ primary }), setFallback: fallback => set({ fallback }),
  move: (provider, direction) => set(state => {
    const connections = [...state.connections]; const index = connections.findIndex(c => c.provider === provider);
    const target = index + direction;
    if (index >= 0 && target >= 0 && target < connections.length) [connections[index], connections[target]] = [connections[target], connections[index]];
    return { connections };
  }),
  cooldown: (provider, seconds) => set(state => ({ cooldowns: { ...state.cooldowns, [provider]: Date.now() + seconds * 1000 } })),
  lock: () => set({ connections: [], primary: null, fallback: false, cooldowns: {} }),
}));
