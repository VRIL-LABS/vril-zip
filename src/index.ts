// VRIL-ZIP v2 — Universal Transformer Edition
//
// Provably lossless compression with content-aware preprocessing,
// multi-backend support (deflate-raw, brotli, gzip), and the
// enhanced Schauberger preprocessing pipeline.
//
// Quick start:
//
//   import { compress, decompress } from "vril-zip-v2";
//   const buf = new TextEncoder().encode("hello world");
//   const packed = compress(buf);
//   const back = decompress(packed);
//   // back deeply equals buf
//
// The container is self-describing — decoder needs only the compressed
// bytes (plus the same auth key when authenticated mode was used).

// Container (pack/unpack)
import {
  pack,
  unpack,
  inspectContainer,
  MAGIC_BYTES,
  CONTAINER_VERSION,
} from "./container.js";
export {
  pack as compress,
  unpack as decompress,
  inspectContainer,
  MAGIC_BYTES,
  CONTAINER_VERSION,
};
export type {
  CompressOptions,
  DecompressOptions,
  ContainerInfo,
} from "./container.js";

// Content analysis
export { analyzeContent, type ContentAnalysis } from "./content-analyzer.js";

// Transformer pipeline
export {
  transformerCompress,
  transformerDecompress,
  type EntropyBackend,
  type PipelineConfig,
  type TransformConfig,
} from "./transformer.js";

// Benchmark
export { runBenchmark } from "./benchmark.js";

// Error types
export {
  VrilZipError,
  InvalidMagicError,
  UnsupportedVersionError,
  TruncatedInputError,
  ChecksumMismatchError,
  AuthenticationError,
  UnsupportedBackendError,
  ContentDetectionError,
} from "./errors.js";

// CRC32
export { crc32 } from "./crc32.js";

// CVKDF v2
export { cvkdf, testCosts, testCostsV2 } from "./cvkdf.js";
export type { CvkdfInput } from "./cvkdf.js";

// Streaming wrappers (collect-all-then-process, since preprocessing
// transforms require full data)
export async function compressStream(
  input: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
  opts?: import("./container.js").CompressOptions
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let totalLen = 0;

  if (Symbol.asyncIterator in input) {
    for await (const chunk of input as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
      totalLen += chunk.length;
    }
  } else {
    const reader = (input as ReadableStream<Uint8Array>).getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalLen += value.length;
      }
    } finally {
      reader.releaseLock();
    }
  }

  const combined = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  return pack(combined, opts);
}
