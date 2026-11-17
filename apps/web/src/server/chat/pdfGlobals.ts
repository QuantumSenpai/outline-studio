class MatrixStub {
  a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  constructor(init?: unknown) { if (typeof init === 'string' && init) this.parse(); }
  parse() { return this; }
  translate() { return this; }
  scale() { return this; }
  invertSelf() { return this; }
  multiplySelf() { return this; }
  preMultiplySelf() { return this; }
  transformPoint(point: { x: number; y: number }) { return point; }
}

export function ensurePdfGlobals() {
  const scope = globalThis as unknown as Record<string, unknown>;
  scope.DOMMatrix ??= MatrixStub;
  scope.ImageData ??= class { constructor() {} };
  scope.Path2D ??= class { constructor() {} };
}
