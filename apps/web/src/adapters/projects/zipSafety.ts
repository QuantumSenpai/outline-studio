export const archiveLimits = { compressed: 25 * 1024 * 1024, expanded: 80 * 1024 * 1024, entry: 12 * 1024 * 1024, entries: 1200 };
export function safeArchivePath(path: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(path) && !path.split('/').some(part => part === '..' || part === '.' || !part);
}
export function inspectZip(bytes: Uint8Array) {
  if (bytes.byteLength < 22) throw new Error('This is not a valid project ZIP.');
  if (bytes.byteLength > archiveLimits.compressed) throw new Error('Choose a project ZIP under 25 MB.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.byteLength - 22;
  while (end >= Math.max(0, bytes.byteLength - 65557) && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0 || view.getUint32(end, true) !== 0x06054b50) throw new Error('The ZIP directory is invalid.');
  const count = view.getUint16(end + 10, true); let offset = view.getUint32(end + 16, true);
  const size = view.getUint32(end + 12, true);
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || count !== view.getUint16(end + 8, true) || count > archiveLimits.entries || offset + size > end)
    throw new Error('Unsupported multi-volume, ZIP64 or oversized project archive.');
  const names = new Set<string>(); let expanded = 0;
  for (let index = 0; index < count; index++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) throw new Error('Invalid ZIP entry.');
    const flags = view.getUint16(offset + 8, true); const method = view.getUint16(offset + 10, true);
    const length = view.getUint16(offset + 28, true); const extra = view.getUint16(offset + 30, true); const comment = view.getUint16(offset + 32, true);
    const uncompressed = view.getUint32(offset + 24, true); const attributes = view.getUint32(offset + 38, true);
    if (offset + 46 + length + extra + comment > end) throw new Error('Truncated ZIP directory.');
    const name = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(offset + 46, offset + 46 + length));
    if (!safeArchivePath(name) || names.has(name) || flags & 1 || ![0, 8].includes(method) || (attributes >>> 16 & 0xf000) === 0xa000)
      throw new Error('Archive paths, duplicate entries, symlinks or encryption are not supported.');
    expanded += uncompressed;
    if (uncompressed > archiveLimits.entry || expanded > archiveLimits.expanded) throw new Error('Archive expansion exceeds its safe size limit.');
    names.add(name); offset += 46 + length + extra + comment;
  }
  return names;
}
export async function sha256(bytes: Uint8Array) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes)))].map(value => value.toString(16).padStart(2, '0')).join('');
}
