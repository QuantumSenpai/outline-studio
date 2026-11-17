'use client';
import { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';
export function MathText({ expression }: { expression: string }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    let active = true;
    void import('katex').then(({ default: katex }) => {
      if (active) setHtml(katex.renderToString(expression, { throwOnError: false, trust: false, strict: 'error', maxExpand: 200, maxSize: 10, output: 'htmlAndMathml' }));
    });
    return () => { active = false; };
  }, [expression]);
  return html ? <div className="math-expression" dangerouslySetInnerHTML={{ __html: html }} /> : <code>{expression}</code>;
}
