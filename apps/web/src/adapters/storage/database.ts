import Dexie, { type EntityTable } from 'dexie';
import { checkpointSchema, type Checkpoint } from '@/domain/pipeline/checkpoint';
import type { Project, ProjectVersion, RetainedFile } from '@/domain/projects/schema';

export const localDatabase = new Dexie('outline-studio') as Dexie & {
  checkpoints: EntityTable<{ id: string; data: Checkpoint }, 'id'>;
  vault: EntityTable<{ id: string; data: unknown }, 'id'>;
  projects: EntityTable<Project, 'id'>;
  versions: EntityTable<ProjectVersion, 'id'>;
  files: EntityTable<RetainedFile, 'id'>;
};
localDatabase.version(1).stores({ checkpoints: 'id', vault: 'id' });
localDatabase.version(2).stores({ projects: 'id,name,updatedAt', versions: 'id,projectId,[projectId+number]', files: 'id,projectId' })
  .upgrade(async transaction => {
    const rows = await transaction.table<{ id: string; data: unknown }>('checkpoints').toArray();
    for (const row of rows) {
      const parsed = checkpointSchema.safeParse(row.data);
      if (!parsed.success) throw new Error('A local checkpoint is incompatible. Preserve browser data and export before migrating.');
      const checkpoint = { ...parsed.data, projectId: parsed.data.projectId ?? parsed.data.runId };
      const id = checkpoint.projectId;
      const existing = await transaction.table<Project>('projects').get(id);
      if (!existing || existing.updatedAt < checkpoint.updatedAt) await transaction.table('projects').put({ id,
        name: (checkpoint.document?.title ?? checkpoint.outline?.title ?? checkpoint.brief.slice(0, 100)).slice(0, 160) || 'Untitled project',
        createdAt: checkpoint.updatedAt, updatedAt: checkpoint.updatedAt, checkpoint });
      if (row.id !== 'current') {
        const number = await transaction.table('versions').where('projectId').equals(id).count() + 1;
        await transaction.table('versions').put({ id: crypto.randomUUID(), projectId: id, number,
          name: `Migrated archive ${number}`, createdAt: checkpoint.updatedAt, checkpoint });
      }
      await transaction.table('checkpoints').put({ id: row.id, data: checkpoint });
    }
  });
