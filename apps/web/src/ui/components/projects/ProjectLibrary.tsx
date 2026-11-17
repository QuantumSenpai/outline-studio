'use client';

import Link from 'next/link';
import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';
import { styles } from '@outline-studio/config';
import type { StyleId } from '@outline-studio/schemas';
import { localDatabase } from '@/adapters/storage/database';
import { createProject, deleteProject, duplicateProject } from '@/adapters/storage/projects';
import { projectSchema, type Project } from '@/domain/projects/schema';
import { messageFrom } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ProjectBackup, ProjectImport } from './ArchiveActions';
import { Modal } from '../ui/dialog';
import { Button } from '../ui/button';
import '@/ui/styles/projects.css';

export function ProjectLibrary() {
  const [projects, setProjects] = useState<Project[]>([]); const [query, setQuery] = useState('');
  const [style, setStyle] = useState<StyleId>('academic'); const [status, setStatus] = useState('Opening local projects…');
  const [pending, setPending] = useState(false); const [selected, setSelected] = useState<Project | null>(null);
  const [action, setAction] = useState<'rename' | 'delete'>('rename'); const [name, setName] = useState('');
  const router = useRouter();
  useEffect(() => {
    const subscription = liveQuery(() => localDatabase.projects.orderBy('updatedAt').reverse()
      .filter(project => project.name.toLowerCase().includes(query.toLowerCase())).limit(100).toArray())
      .subscribe({ next: rows => { setProjects(rows); setStatus(''); }, error: () => setStatus('Local storage could not be opened. Keep browser data intact and import a backup when available.') });
    return () => subscription.unsubscribe();
  }, [query]);
  async function perform(work: () => Promise<void>) {
    setPending(true); setStatus('');
    try { await work(); } catch (error) { setStatus(messageFrom(error)); } finally { setPending(false); }
  }
  return <div className="project-library">
    <div className="project-create"><label>Starting template<select value={style} onChange={event => setStyle(styles.find(item => item.id === event.target.value)?.id ?? 'academic')}>
      {styles.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <Button disabled={pending} onClick={() => void perform(async () => { const checkpoint = await createProject(style); router.push(`/workspace?project=${checkpoint.projectId}`); })}>Create local project</Button>
    </div>
    <ProjectImport />
    <label>Search local projects<input type="search" value={query} maxLength={160} onChange={event => setQuery(event.target.value)} placeholder="Project name" /></label>
    <p className="small muted">Stored on this browser/device. Showing up to 100 matching projects, newest first. Search to find older work. Export backups before clearing browser data.</p>
    {status && <p role="status" className="notice">{status}</p>}
    {!status && !projects.length && <p className="notice">{query ? 'No projects match this name.' : 'No local projects yet. Choose a template to begin.'}</p>}
    <ul className="project-list">{projects.map(project => <li key={project.id}><div><h2><Link href={`/workspace?project=${project.id}`}>{project.name}</Link></h2>
      <p className="small muted">{project.checkpoint.settings.style} · Revision {project.checkpoint.revision} · {new Date(project.updatedAt).toLocaleString()}</p></div>
      <div className="button-row"><Link className="button button-outline" href={`/workspace?project=${project.id}`}>Open</Link><Link className="text-link" href={`/history?project=${project.id}`}>Version history</Link>
        <ProjectBackup id={project.id} name={project.name} /><button className="text-button" disabled={pending} onClick={() => { setSelected(project); setName(project.name); setAction('rename'); }}>Rename</button>
        <button className="text-button" disabled={pending} onClick={() => void perform(async () => { await duplicateProject(project.id); })}>Duplicate</button>
        <button className="text-button" disabled={pending} onClick={() => { setSelected(project); setAction('delete'); }}>Delete</button></div></li>)}</ul>
    <Modal open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }} title={action === 'rename' ? 'Rename local project' : 'Delete local project'}
      description={action === 'rename' ? 'Only the project name changes; document titles and history are preserved.' : 'This removes this project, its versions and retained downloads on this device. Other projects and provider keys are unchanged. Export a backup first; deletion cannot be undone.'}>
      {action === 'rename' && <label>Project name<input value={name} maxLength={160} onChange={event => setName(event.target.value)} /></label>}
      <div className="button-row"><Button disabled={pending || action === 'rename' && !name.trim()} onClick={() => void perform(async () => {
        if (!selected) return;
        if (action === 'delete') await deleteProject(selected.id);
        else await localDatabase.projects.update(selected.id, { name: projectSchema.shape.name.parse(name) });
        setSelected(null);
      })}>{action === 'rename' ? 'Save project name' : 'Delete this project'}</Button><Button variant="outline" onClick={() => setSelected(null)}>Keep project</Button></div>
    </Modal>
  </div>;
}
