import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
export default function NotFound() {
  return <main id="main" className="page-container empty-page"><p>404 / A missing page, not a lost idea.</p>
    <h1>Let’s find your flow.</h1><p>This address doesn’t lead to a page. Your local drafts are still in the workspace.</p>
    <Link className="button button-primary" href="/workspace"><ArrowLeft size={18} /> Return to workspace</Link></main>;
}
