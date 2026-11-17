import { pageMetadata } from '@/lib/metadata';
import { FeedbackForm } from '@/ui/components/public/FeedbackForm';
export const metadata = pageMetadata('Feedback', 'Share an idea, report a problem or tell us about your experience with Outline Studio.', '/feedback');
export default function Feedback() {
  return <main id="main" className="page-container feedback-layout"><div><h1>Help shape<br />the next draft.</h1><p>A small suggestion can make the whole flow better. Tell us what felt right, what got in the way or what you wish existed.</p>
    <p className="small" style={{ marginTop: 36 }}>Please leave private documents, API keys and sensitive personal information out of your message.</p></div><FeedbackForm /></main>;
}
