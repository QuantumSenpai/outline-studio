import { styleIdSchema } from '@outline-studio/schemas';
import { WorkspaceScreen } from '@/ui/screens/WorkspaceScreen';
import { pageMetadata } from '@/lib/metadata';
export const metadata = { ...pageMetadata('Workspace', 'Your private local document workspace.', '/workspace'), robots: { index: false, follow: false } };
export default async function Workspace({ searchParams }: { searchParams: Promise<{ style?: string }> }) {
  const params = await searchParams; const style = styleIdSchema.safeParse(params.style);
  return <WorkspaceScreen style={style.success ? style.data : 'academic'} />;
}
