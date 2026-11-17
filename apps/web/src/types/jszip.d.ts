import type JSZip from 'jszip';
declare module 'jszip' {
  interface JSZipObject {
    internalStream(type: 'uint8array'): JSZip.JSZipStreamHelper<Uint8Array>;
  }
}
