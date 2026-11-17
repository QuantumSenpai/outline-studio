'use client';

import { useState } from 'react';
import { styles } from '@outline-studio/config';
import { settingsSchema, type DocumentSettings } from '@outline-studio/schemas';
import { useWorkspace } from '../../stores/workspaceStore';
import { Button } from '../ui/button';
import { Modal } from '../ui/dialog';
import { AcademicFields } from './AcademicFields';

export function StyleSettings({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const { checkpoint, setSettings } = useSettingsBridge();
  const [error, setError] = useState('');
  if (!checkpoint) return null;
  const settings = checkpoint.settings;
  function update(value: Partial<DocumentSettings>) {
    const result = settingsSchema.safeParse({ ...settings, ...value });
    if (!result.success) { setError(result.error.issues[0]?.message ?? 'Invalid settings.'); return; }
    setSettings(result.data); setError('');
  }
  return <Modal open={open} onOpenChange={onOpenChange} title="Document style & requirements" description="These settings guide generation, preview and downloads together. Changes invalidate the previous review.">
    <div className="form-stack"><label>Starting style<select value={settings.style} onChange={e => update({ style: settingsSchema.shape.style.parse(e.target.value) })}>
      {styles.map(style => <option key={style.id} value={style.id}>{style.name}</option>)}</select></label>
      <p className="notice">{styles.find(s => s.id === settings.style)?.instructions}</p>
      <AcademicFields settings={settings} update={update} onError={setError} />
      <div className="form-grid"><label>Page size<select value={settings.pageSize} onChange={e => update({ pageSize: e.target.value === 'A4' ? 'A4' : 'LETTER' })}><option>A4</option><option>LETTER</option></select></label>
        <label>Margin (mm)<input type="number" min={12} max={40} value={settings.margin} onChange={e => update({ margin: Number(e.target.value) })} /></label>
        <label>Line spacing<select value={settings.lineSpacing} onChange={e => update({ lineSpacing: Number(e.target.value) })}><option value={1}>1.0</option><option value={1.15}>1.15</option><option value={1.5}>1.5</option><option value={2}>2.0</option></select></label>
        <label>First page number<input type="number" min={1} max={100} value={settings.numberStart} onChange={e => update({ numberStart: Number(e.target.value) })} /></label></div>
      {([['cover', 'Include a title/front page'], ['contents', 'Include a contents list'], ['numbering', 'Show page numbers'], ['numberCover', 'Number the cover page'], ['watermark', 'Add a visible “Outline Studio draft” watermark']] as const).map(([field, label]) =>
        <label className="check-label" key={field}><input type="checkbox" checked={settings[field]} onChange={e => update({ [field]: e.target.checked })} />{label}</label>)}
      <p className="small muted">Academic fonts: Times New Roman when installed in your document viewer; licensed Tinos fallback in browser/PDF. University formatting is configurable, not universal. Watermarking is optional and off by default.</p>
      {error && <p role="alert" className="notice error">{error}</p>}<Button onClick={() => onOpenChange(false)}>Use these requirements</Button></div>
  </Modal>;
}
function useSettingsBridge() {
  const { checkpoint, setSettings } = useWorkspace();
  return { checkpoint, setSettings };
}
