// Jest unit tests for pure helper functions in segmentation.js.
// These run in Node and do not require a browser, a SAM model, or the CDN.

const {
  normalizeCoords,
  getMaskColor,
  buildSamInputs,
  parseHsla,
  hslToRgb,
} = require('../../js/segmentation.js');

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
  const result = buildSamInputs(0.5, 0.3);
  expect(result.input_points).toEqual([[[0.5, 0.3]]]);
});

test('buildSamInputs uses foreground label (1)', () => {
  const result = buildSamInputs(0.5, 0.3);
  expect(result.input_labels).toEqual([[1]]);
});

test('buildSamInputs works at boundary coordinates', () => {
  expect(buildSamInputs(0, 0).input_points).toEqual([[[0, 0]]]);
  expect(buildSamInputs(1, 1).input_points).toEqual([[[1, 1]]]);
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
