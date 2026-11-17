import { styleIdSchema } from '@outline-studio/schemas';
import { pageMetadata } from '@/lib/metadata';
import { TemplatePicker } from '@/ui/components/public/TemplatePicker';
export const metadata = pageMetadata('Templates', 'Choose an academic assignment, professional report, research-paper draft or question-paper solution style.', '/templates');
export default async function Templates({ searchParams }: { searchParams: Promise<{ style?: string }> }) {
  const params = await searchParams;
  const initial = styleIdSchema.safeParse(params.style);
  return <main id="main" className="page-container"><header className="page-heading"><h1>A strong place<br />to start.</h1>
    <p>Four thoughtful styles. Your requirements. Choose a starting point, then tailor the details in your workspace.</p></header><TemplatePicker initial={initial.success ? initial.data : 'academic'} /></main>;
}
