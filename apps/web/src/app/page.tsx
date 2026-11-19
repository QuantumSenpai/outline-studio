import { Hero } from '@/ui/components/public/Hero';
import { Walkthrough } from '@/ui/components/public/Walkthrough';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata('Every format. One flow.', 'Outline Studio turns one brief into coordinated reports, slides and labelled diagrams. Local drafts. Bring your own AI key.', '/');
export default function Home() {
  return <main id="main">
    <Hero />

    <section className="walkthrough-band" aria-labelledby="walk-heading">
      <div className="page-container">
        <div className="section-heading">
          <h2 id="walk-heading">From conversation<br />to document.</h2>
          <p>Try the flow with a sample brief. This walkthrough is illustrative; real work begins when you connect a provider.</p>
        </div>
        <Walkthrough />
      </div>
    </section>
    <section className="format-section page-container" aria-labelledby="formats-heading">
      <div className="section-heading">
        <h2 id="formats-heading">Made for<br />your kind of work.</h2>
        <p>Choose a starting style. Review its requirements. Keep formatting, generation instructions and downloads in step.</p>
      </div>
      <div className="format-list">
        {[
          ['DOCX / PDF', 'Academic assignments', 'A considered cover, configurable formatting and clear references.', 'academic'],
          ['DOCX / PPTX', 'Professional reports', 'From executive context to concise presentation slides.', 'professional'],
          ['DOCX / PDF', 'Research-paper drafts', 'Abstracts, keywords and a place for verified sources.', 'research'],
          ['DOCX / PDF', 'Question-paper solutions', 'Original numbering, useful working and visible uncertainty.', 'solutions'],
        ].map(([ext, title, text, style]) => (
          <a key={style} className="format-link" href={`/templates?style=${style}`}>
            <span className="format-extension">{ext}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </a>
        ))}
      </div>
    </section>
  </main>;
}
