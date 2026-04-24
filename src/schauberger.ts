// VRIL-ZIP v2 Schauberger Pipeline
//
// Enhanced from v1 with additional preprocessing transforms:
//   - BWT (Burrows-Wheeler Transform)
//   - MTF (Move-to-Front Transform)
//   - Delta encoding
//   - Zero-run-length encoding (RLE0)
//
// Original v1 stages preserved:
//   - goldenSpiralReorder — φ-permutation
//   - hyperbolicFrequencyRemap — adaptive byte-frequency sorting
//   - centripetalRunLength — RLE for runs ≥ 3
//
// All transforms are provably lossless and independently invertible.

// ─────────────────────────────────────────────────────────────
// v1 Stage 1: Golden-ratio bijective permutation
// ─────────────────────────────────────────────────────────────

const PHI = 1.618033988749895;

export function goldenSpiralReorder(
  data: Uint8Array,
  reverse = false
): Uint8Array {
  const n = data.length;
  if (n <= 1) return new Uint8Array(data);

  let stride = Math.round(n / PHI);
  if (stride < 1) stride = 1;
  const gcd = (a: number, b: number): number =>
    b === 0 ? a : gcd(b, a % b);
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

// ─────────────────────────────────────────────────────────────
// v1 Stage 2: Hyperbolic frequency remap
// ─────────────────────────────────────────────────────────────

export function hyperbolicFrequencyRemap(
  data: Uint8Array,
  reverse = false
): Uint8Array {
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

// ─────────────────────────────────────────────────────────────
// v1 Stage 3: Centripetal run-length encoding
// ─────────────────────────────────────────────────────────────

export function centripetalRunLength(data: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  while (i < data.length) {
    let runLen = 1;
    while (
      i + runLen < data.length &&
      data[i + runLen] === data[i] &&
      runLen < 255
    )
      runLen++;
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

export function centripetalRunLengthDecode(data: Uint8Array): Uint8Array {
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

export function hasSignificantRuns(data: Uint8Array): boolean {
  const scanLen = Math.min(data.length, 4096);
  let runBytes = 0;
  let i = 0;
  while (i < scanLen) {
    let run = 1;
    while (i + run < scanLen && data[i + run] === data[i] && run < 255)
      run++;
    if (run >= 3) runBytes += run;
    i += run;
  }
  return runBytes > scanLen * 0.02;
}

// ─────────────────────────────────────────────────────────────
// v2 Stage 4: Burrows-Wheeler Transform
// ─────────────────────────────────────────────────────────────

/**
 * BWT encode using suffix array approach (O(n log²n) via sort).
 *
 * Returns the BWT output and the primary index.
 */
export function bwtEncode(
  data: Uint8Array
): { bwt: Uint8Array; index: number } {
  const n = data.length;
  if (n === 0) return { bwt: new Uint8Array(0), index: 0 };
  if (n === 1) return { bwt: new Uint8Array(data), index: 0 };

  // Build suffix array indices and sort by rotation comparison
  const indices = new Uint32Array(n);
  for (let i = 0; i < n; i++) indices[i] = i;

  // Use built-in sort — O(n log²n) average for byte-string rotations.
  // For production on large inputs, a SA-IS linear-time suffix array would
  // be preferable, but this is correct and sufficient for our purposes.
  indices.sort((a, b) => {
    for (let k = 0; k < n; k++) {
      const da = data[(a + k) % n];
      const db = data[(b + k) % n];
      if (da !== db) return da - db;
    }
    return 0;
  });

  // Find primary index (where original string position 0 appears in sorted order)
  let primaryIndex = 0;
  for (let i = 0; i < n; i++) {
    if (indices[i] === 0) {
      primaryIndex = i;
      break;
    }
  }

  // Extract last column of the sorted rotation matrix
  const bwt = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    bwt[i] = data[(indices[i] + n - 1) % n];
  }

  return { bwt, index: primaryIndex };
}

/**
 * BWT decode using inverse LF-mapping.
 * Given BWT output and primary index, reconstruct original data.
 */
export function bwtDecode(bwt: Uint8Array, index: number): Uint8Array {
  const n = bwt.length;
  if (n === 0) return new Uint8Array(0);
  if (n === 1) return new Uint8Array(bwt);

  // Count occurrences of each byte in BWT
  const count = new Uint32Array(256);
  for (let i = 0; i < n; i++) count[bwt[i]]++;

  // Compute starting positions in the first column (F) via cumulative sums
  const cumul = new Uint32Array(256);
  let sum = 0;
  for (let c = 0; c < 256; c++) {
    cumul[c] = sum;
    sum += count[c];
  }

  // Build LF-mapping: T[i] maps from position i in L column to position in F column
  const cumulCopy = new Uint32Array(cumul);
  const T = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    T[i] = cumulCopy[bwt[i]]++;
  }

  // Reconstruct original string by following the chain from index
  const out = new Uint8Array(n);
  let j = index;
  for (let i = n - 1; i >= 0; i--) {
    out[i] = bwt[j];
    j = T[j];
  }

  return out;
}

// ─────────────────────────────────────────────────────────────
// v2 Stage 5: Move-to-Front Transform
// ─────────────────────────────────────────────────────────────

/**
 * MTF encode: maintains a byte list, outputs the position of each byte.
 * Recently-used bytes map to small values, producing output biased toward
 * small integers — ideal for entropy coding.
 */
export function mtfEncode(data: Uint8Array): Uint8Array {
  const list = new Uint8Array(256);
  for (let i = 0; i < 256; i++) list[i] = i;

  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const sym = data[i];
    let pos = 0;
    while (list[pos] !== sym) pos++;
    out[i] = pos;
    // Move to front
    if (pos > 0) {
      const tmp = list[pos];
      for (let j = pos; j > 0; j--) list[j] = list[j - 1];
      list[0] = tmp;
    }
  }
  return out;
}

/**
 * MTF decode: inverse of mtfEncode.
 */
export function mtfDecode(data: Uint8Array): Uint8Array {
  const list = new Uint8Array(256);
  for (let i = 0; i < 256; i++) list[i] = i;

  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const pos = data[i];
    const sym = list[pos];
    out[i] = sym;
    if (pos > 0) {
      for (let j = pos; j > 0; j--) list[j] = list[j - 1];
      list[0] = sym;
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// v2 Stage 6: Delta encoding
// ─────────────────────────────────────────────────────────────

/**
 * Delta encode: stores the first byte, then differences between consecutive bytes.
 * Excellent for structured data with slowly-changing values (audio samples,
 * sensor data, sorted tables, etc.).
 */
export function deltaEncode(data: Uint8Array): Uint8Array {
  if (data.length === 0) return new Uint8Array(0);
  const out = new Uint8Array(data.length);
  out[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    out[i] = (data[i] - data[i - 1]) & 0xff;
  }
  return out;
}

/**
 * Delta decode: inverse of deltaEncode.
 */
export function deltaDecode(data: Uint8Array): Uint8Array {
  if (data.length === 0) return new Uint8Array(0);
  const out = new Uint8Array(data.length);
  out[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    out[i] = (out[i - 1] + data[i]) & 0xff;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// v2 Stage 7: Zero-run-length encoding (RLE0)
// ─────────────────────────────────────────────────────────────

/**
 * Zero-run-length encoding focused on compressing runs of zero bytes.
 *
 * Scheme:
 *   0xFF 0x00 <len>  — run of (len + 3) zeros, where len = 0..252
 *   0xFF 0x01        — literal 0xFF byte
 *   All other bytes (0x00..0xFE) — stored verbatim
 *
 * Runs of 1-2 zeros are stored verbatim (cheaper than 3-byte marker).
 */
export function rleZeroEncode(data: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  while (i < data.length) {
    if (data[i] === 0) {
      let run = 1;
      while (i + run < data.length && data[i + run] === 0 && run < 255)
        run++;
      if (run >= 3) {
        // Emit zero-run marker: 0xFF 0x00 (run - 3)
        out.push(0xff, 0x00, run - 3);
        i += run;
      } else {
        // 1 or 2 zeros — store verbatim (cheaper than 3-byte marker)
        for (let k = 0; k < run; k++) out.push(0x00);
        i += run;
      }
    } else if (data[i] === 0xff) {
      // Escape literal 0xFF
      out.push(0xff, 0x01);
      i++;
    } else {
      out.push(data[i]);
      i++;
    }
  }
  return new Uint8Array(out);
}

/**
 * Zero-run-length decoding: inverse of rleZeroEncode.
 */
export function rleZeroDecode(data: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  while (i < data.length) {
    if (data[i] === 0xff) {
      if (i + 1 >= data.length) break; // truncated escape
      if (data[i + 1] === 0x00) {
        // Zero run
        if (i + 2 >= data.length) break; // truncated length
        const run = data[i + 2] + 3;
        for (let k = 0; k < run; k++) out.push(0);
        i += 3;
      } else if (data[i + 1] === 0x01) {
        // Literal 0xFF
        out.push(0xff);
        i += 2;
      } else {
        // Unknown escape sequence — treat as literal 0xFF (defensive)
        out.push(0xff);
        i++;
      }
    } else {
      out.push(data[i]);
      i++;
    }
  }
  return new Uint8Array(out);
}

// ─────────────────────────────────────────────────────────────
// v1 Candidate evaluation (preserved and generalized for v2)
// ─────────────────────────────────────────────────────────────

// Payload flags byte bits:
//   bit 0  FREQ_REMAP — hyperbolicFrequencyRemap was applied
//   bit 1  RLE        — centripetalRunLength was applied
//   bit 2  STORED     — entropy backend skipped; body is raw
//   bit 3  SPIRAL     — goldenSpiralReorder was applied
//   bit 4  BWT        — Burrows-Wheeler Transform was applied
//   bit 5  MTF        — Move-to-Front Transform was applied
//   bit 6  DELTA      — Delta encoding was applied
//   bit 7  RLE_ZERO   — Zero-run-length encoding was applied
export const FLAG_FREQ_REMAP = 0x01;
export const FLAG_RLE = 0x02;
export const FLAG_STORED = 0x04;
export const FLAG_SPIRAL = 0x08;
export const FLAG_BWT = 0x10;
export const FLAG_MTF = 0x20;
export const FLAG_DELTA = 0x40;
export const FLAG_RLE_ZERO = 0x80;

interface Candidate {
  flags: number;
  body: Uint8Array;
  bwtIndex?: number;
}

/**
 * Build a compression candidate by applying a sequence of transforms
 * and then compressing with the given backend.
 */
export function buildCandidate(
  data: Uint8Array,
  transforms: {
    spiral?: boolean;
    remap?: boolean;
    rle?: boolean;
    delta?: boolean;
    bwt?: boolean;
    mtf?: boolean;
    rleZero?: boolean;
  },
  backend: (data: Uint8Array) => Uint8Array
): Candidate {
  let stage = data;
  let flags = 0;
  let bwtIndex: number | undefined;

  // Apply transforms in forward order
  if (transforms.spiral) {
    stage = goldenSpiralReorder(stage);
    flags |= FLAG_SPIRAL;
  }
  if (transforms.remap) {
    stage = hyperbolicFrequencyRemap(stage);
    flags |= FLAG_FREQ_REMAP;
  }
  if (transforms.rle) {
    stage = centripetalRunLength(stage);
    flags |= FLAG_RLE;
  }
  if (transforms.delta) {
    stage = deltaEncode(stage);
    flags |= FLAG_DELTA;
  }
  if (transforms.bwt) {
    const result = bwtEncode(stage);
    stage = result.bwt;
    bwtIndex = result.index;
    flags |= FLAG_BWT;
  }
  if (transforms.mtf) {
    stage = mtfEncode(stage);
    flags |= FLAG_MTF;
  }
  if (transforms.rleZero) {
    stage = rleZeroEncode(stage);
    flags |= FLAG_RLE_ZERO;
  }

  const body = backend(stage);
  return { flags, body, bwtIndex };
}

/**
 * Decode a candidate payload back to original data.
 *
 * @param payload  The raw payload bytes (flags byte + optional BWT index + compressed/stored body)
 * @param inflate  Backend decompression function
 */
export function decodeCandidate(
  payload: Uint8Array,
  inflate: (data: Uint8Array) => Uint8Array
): Uint8Array {
  if (payload.length < 1) return new Uint8Array(0);
  const flags = payload[0];
  let offset = 1;

  const hasBwt = (flags & FLAG_BWT) !== 0;
  let bwtIndex = 0;
  if (hasBwt) {
    if (offset + 4 > payload.length) throw new Error("Truncated BWT index");
    bwtIndex =
      payload[offset] |
      (payload[offset + 1] << 8) |
      (payload[offset + 2] << 16) |
      (payload[offset + 3] << 24);
    offset += 4;
  }

  const body = payload.subarray(offset);
  const stored = (flags & FLAG_STORED) !== 0;

  let stage: Uint8Array;
  if (stored) {
    stage = body;
  } else {
    stage = inflate(body);
  }

  // Reverse transforms in reverse order
  if (flags & FLAG_RLE_ZERO) stage = rleZeroDecode(stage);
  if (flags & FLAG_MTF) stage = mtfDecode(stage);
  if (hasBwt) stage = bwtDecode(stage, bwtIndex);
  if (flags & FLAG_DELTA) stage = deltaDecode(stage);
  if (flags & FLAG_RLE) stage = centripetalRunLengthDecode(stage);
  if (flags & FLAG_FREQ_REMAP) stage = hyperbolicFrequencyRemap(stage, true);
  if (flags & FLAG_SPIRAL) stage = goldenSpiralReorder(stage, true);

  return stage;
}

/**
 * Assemble a payload from a candidate result.
 * Format: [flags byte] [optional 4-byte BWT index LE] [body bytes]
 */
export function assemblePayload(candidate: Candidate): Uint8Array {
  const bwtIndexSize = candidate.bwtIndex !== undefined ? 4 : 0;
  const total = 1 + bwtIndexSize + candidate.body.length;
  const out = new Uint8Array(total);
  out[0] = candidate.flags;
  if (candidate.bwtIndex !== undefined) {
    out[1] = candidate.bwtIndex & 0xff;
    out[2] = (candidate.bwtIndex >> 8) & 0xff;
    out[3] = (candidate.bwtIndex >> 16) & 0xff;
    out[4] = (candidate.bwtIndex >> 24) & 0xff;
  }
  out.set(candidate.body, 1 + bwtIndexSize);
  return out;
}

// ─────────────────────────────────────────────────────────────
// v1 Schauberger compress/decompress (backward-compatible API)
// ─────────────────────────────────────────────────────────────

function buildV1Candidate(
  data: Uint8Array,
  useSpiral: boolean,
  useRemap: boolean,
  useRLE: boolean,
  deflate: (data: Uint8Array, level: number) => Uint8Array,
  level: number
): Candidate {
  let stage = data;
  let flags = 0;
  if (useSpiral) {
    stage = goldenSpiralReorder(stage);
    flags |= FLAG_SPIRAL;
  }
  if (useRemap) {
    stage = hyperbolicFrequencyRemap(stage);
    flags |= FLAG_FREQ_REMAP;
  }
  if (useRLE) {
    stage = centripetalRunLength(stage);
    flags |= FLAG_RLE;
  }
  const deflated = deflate(stage, level);
  return { flags, body: deflated };
}

/**
 * v1 Schauberger compress with pluggable backend.
 */
export function schaubergerCompress(
  data: Uint8Array,
  opts: {
    level?: number;
    fast?: boolean;
    deflate: (data: Uint8Array, level: number) => Uint8Array;
  }
): Uint8Array {
  const level = opts.level ?? 9;
  const deflate = opts.deflate;

  // Tiny inputs: preprocessing overhead always loses
  if (data.length < 32) {
    const deflated = deflate(data, level);
    if (deflated.length >= data.length) {
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

  // Quick adaptive gates
  const sample = data.subarray(0, Math.min(512, data.length));
  const uniq = new Set<number>();
  for (let i = 0; i < sample.length; i++) uniq.add(sample[i]);
  const remapCandidate = uniq.size > 64;
  const rleCandidate = hasSignificantRuns(data);

  if (opts.fast) {
    const useRemap = uniq.size > 128;
    const c = buildV1Candidate(
      data,
      true,
      useRemap,
      rleCandidate,
      deflate,
      level
    );
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

  // Enumerate all candidate combinations
  const candidates: Candidate[] = [];
  for (const useSpiral of [false, true]) {
    for (const useRemap of [false, true]) {
      if (useRemap && !remapCandidate) continue;
      for (const useRLE of [false, true]) {
        if (useRLE && !rleCandidate) continue;
        candidates.push(
          buildV1Candidate(
            data,
            useSpiral,
            useRemap,
            useRLE,
            deflate,
            level
          )
        );
      }
    }
  }

  // Pick smallest body
  let best = candidates[0];
  for (const c of candidates) if (c.body.length < best.body.length) best = c;

  // STORED fallback: never worse than raw
  if (best.body.length >= data.length) {
    const out = new Uint8Array(1 + data.length);
    out[0] = FLAG_STORED;
    out.set(data, 1);
    return out;
  }

  const out = new Uint8Array(1 + best.body.length);
  out[0] = best.flags;
  out.set(best.body, 1);
  return out;
}

/**
 * v1 Schauberger decompress with pluggable backend.
 */
export function schaubergerDecompress(
  payload: Uint8Array,
  inflate: (data: Uint8Array) => Uint8Array
): Uint8Array {
  if (payload.length < 1) return new Uint8Array(0);
  const flags = payload[0];
  const body = payload.subarray(1);

  const usedFreqRemap = (flags & FLAG_FREQ_REMAP) !== 0;
  const usedRLE = (flags & FLAG_RLE) !== 0;
  const stored = (flags & FLAG_STORED) !== 0;
  const usedSpiral = (flags & FLAG_SPIRAL) !== 0;

  let stage: Uint8Array;
  if (stored) {
    return new Uint8Array(body);
  } else {
    stage = inflate(body);
    if (usedRLE) stage = centripetalRunLengthDecode(stage);
  }

  if (usedFreqRemap) stage = hyperbolicFrequencyRemap(stage, true);
  if (usedSpiral) stage = goldenSpiralReorder(stage, true);
  return stage;
}

// ─────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────

export const __test = {
  goldenSpiralReorder,
  hyperbolicFrequencyRemap,
  centripetalRunLength,
  centripetalRunLengthDecode,
  hasSignificantRuns,
  bwtEncode,
  bwtDecode,
  mtfEncode,
  mtfDecode,
  deltaEncode,
  deltaDecode,
  rleZeroEncode,
  rleZeroDecode,
  buildCandidate,
  decodeCandidate,
  assemblePayload,
};
