'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Database, KeyRound, Settings2, ArrowLeft, WifiOff } from 'lucide-react';
import { type StyleId, stageNameSchema } from '@outline-studio/schemas';
import { styles } from '@outline-studio/config';
import { useWorkspace } from '../stores/workspaceStore';
import { useProviders } from '../stores/providerStore';
import { useCheckpoint } from '../hooks/useCheckpoint';
import { usePipeline } from '../hooks/usePipeline';
import { useOnline } from '../hooks/useOnline';
import { Conversation } from '../components/workspace/Conversation';
import { TaskRail } from '../components/workspace/TaskRail';
import { CoworkerPanel } from '../components/workspace/CoworkerPanel';
import { ProviderSetup } from '../components/workspace/ProviderSetup';
import { StyleSettings } from '../components/workspace/StyleSettings';
import { DataControls } from '../components/workspace/DataControls';
import { messageFrom } from '@/lib/api';

const DocumentView = dynamic(() => import('../components/workspace/DocumentView').then(m => m.DocumentView), { loading: () => <p className="notice">Opening document preview…</p> });
const ExportPanel = dynamic(() => import('../components/workspace/ExportPanel').then(m => m.ExportPanel), { loading: () => <p className="notice">Opening download tools…</p> });
const ResearchPanel = dynamic(() => import('../components/workspace/ResearchPanel').then(m => m.ResearchPanel));
const tabs = [['conversation','Conversation'],['document','Document'],['planner','Planner'],['writer','Writer'],['diagram','Diagram designer'],['reviewer','Reviewer'],['researcher','Researcher'],['exporter','Exporter']] as const;

export function WorkspaceScreen({ style }: { style: StyleId }) {
  useCheckpoint(style);
  const store = useWorkspace(); const providers = useProviders(); const pipeline = usePipeline(); const online = useOnline();
  const [providerOpen, setProviderOpen] = useState(false); const [styleOpen, setStyleOpen] = useState(false); const [dataOpen, setDataOpen] = useState(false);
  if (!store.hydrated || !store.checkpoint) return <main id="main" className="page-container empty-page" aria-busy="true"><h1>Opening your studio.</h1><p>Loading local drafts and checkpoints…</p></main>;
  const { checkpoint, activeTab, setTab } = store;
  function requireProvider(action: () => void) {
    if (!online) { store.message('You are offline. Review and edit local work now; reconnect before generating.'); return; }
    if (!providers.connections.some(c => c.validated && c.provider === providers.primary)) { setProviderOpen(true); return; }
    action();
  }
  function retry() {
    requireProvider(() => pipeline.send({ type: activeTab === 'planner' ? 'PLAN' : activeTab === 'reviewer' ? 'REVIEW' : 'COMPOSE' }));
  }
  const stage = stageNameSchema.safeParse(activeTab);
  return <main id="main" className="workspace-shell"><header className="workspace-toolbar"><div><h1>Workspace</h1><p>{checkpoint.outline?.title || 'A fresh page, a shared direction.'}</p></div>
    <div className="workspace-tools"><button onClick={() => setStyleOpen(true)} disabled={pipeline.busy}><Settings2 size={16} /><span>{styles.find(s => s.id === checkpoint.settings.style)?.name}</span></button>
      <button onClick={() => setProviderOpen(true)} disabled={pipeline.busy}><KeyRound size={16} /><span>{providers.primary ? `${providers.primary} connected` : 'Connect AI'}</span></button>
      <button onClick={() => setDataOpen(true)} disabled={pipeline.busy}><Database size={16} /><span>Data controls</span></button></div></header>
    {!online && <div className="workspace-network" role="status"><WifiOff size={16} /> Offline · local review and editing remain available. Reconnect, then retry unfinished stages.</div>}
    {store.persistenceError && <p className="notice error" role="alert">{store.persistenceError}</p>}
    <div className="workspace-body"><TaskRail busy={pipeline.busy} /><Tabs.Root className="workspace-main" value={activeTab} onValueChange={setTab}>
      <Tabs.List aria-label="Workspace views" className="workspace-tabs">{tabs.map(([value,label]) => <Tabs.Trigger value={value} key={value}>{label}</Tabs.Trigger>)}</Tabs.List>
      <Tabs.Content value="conversation" className="workspace-tab-content"><Conversation busy={pipeline.busy} onPlan={() => requireProvider(() => void pipeline.plan().catch(error => store.message(messageFrom(error))))}
        onCancel={pipeline.cancel} onAccept={() => requireProvider(pipeline.accept)} onReview={() => requireProvider(() => pipeline.send({ type: 'REVIEW' }))}
        onResume={() => requireProvider(() => pipeline.send({ type: 'COMPOSE' }))} openProvider={() => setProviderOpen(true)} /></Tabs.Content>
      <Tabs.Content value="document" className="workspace-tab-content scroll-panel"><DocumentView busy={pipeline.busy} /></Tabs.Content>
      {stage.success && <Tabs.Content value={stage.data} className="workspace-tab-content scroll-panel"><CoworkerPanel stage={stage.data} busy={pipeline.busy} onRetry={retry} onCancel={pipeline.cancel} /></Tabs.Content>}
      <Tabs.Content value="researcher" className="workspace-tab-content scroll-panel"><ResearchPanel busy={pipeline.busy} /></Tabs.Content>
      <Tabs.Content value="exporter" className="workspace-tab-content scroll-panel"><ExportPanel busy={pipeline.busy} /></Tabs.Content>
    </Tabs.Root></div>
    {activeTab !== 'conversation' && <button className="mobile-return" onClick={() => setTab('conversation')}><ArrowLeft size={16} /> Main conversation</button>}
    <ProviderSetup open={providerOpen} onOpenChange={setProviderOpen} /><StyleSettings open={styleOpen} onOpenChange={setStyleOpen} /><DataControls open={dataOpen} onOpenChange={setDataOpen} />
  </main>;
}
