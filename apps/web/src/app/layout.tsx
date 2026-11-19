import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import '@fontsource/tinos/400.css';
import '@fontsource/tinos/700.css';
import '@/ui/styles/globals.css';
import '@/ui/styles/motion.css';
import '@/ui/styles/shell.css';
import '@/ui/styles/public.css';
import '@/ui/styles/workspace.css';
import '@/ui/styles/providers.css';
import '@/ui/styles/chat.css';
import '@/ui/styles/playground.css';
import '@/ui/styles/workspace-motion.css';
import { Header } from '@/ui/components/shell/Header';
import { Footer } from '@/ui/components/shell/Footer';
import { Preferences } from '@/ui/components/shell/Preferences';
import { siteUrl } from '@/lib/metadata';

const displayFont = localFont({ src: '../../node_modules/@fontsource/tinos/files/tinos-latin-400-normal.woff2', variable: '--font-tinos', weight: '400', display: 'swap', adjustFontFallback: 'Times New Roman' });

export const metadata: Metadata = { metadataBase: new URL(siteUrl),
  title: { default: 'Outline Studio | Every format. One flow.', template: '%s | Outline Studio' },
  description: 'Turn one brief into coordinated reports, slides and labelled diagrams. Local drafts and your own AI provider key.',
  icons: { icon: '/icon.svg' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover',
  interactiveWidget: 'resizes-content', themeColor: '#F7F8FA' };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={displayFont.variable}><body><a className="skip-link" href="#main">Skip to content</a>
    <Header />{children}<Footer /><Preferences />
  </body></html>;
}
