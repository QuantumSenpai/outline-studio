import { readdir, writeFile } from 'node:fs/promises';

const name = process.argv[2];
if (!name || !/^[a-z][a-z0-9_]{2,60}$/.test(name)) throw new Error('Supply a migration name, for example: pnpm db:generate add_feedback_index');
const directory = new URL('../migrations/', import.meta.url);
const files = (await readdir(directory)).filter(file => /^\d{3,4}_[a-z0-9_]+\.sql$/.test(file));
const number = Math.max(0, ...files.map(file => Number(file.split('_')[0]))) + 1;
if (number > 9999) throw new Error('Review migration numbering before adding more files.');
const file = `${String(number).padStart(3, '0')}_${name}.sql`;
await writeFile(new URL(file, directory), '', { flag: 'wx' });
process.stdout.write(`Created migrations/${file}. Write and review transactional SQL, update schema.ts, then verify against an isolated database before applying. Empty migrations are rejected.\n`);
