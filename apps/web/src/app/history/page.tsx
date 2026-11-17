import { z } from 'zod';
import { HistoryScreen } from '@/ui/screens/HistoryScreen';
import { pageMetadata } from '@/lib/metadata';
export const metadata = { ...pageMetadata('Version history', 'Review versions stored on this device.', '/history'), robots: { index: false, follow: false } };
export default async function History({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const parsed = z.uuid().safeParse((await searchParams).project);
  return <HistoryScreen projectId={parsed.success ? parsed.data : undefined} />;
}
