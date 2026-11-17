const collisions = new Map<string, number>();
export function filename(title: string, suffix: string, extension: string) {
  const slug = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90).replace(/-$/,'') || 'outline-document';
  return `${slug}-${suffix}.${extension}`;
}
export function saveFile(data: BlobPart, name: string, type: string) {
  const count = (collisions.get(name) ?? 0) + 1; collisions.set(name, count);
  const actual = count > 1 ? name.replace(/(\.[^.]+)$/, `-${count}$1`) : name;
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = actual;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return actual;
}
