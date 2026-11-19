import { z } from 'zod';
import { PlaygroundScreen } from './PlaygroundScreen';

export default async function PlaygroundPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const project = z.uuid().safeParse((await searchParams).project);
  return <PlaygroundScreen projectId={project.success ? project.data : undefined} />;
}
