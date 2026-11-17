export function rasterDimensions(value: string) {
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) throw new Error('Use a PNG or JPEG logo.');
  const bytes = Uint8Array.from(atob(match[2]), char => char.charCodeAt(0));
  if (bytes.byteLength > 300000) throw new Error('Logo must be under 300 KB.');
  const view = new DataView(bytes.buffer); let width = 0; let height = 0;
  if (match[1] === 'png') {
    if (bytes.length < 33 || [137, 80, 78, 71, 13, 10, 26, 10].some((value, index) => bytes[index] !== value)
      || view.getUint32(8) !== 13 || new TextDecoder().decode(bytes.subarray(12, 16)) !== 'IHDR') throw new Error('Logo bytes are not a valid PNG header.');
    width = view.getUint32(16); height = view.getUint32(20);
  } else {
    if (bytes[0] !== 255 || bytes[1] !== 216) throw new Error('Logo bytes are not a JPEG.');
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 255) throw new Error('Invalid JPEG marker.');
      const marker = bytes[offset + 1];
      if (marker === 218 || marker === 217) break;
      if (marker === 255) { offset++; continue; }
      const size = view.getUint16(offset + 2);
      if (size < 2 || offset + size + 2 > bytes.length) throw new Error('Invalid JPEG segment.');
      if ([192, 193, 194].includes(marker)) {
        if (size < 8 || width) throw new Error('Unsupported JPEG frame.');
        height = view.getUint16(offset + 5); width = view.getUint16(offset + 7);
      }
      offset += size + 2;
    }
  }
  if (!width || !height || width > 4096 || height > 4096 || width * height > 16000000) throw new Error('Logo must have valid dimensions up to 4096 px and 16 megapixels.');
  return { width, height };
}
