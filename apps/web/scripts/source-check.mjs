import { readdir, readFile } from 'node:fs/promises';
import ts from 'typescript';
const failures = [];
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) { await check(path); continue; }
    if (!/\.(ts|tsx|css)$/.test(path)) continue;
    const text = await readFile(path, 'utf8');
    const count = text.trimEnd().split('\n').length;
    if (count >= 150) failures.push(`${path}: ${count} lines; source must remain under 150.`);
    if (/\.tsx?$/.test(path)) {
      const source = ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true);
      function visit(node) {
        if (node.kind === ts.SyntaxKind.AnyKeyword) failures.push(`${path}: explicit any type.`);
        const comments = ts.getLeadingCommentRanges(text,node.pos) ?? [];
        if (comments.length) failures.push(`${path}: code comments are disallowed.`);
        ts.forEachChild(node,visit);
      }
      visit(source);
    }
    if (/\/\*/.test(text) && path.endsWith('.css')) failures.push(`${path}: CSS comments are disallowed.`);
  }
}
await check('src');
if (failures.length) { process.stderr.write(`${[...new Set(failures)].join('\n')}\n`); process.exitCode = 1; }
else process.stdout.write('Source size, no-any and zero-comment checks passed.\n');
