'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef, useState, useSyncExternalStore } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Database, KeyRound, Settings2, ArrowLeft, WifiOff } from 'lucide-react';
import { type StyleId, stageNameSchema } from '@outline-studio/schemas';
import { styles } from '@outline-studio/config';
import { useWorkspace } from '../stores/workspaceStore';
import { useProviders } from '../stores/providerStore';
import { useCheckpoint } from '../hooks/useCheckpoint';
import { usePipeline } from '../hooks/usePipeline';
import { useOnline } from '../hooks/useOnline';
import { useChat } from '../hooks/useChat';
import { Conversation } from '../components/workspace/Conversation';
import { Modal } from '../components/ui/dialog';
import { TaskRail } from '../components/workspace/TaskRail';
import { CoworkerPanel } from '../components/workspace/CoworkerPanel';
import { ProviderSetup } from '../components/workspace/ProviderSetup';
import { StyleSettings } from '../components/workspace/StyleSettings';
import { DataControls } from '../components/workspace/DataControls';
import { messageFrom } from '@/lib/api';
import { SelectionIndicator } from '../components/workspace/SelectionIndicator';
import { useWorkspaceMotion } from '../hooks/useWorkspaceMotion';

const DocumentView = dynamic(() => import('../components/workspace/DocumentView').then(m => m.DocumentView), { loading: () => <p className="notice">Opening document preview…</p> });
const ExportPanel = dynamic(() => import('../components/workspace/ExportPanel').then(m => m.ExportPanel), { loading: () => <p className="notice">Opening download tools…</p> });
const VersionHistory = dynamic(() => import('../components/projects/VersionHistory').then(m => m.VersionHistory));
const ResearchPanel = dynamic(() => import('../components/workspace/ResearchPanel').then(m => m.ResearchPanel));
const tabs = [['conversation','Conversation'],['document','Document'],['planner','Planner'],['writer','Writer'],['diagram','Diagram designer'],['reviewer','Reviewer'],['researcher','Researcher'],['exporter','Exporter'],['history','History']] as const;

function listenForWideScreen(update: () => void) {
  const media = matchMedia('(min-width: 1200px)');
  media.addEventListener('change', update);
  return () => media.removeEventListener('change', update);
}

export function WorkspaceScreen({ style, projectId, fresh = false }: { style: StyleId; projectId?: string; fresh?: boolean }) {
  const wide = useSyncExternalStore(listenForWideScreen, () => matchMedia('(min-width: 1200px)').matches, () => false);
  const loaded = useCheckpoint(style, projectId, fresh);
  const chat = useChat(); const store = useWorkspace(); const providers = useProviders(); const pipeline = usePipeline(); const online = useOnline();
  const busy = pipeline.busy || chat.busy;
  const motionRoot = useRef<HTMLElement>(null);
  useWorkspaceMotion(motionRoot, loaded && store.hydrated, store.activeTab, store.checkpoint?.mode === 'chat');
  const [tasksOpen, setTasksOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false); const [styleOpen, setStyleOpen] = useState(false); const [dataOpen, setDataOpen] = useState(false);
  if (!loaded || !store.hydrated || !store.checkpoint) return <main id="main" className="page-container empty-page" aria-busy="true"><h1>Opening your studio.</h1><p>Loading local drafts and checkpoints…</p></main>;
  const { checkpoint, activeTab, setTab } = store;
  const chatMode = checkpoint.mode === 'chat';
  const visibleTabs = tabs.filter(([value]) => {
    if (value === 'conversation' || value === 'document' || value === 'history') return true;
    const task = checkpoint.tasks.find(item => item.stage === value);
    return task ? task.status !== 'queued' || activeTab === value : activeTab === value;
  });
  function requireProvider(action: () => void) {
    if (!online) { store.message('You are offline. Review and edit local work now; reconnect before generating.'); return; }
    if (!providers.connections.some(c => c.validated && c.provider === providers.primary)) { setProviderOpen(true); return; }
    action();
  }
  function retry() {
    requireProvider(() => pipeline.send({ type: activeTab === 'planner' ? 'PLAN' : activeTab === 'reviewer' ? 'REVIEW' : 'COMPOSE' }));
  }
  const stage = stageNameSchema.safeParse(activeTab);
  const tools = <div className="workspace-tools"><button aria-label={`Document style settings · ${styles.find(s => s.id === checkpoint.settings.style)?.name}`} onClick={() => setStyleOpen(true)} disabled={busy}><Settings2 size={16} /><span>{styles.find(s => s.id === checkpoint.settings.style)?.name}</span><small className="toolbar-short-label">Style</small></button>
    <button aria-label={providers.primary ? `${providers.primary} connected` : 'Connect AI'} onClick={() => setProviderOpen(true)} disabled={busy}><KeyRound size={16} /><span>{providers.primary ? `${providers.primary} connected` : 'Connect AI'}</span><small className="toolbar-short-label">{providers.primary ?? 'AI'}</small></button>
    <button aria-label="Data controls" onClick={() => setDataOpen(true)} disabled={busy}><Database size={16} /><span>Data controls</span><small className="toolbar-short-label">Data</small></button></div>;
  return <main id="main" ref={motionRoot} className="workspace-shell"><header className="workspace-toolbar"><h1 className="sr-only">Workspace</h1><Link href="/" className="chat-brand">Outline Studio</Link><Link className="project-identity" href="/projects">{checkpoint.outline?.title || 'Local projects'}</Link><span role="status" className="small muted">{store.saveState === 'saved' ? 'Saved on this device' : store.saveState === 'failed' ? 'Not saved · export a backup' : 'Saving locally…'}</span>{tools}</header>
    {!chatMode && <div className="mobile-tasks"><Modal open={tasksOpen} onOpenChange={setTasksOpen} title="Workflow controls" description="Inspect a coworker, manage sources or set the task limit."
      trigger={<button className="text-button">Workflow controls</button>}><TaskRail busy={busy} onNavigate={() => setTasksOpen(false)} /></Modal></div>}
    {!online && <div className="workspace-network" role="status"><WifiOff size={16} /> Offline · local review and editing remain available. Reconnect, then retry unfinished stages.</div>}
    {store.persistenceError && <p className="notice error" role="alert">{store.persistenceError}</p>}
    <div className={`workspace-body${chatMode ? ' chat-mode' : ''}`}><div className="workspace-sidebar" data-visible={!chatMode} aria-hidden={chatMode} inert={chatMode}><TaskRail busy={busy} /></div><Tabs.Root className="workspace-main" value={activeTab} onValueChange={setTab}>
      <Tabs.List aria-label="Workspace views" className="workspace-tabs"><SelectionIndicator value={activeTab} />{visibleTabs.map(([value,label]) => <Tabs.Trigger value={value} key={value}>{label}</Tabs.Trigger>)}</Tabs.List>
      <Tabs.Content value="conversation" className="workspace-tab-content"><div className="work-panes"><Conversation busy={busy} onPlan={() => requireProvider(() => void pipeline.plan().catch(error => store.message(messageFrom(error))))}
        onChat={(documentation, retry) => requireProvider(() => void chat.send(documentation, retry))} chatPartial={chat.partial} chatError={chat.error}
        attachments={chat.attachments} onAddFiles={chat.addFiles} onRemoveAttachment={chat.removeAttachment} useImages={chat.useImages} onUseImages={chat.setUseImages} preparing={chat.preparing}
        onCancel={chat.busy ? chat.cancel : pipeline.cancel} onAccept={() => requireProvider(pipeline.accept)} onReview={() => requireProvider(() => pipeline.send({ type: 'REVIEW' }))}
        onResume={() => requireProvider(() => pipeline.send({ type: 'COMPOSE' }))} openProvider={() => setProviderOpen(true)} chat={chat} />
        {wide && checkpoint.document && <aside className="side-preview scroll-panel" aria-label="Document alongside conversation"><DocumentView companion busy={busy} /></aside>}</div></Tabs.Content>
      <Tabs.Content value="document" className="workspace-tab-content scroll-panel"><DocumentView busy={busy} /></Tabs.Content>
      {stage.success && <Tabs.Content value={stage.data} className="workspace-tab-content scroll-panel"><CoworkerPanel stage={stage.data} busy={busy} onRetry={retry} onCancel={chat.busy ? chat.cancel : pipeline.cancel} /></Tabs.Content>}
      <Tabs.Content value="researcher" className="workspace-tab-content scroll-panel"><ResearchPanel busy={busy} /></Tabs.Content>
      <Tabs.Content value="history" className="workspace-tab-content scroll-panel"><VersionHistory /></Tabs.Content>
      <Tabs.Content value="exporter" className="workspace-tab-content scroll-panel"><ExportPanel busy={busy} /></Tabs.Content>
    </Tabs.Root></div>
    {activeTab !== 'conversation' && <button className="mobile-return" onClick={() => setTab('conversation')}><ArrowLeft size={16} /> Main conversation</button>}
    <ProviderSetup open={providerOpen} onOpenChange={setProviderOpen} /><StyleSettings open={styleOpen} onOpenChange={setStyleOpen} /><DataControls open={dataOpen} onOpenChange={setDataOpen} />
  </main>;
}
