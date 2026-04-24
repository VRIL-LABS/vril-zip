// VRIL-ZIP v2 Universal Transformer Pipeline
//
// The core v2 innovation. Analyzes input content, evaluates multiple
// candidate pipelines (each with different preprocessing stages and
// entropy backends), and picks the one producing the smallest output.
//
// Entropy backends: deflate-raw (fflate), brotli (node:zlib), gzip (fflate).
// Preprocessing stages: spiral, remap, rle, delta, bwt, mtf, rleZero.
//
// Candidate pipelines:
//   1. bare-deflate   — no preprocessing, deflate level 9
//   2. bare-brotli    — no preprocessing, brotli quality 11
//   3. bare-gzip      — no preprocessing, gzip level 9
//   4. v1-schauberger — the v1 pipeline (spiral + optional remap + optional rle + deflate)
//   5. bwt-mtf-rle-deflate — BWT + MTF + RLE0 + deflate
//   6. bwt-mtf-deflate     — BWT + MTF + deflate
//   7. delta-deflate       — delta + deflate
//   8. brotli-with-spiral  — spiral + brotli
//   9. Content-type specific pipelines selected by analyzeContent()
//
// Strategy: actually compress with each candidate, compare real sizes,
// pick the smallest. Falls back to STORED if all candidates bloat.

import * as fflate from "fflate";
import {
  brotliCompressSync,
  brotliDecompressSync,
  constants as zlibConstants,
} from "node:zlib";

const BROTLI_PARAM_QUALITY = zlibConstants.BROTLI_PARAM_QUALITY; // numeric constant (1)

import {
  buildCandidate,
  assemblePayload,
  decodeCandidate,
  schaubergerCompress,
  bwtEncode,
  hasSignificantRuns,
  FLAG_STORED,
  FLAG_RLE,
  FLAG_RLE_ZERO,
} from "./schauberger.js";
import { analyzeContent, type ContentAnalysis } from "./content-analyzer.js";

// Re-export ContentAnalysis for convenience
export type { ContentAnalysis };
export { analyzeContent } from "./content-analyzer.js";

// ─────────────────────────────────────────────────────────────
// Backend abstraction
// ─────────────────────────────────────────────────────────────

export type EntropyBackend = "deflate-raw" | "brotli" | "gzip";

export interface BackendCompress {
  (data: Uint8Array, level: number): Uint8Array;
}
export interface BackendDecompress {
  (data: Uint8Array): Uint8Array;
}

/** Deflate-raw backend via fflate */
function deflateRawCompress(data: Uint8Array, level: number): Uint8Array {
  return fflate.deflateSync(data, {
    level: Math.max(0, Math.min(9, level)) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
    raw: true,
  } as fflate.DeflateOptions);
}
function deflateRawDecompress(data: Uint8Array): Uint8Array {
  return fflate.inflateSync(data, { raw: true } as fflate.InflateOptions);
}

/** Brotli backend via node:zlib — fflate doesn't support brotli */
function brotliCompress(data: Uint8Array, level: number): Uint8Array {
  const q = Math.max(0, Math.min(11, level));
  return new Uint8Array(
    brotliCompressSync(data, { params: { [BROTLI_PARAM_QUALITY]: q } })
  );
}
function brotliDecompressFn(data: Uint8Array): Uint8Array {
  return new Uint8Array(brotliDecompressSync(data));
}

/** Gzip backend via fflate */
function gzipCompress(data: Uint8Array, level: number): Uint8Array {
  return fflate.gzipSync(data, {
    level: Math.max(0, Math.min(9, level)) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
  });
}
function gzipDecompress(data: Uint8Array): Uint8Array {
  return fflate.gunzipSync(data);
}

const BACKENDS: Record<
  EntropyBackend,
  { compress: BackendCompress; decompress: BackendDecompress }
> = {
  "deflate-raw": { compress: deflateRawCompress, decompress: deflateRawDecompress },
  brotli: { compress: brotliCompress, decompress: brotliDecompressFn },
  gzip: { compress: gzipCompress, decompress: gzipDecompress },
};

export function getBackend(name: EntropyBackend) {
  return BACKENDS[name];
}

// ─────────────────────────────────────────────────────────────
// Pipeline configuration
// ─────────────────────────────────────────────────────────────

export interface TransformConfig {
  spiral?: boolean;
  remap?: boolean;
  rle?: boolean;
  delta?: boolean;
  bwt?: boolean;
  mtf?: boolean;
  rleZero?: boolean;
}

export interface PipelineConfig {
  name: string;
  stages: string[];
  transforms: TransformConfig;
  backend: EntropyBackend;
  level: number;
}

interface EvalResult {
  pipeline: PipelineConfig;
  payload: Uint8Array;
  compressedSize: number;
  isStored: boolean;
}

// ─────────────────────────────────────────────────────────────
// Candidate pipeline generation
// ─────────────────────────────────────────────────────────────

/**
 * Build pipeline configurations appropriate for the detected content type.
 */
export function getCandidatePipelines(
  analysis: ContentAnalysis,
  requestedBackend: EntropyBackend | "auto",
  level: number
): PipelineConfig[] {
  const pipelines: PipelineConfig[] = [];
  const backends: EntropyBackend[] =
    requestedBackend === "auto"
      ? ["deflate-raw", "brotli", "gzip"]
      : [requestedBackend];

  const isCompressible =
    analysis.entropy < 7.0 || analysis.runFraction > 0.1 || analysis.periodicity > 0.3;
  const canBwt = analysis.size >= 64 && analysis.size <= 1024 * 1024; // BWT threshold: 64B – 1MB

  for (const backend of backends) {
    // Map level to backend-native quality
    let bLevel = level;
    if (backend === "brotli") {
      bLevel = Math.min(11, Math.round((level / 9) * 11));
    }

    // ── 1. Bare baselines (always included) ──
    pipelines.push({
      name: "bare-deflate",
      stages: [],
      transforms: {},
      backend: "deflate-raw",
      level,
    });
    if (backend === "brotli") {
      pipelines.push({
        name: "bare-brotli",
        stages: [],
        transforms: {},
        backend: "brotli",
        level: bLevel,
      });
    }
    if (backend === "gzip") {
      pipelines.push({
        name: "bare-gzip",
        stages: [],
        transforms: {},
        backend: "gzip",
        level: bLevel,
      });
    }

    // Skip preprocessing for incompressible data
    if (!isCompressible) continue;

    // ── 2. Content-type specific pipelines ──
    switch (analysis.type) {
      case "text":
      case "json":
      case "source-code":
      case "xml":
        // BWT + MTF — the classic bzip2 strategy, excellent for text
        if (canBwt) {
          pipelines.push({
            name: "bwt-mtf-deflate",
            stages: ["bwt", "mtf"],
            transforms: { bwt: true, mtf: true },
            backend: "deflate-raw",
            level,
          });
          pipelines.push({
            name: "bwt-mtf-rle-deflate",
            stages: ["bwt", "mtf", "rleZero"],
            transforms: { bwt: true, mtf: true, rleZero: true },
            backend: "deflate-raw",
            level,
          });
        }
        // Spiral + remap (v1 heuristic)
        pipelines.push({
          name: "spiral-remap-deflate",
          stages: ["spiral", "remap"],
          transforms: { spiral: true, remap: true },
          backend: "deflate-raw",
          level,
        });
        // RLE for repetitive text
        if (analysis.runFraction > 0.05) {
          pipelines.push({
            name: "remap-rle-deflate",
            stages: ["remap", "rle"],
            transforms: { remap: true, rle: true },
            backend: "deflate-raw",
            level,
          });
        }
        // Frequency remap
        if (analysis.uniqueBytes > 40) {
          pipelines.push({
            name: "remap-deflate",
            stages: ["remap"],
            transforms: { remap: true },
            backend: "deflate-raw",
            level,
          });
        }
        // Brotli with spiral
        if (backend === "brotli") {
          pipelines.push({
            name: "brotli-with-spiral",
            stages: ["spiral"],
            transforms: { spiral: true },
            backend: "brotli",
            level: bLevel,
          });
        }
        break;

      case "csv":
        // CSV: delta encoding for column-aligned numeric data
        pipelines.push({
          name: "delta-deflate",
          stages: ["delta"],
          transforms: { delta: true },
          backend: "deflate-raw",
          level,
        });
        if (canBwt) {
          pipelines.push({
            name: "bwt-mtf-deflate",
            stages: ["bwt", "mtf"],
            transforms: { bwt: true, mtf: true },
            backend: "deflate-raw",
            level,
          });
        }
        break;

      case "structured":
        // Structured: delta + optional BWT/MTF
        if (analysis.periodicity > 0.2) {
          pipelines.push({
            name: "delta-deflate",
            stages: ["delta"],
            transforms: { delta: true },
            backend: "deflate-raw",
            level,
          });
          if (canBwt) {
            pipelines.push({
              name: "delta-bwt-mtf-deflate",
              stages: ["delta", "bwt", "mtf"],
              transforms: { delta: true, bwt: true, mtf: true },
              backend: "deflate-raw",
              level,
            });
          }
        }
        break;

      case "image":
        // Images: delta for neighboring pixels, zero-RLE for padded data
        pipelines.push({
          name: "delta-deflate",
          stages: ["delta"],
          transforms: { delta: true },
          backend: "deflate-raw",
          level,
        });
        if (analysis.runFraction > 0.03) {
          pipelines.push({
            name: "zero-rle-deflate",
            stages: ["rleZero"],
            transforms: { rleZero: true },
            backend: "deflate-raw",
            level,
          });
        }
        break;

      case "audio":
        // Audio: delta for sample-to-sample similarity
        pipelines.push({
          name: "delta-deflate",
          stages: ["delta"],
          transforms: { delta: true },
          backend: "deflate-raw",
          level,
        });
        break;

      case "binary":
        // Binary: try general-purpose pipelines
        if (analysis.uniqueBytes > 40) {
          pipelines.push({
            name: "remap-deflate",
            stages: ["remap"],
            transforms: { remap: true },
            backend: "deflate-raw",
            level,
          });
        }
        if (analysis.runFraction > 0.05) {
          pipelines.push({
            name: "rle-deflate",
            stages: ["rle"],
            transforms: { rle: true },
            backend: "deflate-raw",
            level,
          });
        }
        if (analysis.periodicity > 0.2) {
          pipelines.push({
            name: "delta-deflate",
            stages: ["delta"],
            transforms: { delta: true },
            backend: "deflate-raw",
            level,
          });
        }
        break;

      case "archive":
      case "random":
        // Already compressed or random — just bare backends (already added)
        break;
    }

    // ── 3. Comprehensive pipelines (medium data only) ──
    if (isCompressible && canBwt && analysis.type !== "random" && analysis.type !== "archive") {
      // delta + BWT + MTF
      pipelines.push({
        name: "delta-bwt-mtf-deflate",
        stages: ["delta", "bwt", "mtf"],
        transforms: { delta: true, bwt: true, mtf: true },
        backend: "deflate-raw",
        level,
      });
    }
  }

  // Deduplicate by name
  const seen = new Set<string>();
  return pipelines.filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────
// Candidate evaluation
// ─────────────────────────────────────────────────────────────

/**
 * Evaluate a single pipeline candidate.
 */
function evaluateCandidate(
  data: Uint8Array,
  pipeline: PipelineConfig
): EvalResult {
  const { compress } = getBackend(pipeline.backend);
  const candidate = buildCandidate(data, pipeline.transforms, (d) =>
    compress(d, pipeline.level)
  );

  // Check if STORED would be better
  if (candidate.body.length >= data.length) {
    const payload = new Uint8Array(1 + data.length);
    payload[0] = FLAG_STORED;
    payload.set(data, 1);
    return {
      pipeline,
      payload,
      compressedSize: data.length + 1,
      isStored: true,
    };
  }

  const payload = assemblePayload(candidate);
  return {
    pipeline,
    payload,
    compressedSize: candidate.body.length + 1 + (candidate.bwtIndex !== undefined ? 4 : 0),
    isStored: false,
  };
}

/**
 * Evaluate all pipeline candidates and return the best one.
 */
export function evaluatePipelines(
  data: Uint8Array,
  analysis: ContentAnalysis,
  requestedBackend: EntropyBackend | "auto",
  level: number
): EvalResult {
  const candidates = getCandidatePipelines(analysis, requestedBackend, level);

  // ── Include v1 Schauberger pipeline as a candidate ──
  if (requestedBackend === "auto" || requestedBackend === "deflate-raw") {
    candidates.push({
      name: "v1-schauberger",
      stages: ["spiral?", "remap?", "rle?"],
      transforms: {} as any, // v1 handles its own transforms
      backend: "deflate-raw",
      level,
    });
  }

  // ── Evaluate all candidates ──
  let bestResult: EvalResult | null = null;

  for (const pipeline of candidates) {
    let result: EvalResult;

    // Special handling for v1 Schauberger (it manages its own transforms)
    if (pipeline.name === "v1-schauberger") {
      const { compress } = getBackend("deflate-raw");
      const schaubergerPayload = schaubergerCompress(data, {
        level,
        deflate: compress,
      });
      result = {
        pipeline,
        payload: schaubergerPayload,
        compressedSize: schaubergerPayload.length,
        isStored: (schaubergerPayload[0] & FLAG_STORED) !== 0,
      };
    } else {
      result = evaluateCandidate(data, pipeline);
    }

    if (!bestResult || result.compressedSize < bestResult.compressedSize) {
      bestResult = result;
    }
  }

  // ── STORED fallback: never worse than raw + 1 byte flags ──
  const storedSize = data.length + 1;
  if (!bestResult || bestResult.compressedSize >= data.length) {
    const payload = new Uint8Array(1 + data.length);
    payload[0] = FLAG_STORED;
    payload.set(data, 1);
    return {
      pipeline: { name: "stored", stages: [], transforms: {}, backend: "deflate-raw", level: 0 },
      payload,
      compressedSize: storedSize,
      isStored: true,
    };
  }

  return bestResult!;
}

// ─────────────────────────────────────────────────────────────
// Main compress / decompress entry points
// ─────────────────────────────────────────────────────────────

/**
 * Main compression entry point for the Universal Transformer.
 * Analyzes content, evaluates candidates, returns compressed payload + metadata.
 */
export function transformCompress(
  data: Uint8Array,
  analysis: ContentAnalysis
): { flags: number; body: Uint8Array } {
  const result = evaluatePipelines(data, analysis, "auto", 9);

  // Return the payload (which starts with flags byte)
  return {
    flags: result.payload[0],
    body: result.payload.subarray(1),
  };
}

/**
 * Full compression entry point with all metadata.
 */
export function transformerCompress(
  data: Uint8Array,
  opts: {
    backend?: EntropyBackend | "auto";
    level?: number;
  } = {}
): { payload: Uint8Array; backend: EntropyBackend; analysis: ContentAnalysis } {
  const level = opts.level ?? 9;
  const backend = opts.backend ?? "auto";
  const analysis = analyzeContent(data);

  const result = evaluatePipelines(data, analysis, backend, level);

  return {
    payload: result.payload,
    backend: result.isStored ? "deflate-raw" : result.pipeline.backend,
    analysis,
  };
}

/**
 * Main decompression entry point for the Universal Transformer.
 * Reads the payload flags and reverses all applied transforms.
 */
export function transformDecompress(
  payload: Uint8Array
): Uint8Array {
  // We need the backend to decompress. Default to deflate-raw
  // (the container stores the actual backend; this function is for
  // cases where the caller knows the backend separately).
  return decodeCandidate(payload, deflateRawDecompress);
}

/**
 * Decompress with a specific backend.
 */
export function transformerDecompress(
  payload: Uint8Array,
  backend: EntropyBackend
): Uint8Array {
  const { decompress } = getBackend(backend);
  return decodeCandidate(payload, decompress);
}

// ─────────────────────────────────────────────────────────────
// Exported for testing
// ─────────────────────────────────────────────────────────────

export const __test = {
  analyzeContent,
  getCandidatePipelines,
  evaluatePipelines,
  BACKENDS,
};
