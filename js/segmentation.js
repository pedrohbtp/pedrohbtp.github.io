/**
 * segmentation.js
 * In-browser Segment Anything Model (SAM) utilities.
 *
 * Pure helper functions are declared at the top so that Node.js / Jest can
 * require() this file and unit-test them without loading the browser or the
 * Transformers.js CDN.  All SAM inference code uses dynamic import() so the
 * CDN URL is only fetched when initModel() is actually called (never during
 * unit tests).
 */

'use strict';

// ── Pure, testable utility functions ──────────────────────────────────────

/**
 * Normalise a canvas click position to the [0, 1] range.
 * @param {number} clickX
 * @param {number} clickY
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {[number, number]}
 */
function normalizeCoords(clickX, clickY, canvasWidth, canvasHeight) {
  return [clickX / canvasWidth, clickY / canvasHeight];
}

/**
 * Return an HSLA colour string for a given mask index, cycling through
 * a palette of distinct hues.
 * @param {number} maskIndex
 * @returns {string}
 */
function getMaskColor(maskIndex) {
  var hues = [220, 0, 120, 40, 280];
  var hue = hues[maskIndex % hues.length];
  return 'hsla(' + hue + ', 80%, 55%, 0.45)';
}

/**
 * Build the SAM processor point-prompt input dict for a single click.
 * @param {number} x  Click x in canvas-pixel coordinates
 * @param {number} y  Click y in canvas-pixel coordinates
 * @returns {{ input_points: number[][][], input_labels: number[][] }}
 */
function buildSamInputs(x, y) {
  return {
    input_points: [[[x, y]]],
    input_labels: [[1]],
  };
}

/**
 * Parse an HSLA string (e.g. "hsla(220, 80%, 55%, 0.45)") into {r,g,b,a}.
 * @param {string} hsla
 * @returns {{ r: number, g: number, b: number, a: number }}
 */
function parseHsla(hsla) {
  var m = hsla.match(
    /hsla?\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/
  );
  if (!m) return { r: 37, g: 99, b: 235, a: 0.45 };
  var rgb = hslToRgb(
    parseInt(m[1], 10) / 360,
    parseFloat(m[2]) / 100,
    parseFloat(m[3]) / 100
  );
  return { r: rgb.r, g: rgb.g, b: rgb.b, a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
}

/**
 * Convert HSL (all values 0–1) to integer RGB (0–255).
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @returns {{ r: number, g: number, b: number }}
 */
function hslToRgb(h, s, l) {
  var r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    var hue2rgb = function (p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ── Module-level SAM state ─────────────────────────────────────────────────

var _samModel     = null;
var _samProcessor = null;
var _isModelReady = false;
var _isProcessing = false;
var _maskCount    = 0;

// ── Model initialisation ───────────────────────────────────────────────────

/**
 * Load the MobileSAM model and processor (once per page load).
 * Uses dynamic import() so the CDN URL is never fetched at module-parse time,
 * which keeps unit tests fast and dependency-free.
 *
 * @param {function} onProgress  Called with {status, progress, file} objects
 * @returns {Promise<void>}
 */
async function initModel(onProgress) {
  if (_isModelReady) return;

  var tf = await import(
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/dist/transformers.min.js'
  );
  var SamModel     = tf.SamModel;
  var SamProcessor = tf.SamProcessor;
  var env          = tf.env;

  env.allowLocalModels = false;
  env.useBrowserCache  = true;

  var MODEL_ID = 'Xenova/slimsam-77-uniform';
  var cb = function (info) { if (onProgress) onProgress(info); };

  var results = await Promise.all([
    SamProcessor.from_pretrained(MODEL_ID, { progress_callback: cb }),
    SamModel.from_pretrained(MODEL_ID,      { progress_callback: cb }),
  ]);
  _samProcessor = results[0];
  _samModel     = results[1];
  _isModelReady = true;
}

/**
 * Run SAM inference for a single click point and draw the result.
 *
 * @param {HTMLCanvasElement} sourceCanvas   Canvas with the user's image
 * @param {number} clickX                   Click X in canvas-pixel coordinates
 * @param {number} clickY                   Click Y in canvas-pixel coordinates
 * @param {HTMLCanvasElement} overlayCanvas  Transparent canvas for mask overlays
 * @returns {Promise<boolean>}  true if mask drawn, false if busy / not ready
 */
async function runSegmentation(sourceCanvas, clickX, clickY, overlayCanvas) {
  if (!_isModelReady || _isProcessing) return false;

  _isProcessing = true;
  try {
    var RawImage = (await import(
      'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/dist/transformers.min.js'
    )).RawImage;

    var rawImage = await RawImage.fromURL(sourceCanvas.toDataURL());

    var inputs       = await _samProcessor(rawImage, buildSamInputs(clickX, clickY));
    var outputs      = await _samModel(inputs);
    var pred_masks   = outputs.pred_masks;

    var masks = await _samProcessor.post_process_masks(
      pred_masks,
      inputs.original_sizes,
      inputs.reshaped_input_sizes
    );

    // masks[0] is a Tensor [num_masks, H, W].  Prefer the sliced first mask
    // via proxy indexing; fall back to the full batch tensor so drawMaskOnCanvas
    // can use its last-two-dims logic (picks data[0..H*W-1] = mask 0).
    var maskTensor = masks[0][0];
    if (!maskTensor || !maskTensor.dims) maskTensor = masks[0];
    drawMaskOnCanvas(overlayCanvas, maskTensor, _maskCount);
    _maskCount++;
    return true;
  } finally {
    _isProcessing = false;
  }
}

/**
 * Draw a boolean SAM mask tensor as a semi-transparent colour overlay.
 *
 * Handles tensors of shape [H, W] or [N, H, W] (e.g. when Transformers.js v3
 * returns the full batch of candidate masks without pre-slicing).  When the
 * tensor has 3+ dims we use the last two as height/width and read only the
 * first mask's pixel data (offset = 0), which is equivalent to picking mask 0.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ dims: number[], data: Uint8Array|boolean[] }} maskTensor
 * @param {number} maskIndex
 */
function drawMaskOnCanvas(canvas, maskTensor, maskIndex) {
  var ctx    = canvas.getContext('2d');
  var dims   = maskTensor.dims;
  var h, w;

  // Robust dim extraction: accept [H,W] and [N,H,W] (or deeper) shapes.
  if (dims.length >= 3) {
    h = dims[dims.length - 2];
    w = dims[dims.length - 1];
  } else {
    h = dims[0];
    w = dims[1];
  }

  var rgba    = parseHsla(getMaskColor(maskIndex));
  var imgData = ctx.createImageData(w, h);
  var px      = imgData.data;
  var mask    = maskTensor.data;
  var alpha   = Math.round(rgba.a * 255);

  for (var i = 0; i < h * w; i++) {
    if (mask[i]) {
      var idx    = i * 4;
      px[idx]     = rgba.r;
      px[idx + 1] = rgba.g;
      px[idx + 2] = rgba.b;
      px[idx + 3] = alpha;
    }
  }

  // Composite via a temporary canvas to preserve existing overlay content.
  var tmp    = document.createElement('canvas');
  tmp.width  = w;
  tmp.height = h;
  tmp.getContext('2d').putImageData(imgData, 0, 0);
  ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
}

/**
 * Draw a crosshair + circle marker at (cx, cy) on the overlay canvas to show
 * exactly where the user clicked.
 *
 * @param {HTMLCanvasElement} canvas  The overlay (mask) canvas.
 * @param {number} cx                Click X in canvas-pixel coordinates.
 * @param {number} cy                Click Y in canvas-pixel coordinates.
 */
function drawClickMarker(canvas, cx, cy) {
  var ctx = canvas.getContext('2d');
  var r   = Math.max(7, Math.min(20, canvas.width * 0.016));
  var arm = r * 1.6; // crosshair arm length

  ctx.save();

  // Helper: stroke the crosshair lines twice (shadow then foreground).
  function strokeCrosshair(color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = width;
    ctx.beginPath();
    ctx.moveTo(cx - arm, cy); ctx.lineTo(cx + arm, cy);
    ctx.moveTo(cx, cy - arm); ctx.lineTo(cx, cy + arm);
    ctx.stroke();
  }

  // Helper: stroke the circle twice (shadow then foreground).
  function strokeCircle(color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = width;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Shadow pass for contrast against any background.
  strokeCrosshair('rgba(0,0,0,0.55)', 3.5);
  strokeCircle('rgba(0,0,0,0.55)', 3.5);

  // Foreground pass.
  strokeCrosshair('rgba(255,255,255,0.92)', 1.8);
  strokeCircle('rgba(255,255,255,0.92)', 1.8);

  // Bright centre dot.
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#7EC8E3';
  ctx.fill();

  ctx.restore();
}

/** Reset the running mask counter (call when user clears/changes the image). */
function resetMaskCount() { _maskCount = 0; }

/** @returns {boolean} */
function isModelReady() { return _isModelReady; }

/** @returns {boolean} */
function isBusy() { return _isProcessing; }

// ── Node / Jest export hook (no-op in the browser) ────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeCoords,
    getMaskColor,
    buildSamInputs,
    parseHsla,
    hslToRgb,
    drawClickMarker,
  };
}
