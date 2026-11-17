import { pageMetadata } from '@/lib/metadata';
import { ProjectLibrary } from '@/ui/components/projects/ProjectLibrary';
export const metadata = { ...pageMetadata('Local projects', 'Manage projects stored on this device.', '/projects'), robots: { index: false, follow: false } };
export default function Projects() {
  return <main id="main" className="page-container"><header className="page-heading"><h1>Your local projects.</h1><p>Create, reopen and preserve your work. Projects, conversations and documents stay on this device; generation uses your configured provider.</p></header><ProjectLibrary /></main>;
}
