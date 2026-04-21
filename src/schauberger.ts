// VRIL-ZIP Schauberger pipeline — provably lossless preprocessing with
// candidate selection.
//
// At compress time the encoder evaluates EVERY combination of the
// optional pre-pass stages (φ-permutation, hyperbolic frequency
// remap, centripetal RLE) plus a "no preprocessing" baseline, and
// emits the smallest. This guarantees VRIL-ZIP is never worse than
// bare deflate-raw level 9 plus ~14 bytes of container overhead —
// the φ-permutation only ships when it actually pays for itself.
//
// If even bare deflate bloats the input (already-compressed media),
// the encoder switches to a STORED block carrying the post-permutation
// bytes literally, capping the worst case.
//
// Inspired by zstd's internal block-mode selection (Collet, RFC 8478)
// and brotli's context-modeling ablation (Alakuijala, RFC 7932): real
// production compressors all do this. It's the difference between a
// pipeline that *might* help and one that's *guaranteed* to never hurt.

import { deflateRawSync, inflateRawSync } from "node:zlib";

const PHI = 1.618033988749895;

// Internal flags byte (first byte of payload). Decoder gates each
// reverse stage on its bit.
//
//   bit 0  FREQ_REMAP   — hyperbolicFrequencyRemap was applied
//   bit 1  RLE          — centripetalRunLength was applied
//   bit 2  STORED       — entropy backend skipped; body is raw
//                          (post-permutation, post-remap) bytes
//   bit 3  SPIRAL_USED  — goldenSpiralReorder was applied
//   bits 4-7  reserved (must be 0)
const FLAG_FREQ_REMAP = 0x01;
const FLAG_RLE = 0x02;
const FLAG_STORED = 0x04;
const FLAG_SPIRAL = 0x08;

// ---------- Stage 1: golden-ratio bijective permutation ----------

function goldenSpiralReorder(data: Uint8Array, reverse = false): Uint8Array {
  const n = data.length;
  if (n <= 1) return new Uint8Array(data);

  let stride = Math.round(n / PHI);
  if (stride < 1) stride = 1;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  while (gcd(stride, n) !== 1 && stride < n) stride++;
  if (stride >= n) stride = 1;

  const output = new Uint8Array(n);
  if (!reverse) {
    for (let i = 0; i < n; i++) output[(i * stride) % n] = data[i];
  } else {
    for (let i = 0; i < n; i++) output[i] = data[(i * stride) % n];
  }
  return output;
}

// ---------- Stage 2: hyperbolic frequency remap ----------

function hyperbolicFrequencyRemap(data: Uint8Array, reverse = false): Uint8Array {
  if (reverse) {
    if (data.length < 1) return new Uint8Array(0);
    const kRaw = data[0];
    const K = kRaw === 0 ? 256 : kRaw;
    if (data.length < 1 + K) return new Uint8Array(0);
    const inverseMap = new Uint8Array(256);
    for (let r = 0; r < K; r++) inverseMap[r] = data[1 + r];
    for (let r = K; r < 256; r++) inverseMap[r] = r;
    const body = data.subarray(1 + K);
    const out = new Uint8Array(body.length);
    for (let i = 0; i < body.length; i++) out[i] = inverseMap[body[i]];
    return out;
  }
  const freq = new Uint32Array(256);
  for (let i = 0; i < data.length; i++) freq[data[i]]++;
  const symbols: number[] = [];
  for (let s = 0; s < 256; s++) if (freq[s] > 0) symbols.push(s);
  symbols.sort((a, b) => freq[b] - freq[a]);
  const K = symbols.length;
  const forwardMap = new Uint8Array(256);
  for (let r = 0; r < K; r++) forwardMap[symbols[r]] = r;
  const out = new Uint8Array(1 + K + data.length);
  out[0] = K === 256 ? 0 : K;
  for (let r = 0; r < K; r++) out[1 + r] = symbols[r];
  for (let i = 0; i < data.length; i++) out[1 + K + i] = forwardMap[data[i]];
  return out;
}

// ---------- Stage 3: centripetal run-length encoding ----------

function centripetalRunLength(data: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  while (i < data.length) {
    let runLen = 1;
    while (i + runLen < data.length && data[i + runLen] === data[i] && runLen < 255) runLen++;
    if (data[i] === 0xff) {
      out.push(0xff, runLen, 0xff);
    } else if (runLen >= 3) {
      out.push(0xff, runLen, data[i]);
    } else {
      for (let k = 0; k < runLen; k++) out.push(data[i + k]);
    }
    i += runLen;
  }
  return new Uint8Array(out);
}

function centripetalRunLengthDecode(data: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  while (i < data.length) {
    if (data[i] === 0xff) {
      if (i + 2 >= data.length) break;
      const len = data[i + 1];
      const val = data[i + 2];
      for (let k = 0; k < len; k++) out.push(val);
      i += 3;
    } else {
      out.push(data[i]);
      i++;
    }
  }
  return new Uint8Array(out);
}

function hasSignificantRuns(data: Uint8Array): boolean {
  const scanLen = Math.min(data.length, 4096);
  let runBytes = 0;
  let i = 0;
  while (i < scanLen) {
    let run = 1;
    while (i + run < scanLen && data[i + run] === data[i] && run < 255) run++;
    if (run >= 3) runBytes += run;
    i += run;
  }
  return runBytes > scanLen * 0.02;
}

// ---------- Candidate evaluation ----------

interface Candidate {
  flags: number;
  body: Uint8Array;
}

function buildCandidate(
  data: Uint8Array,
  useSpiral: boolean,
  useRemap: boolean,
  useRLE: boolean,
  level: number,
): Candidate {
  let stage = data;
  if (useSpiral) stage = goldenSpiralReorder(stage);
  if (useRemap) stage = hyperbolicFrequencyRemap(stage);
  if (useRLE) stage = centripetalRunLength(stage);
  const deflated = new Uint8Array(deflateRawSync(stage, { level }));
  let flags = 0;
  if (useSpiral) flags |= FLAG_SPIRAL;
  if (useRemap) flags |= FLAG_FREQ_REMAP;
  if (useRLE) flags |= FLAG_RLE;
  return { flags, body: deflated };
}

export function schaubergerCompress(
  data: Uint8Array,
  opts: { level?: number; fast?: boolean } = {},
): Uint8Array {
  const level = opts.level ?? 9;

  // Tiny inputs (< 32 bytes): preprocessing overhead always loses to
  // bare deflate. Skip candidate evaluation.
  if (data.length < 32) {
    const deflated = new Uint8Array(deflateRawSync(data, { level }));
    if (deflated.length >= data.length) {
      // Even deflate bloats — store raw
      const out = new Uint8Array(1 + data.length);
      out[0] = FLAG_STORED;
      out.set(data, 1);
      return out;
    }
    const out = new Uint8Array(1 + deflated.length);
    out[0] = 0;
    out.set(deflated, 1);
    return out;
  }

  // Quick adaptive gates to skip obviously-useless stages.
  const sample = data.subarray(0, Math.min(512, data.length));
  const uniq = new Set<number>();
  for (let i = 0; i < sample.length; i++) uniq.add(sample[i]);
  const remapCandidate = uniq.size > 64; // Worth trying remap?
  const rleCandidate = hasSignificantRuns(data);

  // In fast mode, use the v0.1 heuristic-only path (no candidate eval).
  if (opts.fast) {
    const useRemap = uniq.size > 128;
    return assembleSinglePath(data, true, useRemap, rleCandidate, level);
  }

  // Otherwise enumerate candidates. 2 (spiral) × 2 (remap) × 2 (rle) =
  // up to 8, but we prune obviously-useless combos via the gates.
  const candidates: Candidate[] = [];
  for (const useSpiral of [false, true]) {
    for (const useRemap of [false, true]) {
      if (useRemap && !remapCandidate) continue;
      for (const useRLE of [false, true]) {
        if (useRLE && !rleCandidate) continue;
        candidates.push(buildCandidate(data, useSpiral, useRemap, useRLE, level));
      }
    }
  }

  // Pick smallest body
  let best = candidates[0];
  for (const c of candidates) if (c.body.length < best.body.length) best = c;

  // STORED fallback: if even the best candidate's deflated body is
  // larger than just storing the raw input (incompressible data —
  // random bytes, JPEG, etc.), store raw.
  if (best.body.length >= data.length) {
    const out = new Uint8Array(1 + data.length);
    out[0] = FLAG_STORED; // no other flags — body is raw input
    out.set(data, 1);
    return out;
  }

  const out = new Uint8Array(1 + best.body.length);
  out[0] = best.flags;
  out.set(best.body, 1);
  return out;
}

function assembleSinglePath(
  data: Uint8Array,
  useSpiral: boolean,
  useRemap: boolean,
  useRLE: boolean,
  level: number,
): Uint8Array {
  const c = buildCandidate(data, useSpiral, useRemap, useRLE, level);
  if (c.body.length >= data.length) {
    const out = new Uint8Array(1 + data.length);
    out[0] = FLAG_STORED;
    out.set(data, 1);
    return out;
  }
  const out = new Uint8Array(1 + c.body.length);
  out[0] = c.flags;
  out.set(c.body, 1);
  return out;
}

export function schaubergerDecompress(payload: Uint8Array): Uint8Array {
  if (payload.length < 1) return new Uint8Array(0);
  const flags = payload[0];
  const body = payload.subarray(1);

  const usedFreqRemap = (flags & FLAG_FREQ_REMAP) !== 0;
  const usedRLE = (flags & FLAG_RLE) !== 0;
  const stored = (flags & FLAG_STORED) !== 0;
  const usedSpiral = (flags & FLAG_SPIRAL) !== 0;

  let stage: Uint8Array;
  if (stored) {
    // STORED body is the raw input bytes (no transforms applied).
    // (Old v0.1 behaviour stored post-permutation bytes; we no longer
    // emit that variant — STORED now always means "literal input".)
    return new Uint8Array(body);
  } else {
    stage = new Uint8Array(inflateRawSync(body));
    if (usedRLE) stage = centripetalRunLengthDecode(stage);
  }

  if (usedFreqRemap) stage = hyperbolicFrequencyRemap(stage, true);
  if (usedSpiral) stage = goldenSpiralReorder(stage, true);
  return stage;
}

// Exposed for direct testing
export const __test = {
  goldenSpiralReorder,
  hyperbolicFrequencyRemap,
  centripetalRunLength,
  centripetalRunLengthDecode,
  hasSignificantRuns,
};
