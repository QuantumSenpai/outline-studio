import Dexie, { type EntityTable } from 'dexie';
import type { Checkpoint } from '@/domain/pipeline/checkpoint';
export const localDatabase = new Dexie('outline-studio') as Dexie & {
  checkpoints: EntityTable<{ id: string; data: Checkpoint }, 'id'>;
  vault: EntityTable<{ id: string; data: unknown }, 'id'>;
};
localDatabase.version(1).stores({ checkpoints: 'id', vault: 'id' });
