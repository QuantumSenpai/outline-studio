'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="main" className="page-container empty-page"><h1>A pause in the flow.</h1>
    <p>This page couldn’t load. Saved local drafts are preserved. Retry, or return to the home page.</p>
    <div className="button-row"><button className="button button-primary" onClick={reset}>Try again</button><Link href="/">Go home</Link></div></main>;
}
