import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/tinos/400.css';
import '@fontsource/tinos/700.css';
import '@/ui/styles/globals.css';
import '@/ui/styles/shell.css';
import '@/ui/styles/public.css';
import '@/ui/styles/workspace.css';
import '@/ui/styles/providers.css';
import '@/ui/styles/chat.css';
import '@/ui/styles/playground.css';
import { Header } from '@/ui/components/shell/Header';
import { Footer } from '@/ui/components/shell/Footer';
import { Preferences } from '@/ui/components/shell/Preferences';
import { siteUrl } from '@/lib/metadata';

export const metadata: Metadata = { metadataBase: new URL(siteUrl),
  title: { default: 'Outline Studio | Every format. One flow.', template: '%s | Outline Studio' },
  description: 'Turn one brief into coordinated reports, slides and labelled diagrams. Local drafts and your own AI provider key.',
  icons: { icon: '/icon.svg' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover',
  interactiveWidget: 'resizes-content', themeColor: '#f6f6ef' };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>
    <Header />{children}<Footer /><Preferences />
  </body></html>;
}
