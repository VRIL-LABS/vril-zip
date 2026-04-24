// VRZ2 Container Format
//
// Extended from VRZ1 with multi-backend support and enhanced flags.
//
//   offset  size  field
//   ------  ----  -------------------------------------------------------
//   0       4     magic = "VRZ2" (0x56 0x52 0x5A 0x32)
//   4       1     version = 2
//   5       1     containerFlags
//                   bit 0: hasCvkdfTag (32-byte HMAC-SHA3-256 after CRC)
//                   bit 1: 64-bit length field used
//                   bits 2-3: entropyBackend (00=deflate-raw, 01=brotli, 10=gzip)
//                   bits 4-7: reserved (must be 0)
//   6       4|12  originalLength: uint32 LE, OR (if bit 1) 0xFFFFFFFF + uint64 LE
//   ...     N     payload (transformer pipeline output with internal flags)
//   end-4   4     CRC32(originalInput) — uint32 LE
//   [end]   32    optional: HMAC-SHA3-256 tag
//
// All multi-byte integers are little-endian.

import { createHmac } from "node:crypto";
import { crc32 } from "./crc32.js";
import {
  ChecksumMismatchError,
  InvalidMagicError,
  TruncatedInputError,
  UnsupportedVersionError,
  AuthenticationError,
  UnsupportedBackendError,
} from "./errors.js";
import {
  transformerCompress,
  transformerDecompress,
  type EntropyBackend,
} from "./transformer.js";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const MAGIC = new Uint8Array([0x56, 0x52, 0x5a, 0x32]); // "VRZ2"
const VERSION = 2;

const CFLAG_HAS_CVKDF_TAG = 0x01;
const CFLAG_64BIT_LENGTH = 0x02;
const CFLAG_BACKEND_SHIFT = 2;
const CFLAG_BACKEND_MASK = 0x03; // 2 bits

const HMAC_TAG_LEN = 32;

// Backend encoding in container flags (bits 2-3)
const BACKEND_DEFLATE_RAW = 0;
const BACKEND_BROTLI = 1;
const BACKEND_GZIP = 2;

function backendToCode(b: EntropyBackend): number {
  switch (b) {
    case "deflate-raw": return BACKEND_DEFLATE_RAW;
    case "brotli": return BACKEND_BROTLI;
    case "gzip": return BACKEND_GZIP;
  }
}

function codeToBackend(c: number): EntropyBackend {
  switch (c) {
    case BACKEND_DEFLATE_RAW: return "deflate-raw";
    case BACKEND_BROTLI: return "brotli";
    case BACKEND_GZIP: return "gzip";
    default: throw new UnsupportedBackendError(`backend code ${c}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────

export interface CompressOptions {
  /** Compression level 1-9. Default 9. Brothml maps to quality 1-11. */
  level?: number;
  /** Entropy backend selection: 'auto' (try all), 'deflate-raw', 'brotli', or 'gzip'. */
  backend?: EntropyBackend | "auto";
  /**
   * Optional 32-byte HMAC-SHA3-256 authentication key (typically a CVKDF v2 output).
   * When provided, the container appends an HMAC tag.
   */
  authKey?: Uint8Array;
}

export interface DecompressOptions {
  /** Same key used at compress time. Required if the container is authenticated. */
  authKey?: Uint8Array;
  /** If true (default), CRC32 is verified after decompress. */
  verifyChecksum?: boolean;
}

export interface ContainerInfo {
  version: number;
  backend: EntropyBackend;
  hasAuthTag: boolean;
  originalLength: number;
  payloadLength: number;
  crc32: number;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function writeUint32LE(view: DataView, off: number, v: number): void {
  view.setUint32(off, v >>> 0, true);
}

function writeUint64LE(view: DataView, off: number, v: bigint): void {
  view.setBigUint64(off, v, true);
}

function readUint32LE(view: DataView, off: number): number {
  return view.getUint32(off, true);
}

function readUint64LE(view: DataView, off: number): bigint {
  return view.getBigUint64(off, true);
}

function hmacSha3_256(key: Uint8Array, data: Uint8Array): Uint8Array {
  return new Uint8Array(
    createHmac("sha3-256", key).update(data).digest()
  );
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ─────────────────────────────────────────────────────────────
// Pack (compress)
// ─────────────────────────────────────────────────────────────

/**
 * Compress input data into a VRZ2 container.
 *
 * @param input  Raw input bytes to compress.
 * @param opts   Compression options (level, backend, auth key).
 * @returns      VRZ2 container bytes.
 */
export function pack(
  input: Uint8Array,
  opts: CompressOptions = {}
): Uint8Array {
  // Run the Universal Transformer Pipeline
  const { payload, backend, analysis } = transformerCompress(input, {
    backend: opts.backend,
    level: opts.level,
  });

  const checksum = crc32(input);
  const useAuthTag = opts.authKey != null && opts.authKey!.length > 0;
  const use64 = input.length >= 0xffffffff;

  // Compute backend code for container flags
  const backendCode = backendToCode(backend);
  const lengthFieldSize = use64 ? 12 : 4;
  const headerSize = 4 + 1 + 1 + lengthFieldSize;

  const totalSize =
    headerSize +
    payload.length +
    4 +
    (useAuthTag ? HMAC_TAG_LEN : 0);

  const out = new Uint8Array(totalSize);
  out.set(MAGIC, 0);
  out[4] = VERSION;

  let cflags = 0;
  if (useAuthTag) cflags |= CFLAG_HAS_CVKDF_TAG;
  if (use64) cflags |= CFLAG_64BIT_LENGTH;
  cflags |= (backendCode << CFLAG_BACKEND_SHIFT) & (CFLAG_BACKEND_MASK << CFLAG_BACKEND_SHIFT);
  out[5] = cflags;

  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  if (use64) {
    writeUint32LE(view, 6, 0xffffffff);
    writeUint64LE(view, 10, BigInt(input.length));
  } else {
    writeUint32LE(view, 6, input.length);
  }

  out.set(payload, headerSize);
  writeUint32LE(view, headerSize + payload.length, checksum);

  if (useAuthTag) {
    const tagInputEnd = headerSize + payload.length + 4;
    const tagInput = out.subarray(0, tagInputEnd);
    const tag = hmacSha3_256(opts.authKey!, tagInput);
    out.set(tag, tagInputEnd);
  }

  return out;
}

// ─────────────────────────────────────────────────────────────
// Unpack (decompress)
// ─────────────────────────────────────────────────────────────

/**
 * Decompress a VRZ2 container back to the original input.
 *
 * @param container  VRZ2 container bytes.
 * @param opts       Decompression options (auth key, checksum verification).
 * @returns          Original uncompressed bytes.
 */
export function unpack(
  container: Uint8Array,
  opts: DecompressOptions = {}
): Uint8Array {
  // Minimum container size: magic(4) + version(1) + flags(1) + length(4) + payload_flags(1) + crc(4) = 15
  if (container.length < 15) {
    throw new TruncatedInputError(15, container.length);
  }

  // Verify magic
  for (let i = 0; i < 4; i++) {
    if (container[i] !== MAGIC[i]) {
      const found = String.fromCharCode(...container.slice(0, 4));
      throw new InvalidMagicError(found);
    }
  }

  // Verify version
  const version = container[4];
  if (version !== VERSION) throw new UnsupportedVersionError(version);

  // Parse flags
  const cflags = container[5];
  const has64 = (cflags & CFLAG_64BIT_LENGTH) !== 0;
  const hasTag = (cflags & CFLAG_HAS_CVKDF_TAG) !== 0;
  const backendCode = (cflags >> CFLAG_BACKEND_SHIFT) & CFLAG_BACKEND_MASK;
  const backend = codeToBackend(backendCode);

  const view = new DataView(
    container.buffer,
    container.byteOffset,
    container.byteLength
  );

  // Parse length
  let originalLength: number;
  let headerSize: number;
  if (has64) {
    if (container.length < 23) {
      throw new TruncatedInputError(23, container.length);
    }
    const sentinel = readUint32LE(view, 6);
    if (sentinel !== 0xffffffff) {
      throw new TruncatedInputError(23, container.length);
    }
    const big = readUint64LE(view, 10);
    if (big > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(
        "Container declares > 2^53 bytes; not supported in this build"
      );
    }
    originalLength = Number(big);
    headerSize = 18;
  } else {
    originalLength = readUint32LE(view, 6);
    headerSize = 10;
  }

  // Verify minimum size
  const tagSize = hasTag ? HMAC_TAG_LEN : 0;
  const minSize = headerSize + 1 + 4 + tagSize;
  if (container.length < minSize) {
    throw new TruncatedInputError(minSize, container.length);
  }

  // Extract payload and CRC
  const payloadEnd = container.length - 4 - tagSize;
  const payload = container.subarray(headerSize, payloadEnd);
  const declaredCrc = readUint32LE(view, payloadEnd);

  // Verify auth tag if present
  if (hasTag) {
    if (!opts.authKey) {
      throw new Error(
        "Container is authenticated (CVKDF tag present) but no authKey was provided"
      );
    }
    const tag = container.subarray(payloadEnd + 4);
    const expected = hmacSha3_256(
      opts.authKey,
      container.subarray(0, payloadEnd + 4)
    );
    if (!timingSafeEqual(tag, expected)) {
      throw new AuthenticationError();
    }
  }

  // Decompress via Universal Transformer
  const restored = transformerDecompress(payload, backend);

  // Verify length
  if (restored.length !== originalLength) {
    throw new ChecksumMismatchError(declaredCrc, crc32(restored));
  }

  // Verify CRC32
  if (opts.verifyChecksum !== false) {
    const actualCrc = crc32(restored);
    if (actualCrc !== declaredCrc) {
      throw new ChecksumMismatchError(declaredCrc, actualCrc);
    }
  }

  return restored;
}

// ─────────────────────────────────────────────────────────────
// Container inspection
// ─────────────────────────────────────────────────────────────

/**
 * Read container metadata without decompressing.
 */
export function inspectContainer(container: Uint8Array): ContainerInfo {
  if (container.length < 10) {
    throw new TruncatedInputError(10, container.length);
  }

  for (let i = 0; i < 4; i++) {
    if (container[i] !== MAGIC[i]) {
      const found = String.fromCharCode(...container.slice(0, 4));
      throw new InvalidMagicError(found);
    }
  }

  const version = container[4];
  const cflags = container[5];
  const has64 = (cflags & CFLAG_64BIT_LENGTH) !== 0;
  const hasTag = (cflags & CFLAG_HAS_CVKDF_TAG) !== 0;
  const backendCode = (cflags >> CFLAG_BACKEND_SHIFT) & CFLAG_BACKEND_MASK;
  const backend = codeToBackend(backendCode);

  const view = new DataView(
    container.buffer,
    container.byteOffset,
    container.byteLength
  );

  let originalLength: number;
  let headerSize: number;
  if (has64) {
    originalLength = Number(view.getBigUint64(10, true));
    headerSize = 18;
  } else {
    originalLength = view.getUint32(6, true);
    headerSize = 10;
  }

  const tagSize = hasTag ? HMAC_TAG_LEN : 0;
  const payloadEnd = container.length - 4 - tagSize;
  const payloadLength = payloadEnd - headerSize;
  const crc = view.getUint32(payloadEnd, true);

  return {
    version,
    backend,
    hasAuthTag: hasTag,
    originalLength,
    payloadLength,
    crc32: crc,
  };
}

// ─────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────

export const MAGIC_BYTES = MAGIC;
export const CONTAINER_VERSION = VERSION;
