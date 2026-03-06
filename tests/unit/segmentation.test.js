// Jest unit tests for pure helper functions in segmentation.js.
// These run in Node and do not require a browser, a SAM model, or the CDN.

const {
  normalizeCoords,
  getMaskColor,
  buildSamInputs,
  parseHsla,
  hslToRgb,
  drawClickMarker,
} = require('../../js/segmentation.js');

// Minimal canvas mock used by drawClickMarker tests.
function makeMockCanvas(w, h) {
  const ctx = {
    save:      jest.fn(),
    restore:   jest.fn(),
    beginPath: jest.fn(),
    moveTo:    jest.fn(),
    lineTo:    jest.fn(),
    arc:       jest.fn(),
    stroke:    jest.fn(),
    fill:      jest.fn(),
    strokeStyle: '',
    lineWidth:   0,
    fillStyle:   '',
  };
  return { width: w, height: h, getContext: () => ctx, _ctx: ctx };
}

// ── normalizeCoords ───────────────────────────────────────────────────────

test('normalizeCoords returns [0.5, 0.5] for a centre click', () => {
  expect(normalizeCoords(256, 128, 512, 256)).toEqual([0.5, 0.5]);
});

test('normalizeCoords returns [0, 0] for a top-left click', () => {
  expect(normalizeCoords(0, 0, 512, 256)).toEqual([0, 0]);
});

test('normalizeCoords returns [1, 1] for a bottom-right click', () => {
  expect(normalizeCoords(512, 256, 512, 256)).toEqual([1, 1]);
});

test('normalizeCoords handles non-centre positions', () => {
  expect(normalizeCoords(100, 50, 400, 200)).toEqual([0.25, 0.25]);
});

// ── getMaskColor ──────────────────────────────────────────────────────────

test('getMaskColor returns distinct colours for adjacent indices', () => {
  expect(getMaskColor(0)).not.toBe(getMaskColor(1));
});

test('getMaskColor cycles every 5 indices', () => {
  expect(getMaskColor(0)).toBe(getMaskColor(5));
  expect(getMaskColor(1)).toBe(getMaskColor(6));
  expect(getMaskColor(4)).toBe(getMaskColor(9));
});

test('getMaskColor returns a valid HSLA string', () => {
  const color = getMaskColor(0);
  expect(color).toMatch(/^hsla\(\d+,\s*\d+%,\s*\d+%,\s*[\d.]+\)$/);
});

// ── buildSamInputs ────────────────────────────────────────────────────────

test('buildSamInputs formats input_points correctly', () => {
  const result = buildSamInputs(320, 240);
  expect(result.input_points).toEqual([[[320, 240]]]);
});

test('buildSamInputs uses foreground label (1)', () => {
  const result = buildSamInputs(320, 240);
  expect(result.input_labels).toEqual([[1]]);
});

test('buildSamInputs works at boundary coordinates', () => {
  expect(buildSamInputs(0, 0).input_points).toEqual([[[0, 0]]]);
  expect(buildSamInputs(1024, 768).input_points).toEqual([[[1024, 768]]]);
});

// ── parseHsla ─────────────────────────────────────────────────────────────

test('parseHsla extracts alpha value correctly', () => {
  const { a } = parseHsla('hsla(0, 0%, 0%, 0.45)');
  expect(a).toBeCloseTo(0.45);
});

test('parseHsla converts black correctly', () => {
  const { r, g, b } = parseHsla('hsla(0, 0%, 0%, 1)');
  expect(r).toBe(0);
  expect(g).toBe(0);
  expect(b).toBe(0);
});

test('parseHsla converts white correctly', () => {
  const { r, g, b } = parseHsla('hsla(0, 0%, 100%, 1)');
  expect(r).toBe(255);
  expect(g).toBe(255);
  expect(b).toBe(255);
});

test('parseHsla returns a fallback for invalid input', () => {
  const result = parseHsla('not-a-color');
  expect(typeof result.r).toBe('number');
  expect(typeof result.g).toBe('number');
  expect(typeof result.b).toBe('number');
  expect(typeof result.a).toBe('number');
});

// ── hslToRgb ──────────────────────────────────────────────────────────────

test('hslToRgb converts pure red correctly', () => {
  const { r, g, b } = hslToRgb(0, 1, 0.5);
  expect(r).toBe(255);
  expect(g).toBe(0);
  expect(b).toBe(0);
});

test('hslToRgb converts pure green correctly', () => {
  const { r, g, b } = hslToRgb(1 / 3, 1, 0.5);
  expect(r).toBe(0);
  expect(g).toBe(255);
  expect(b).toBe(0);
});

test('hslToRgb converts pure blue correctly', () => {
  const { r, g, b } = hslToRgb(2 / 3, 1, 0.5);
  expect(r).toBe(0);
  expect(g).toBe(0);
  expect(b).toBe(255);
});

test('hslToRgb handles achromatic (grey) input', () => {
  const { r, g, b } = hslToRgb(0, 0, 0.5);
  expect(r).toBe(128);
  expect(g).toBe(128);
  expect(b).toBe(128);
});

// ── drawClickMarker ───────────────────────────────────────────────────────

test('drawClickMarker calls save and restore for state isolation', () => {
  const canvas = makeMockCanvas(800, 600);
  drawClickMarker(canvas, 400, 300);
  expect(canvas._ctx.save).toHaveBeenCalledTimes(1);
  expect(canvas._ctx.restore).toHaveBeenCalledTimes(1);
});

test('drawClickMarker draws arcs centred on the click point', () => {
  const canvas = makeMockCanvas(800, 600);
  drawClickMarker(canvas, 123, 456);
  const centredArcs = canvas._ctx.arc.mock.calls.filter(
    ([cx, cy]) => cx === 123 && cy === 456
  );
  expect(centredArcs.length).toBeGreaterThanOrEqual(2); // ring + dot
});

test('drawClickMarker draws crosshair lines through the click point', () => {
  const canvas = makeMockCanvas(800, 600);
  drawClickMarker(canvas, 200, 150);
  // moveTo calls should include y===150 (horizontal) and x===200 (vertical)
  const moves = canvas._ctx.moveTo.mock.calls;
  expect(moves.some(([, y]) => y === 150)).toBe(true); // horizontal arm start
  expect(moves.some(([x]) => x === 200)).toBe(true);   // vertical arm start
});

test('drawClickMarker clamps radius for very small canvases', () => {
  const canvas = makeMockCanvas(50, 50);
  expect(() => drawClickMarker(canvas, 25, 25)).not.toThrow();
  // At least one arc should have radius >= 7 (the minimum clamp)
  const radii = canvas._ctx.arc.mock.calls.map(([, , r]) => r);
  expect(radii.some(r => r >= 7)).toBe(true);
});

test('drawClickMarker clamps radius for very large canvases', () => {
  const canvas = makeMockCanvas(5000, 3000);
  expect(() => drawClickMarker(canvas, 2500, 1500)).not.toThrow();
  // At least one arc should have radius <= 20 (the maximum clamp)
  const radii = canvas._ctx.arc.mock.calls.map(([, , r]) => r);
  expect(radii.some(r => r <= 20)).toBe(true);
});
