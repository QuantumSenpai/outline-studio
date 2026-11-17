import { expose } from 'comlink';
import { instance } from '@viz-js/viz';
import { diagramSchema } from '@outline-studio/schemas';
import { graphvizSource } from '@/domain/ir/diagramSources';
export const diagramService = {
  async render(value: unknown) {
    const diagram = diagramSchema.parse(value);
    const engine = await instance();
    return engine.renderString(graphvizSource(diagram), { format: 'svg', engine: 'dot' });
  },
};
expose(diagramService);
