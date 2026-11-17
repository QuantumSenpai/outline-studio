import type { DocumentSettings } from '@outline-studio/schemas';

const fields = [
  ['student', 'Student name', 120], ['roll', 'Roll number', 80], ['section', 'Section', 80], ['course', 'Course / subject', 160],
  ['department', 'Department', 160], ['university', 'University', 200], ['supervisor', 'Supervisor / faculty (optional)', 120], ['date', 'Submission date', 40],
] as const;
export function AcademicFields({ settings, update, onError }: { settings: DocumentSettings;
  update: (value: Partial<DocumentSettings>) => void; onError: (value: string) => void }) {
  return <details open={settings.style === 'academic'}><summary>Cover details · optional and configurable</summary><div className="form-grid" style={{ marginTop: 18 }}>
    {fields.map(([field, label, max]) => <label key={field}>{label}<input value={settings[field]} maxLength={max}
      type={field === 'date' ? 'date' : 'text'} onChange={e => update({ [field]: e.target.value })} /></label>)}
    <label>University logo (PNG/JPEG, up to 300 KB)<input type="file" accept="image/png,image/jpeg" onChange={e => {
      const file = e.target.files?.[0]; if (!file) return;
      if (file.size > 300000 || !['image/png', 'image/jpeg'].includes(file.type)) { onError('Choose a PNG or JPEG under 300 KB.'); return; }
      const reader = new FileReader();
      reader.onload = () => { if (typeof reader.result === 'string') update({ logo: reader.result }); };
      reader.onerror = () => onError('Logo could not be read.'); reader.readAsDataURL(file);
    }} /></label>{settings.logo && <button className="text-button" onClick={() => update({ logo: undefined })}>Remove logo</button>}
  </div></details>;
}
