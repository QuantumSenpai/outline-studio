import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChatText } from '@/ui/components/workspace/ChatText';

const render = (text: string) => renderToStaticMarkup(createElement(ChatText, { text }));
describe('chat reply formatting', () => {
  it('renders the reported numbered reply with real bold labels', () => {
    const html = render('1. **Refine the Text:** Clean academic text.\n2. **Retry the Document:** Use Create document.');
    expect(html).toContain('<ol>');
    expect(html).toContain('<strong>Refine the Text:</strong>');
    expect(html).toContain('<strong>Retry the Document:</strong>');
    expect(html).not.toContain('**');
  });
  it('handles emphasis, nested lists, inline code and fenced code without formatting code contents', () => {
    const html = render('*A useful note* with `**literal**`.\n\n- **One**\n  - Two\n\n```js\nconst label = "**keep**";\n```');
    expect(html).toContain('<em>A useful note</em>');
    expect(html).toContain('<code>**literal**</code>');
    expect(html.match(/<ul>/g)).toHaveLength(2);
    expect(html).toContain('<pre><code>const label = &quot;**keep**&quot;;</code></pre>');
  });
  it('keeps untrusted HTML inert and rejects active links and remote image loading', () => {
    const html = render('<img src=x onerror=alert(1)>\n\n[unsafe](javascript:alert(1)) ![tracking](https://example.org/pixel.png)\n\n[safe](https://example.org/guide)');
    expect(html).not.toMatch(/<img|<script|href="javascript:/);
    expect(html).toContain('href="https://example.org/guide"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('tracking');
  });
  it('supports incomplete streaming fences and escaped Markdown', () => {
    expect(render('```js\nconst value = 1;')).toContain('<pre><code>const value = 1;</code></pre>');
    expect(render('\\*\\*literal\\*\\*')).not.toContain('<strong>');
  });
  it('renders readable headings and tables and retains ordered-list numbering', () => {
    const html = render('## Summary\n\n| Criterion | Result |\n| --- | --- |\n| Clarity | **Met** |\n\n3. Review\n4. Export');
    expect(html).toContain('<h2>Summary</h2>');
    expect(html).toContain('<th scope="col">Criterion</th>');
    expect(html).toContain('<td><strong>Met</strong></td>');
    expect(html).toContain('<ol start="3">');
  });
});
