// VRZ1 container format
//
//   offset  size  field
//   ------  ----  -------------------------------------------------------
//   0       4     magic = "VRZ1" (0x56 0x52 0x5A 0x31)
//   4       1     version = 1
//   5       1     containerFlags
//                   bit 0: hasCvkdfTag (32-byte HMAC-SHA3-256 appended after CRC)
//                   bit 1: 64-bit length field used (next 8 bytes are uint64 LE)
//                   bits 2-7: reserved (must be 0)
//   6       4|12  originalLength: uint32 LE, OR (if bit 1) 0xFFFFFFFF + uint64 LE
//   ...     N     payload (Schauberger output incl. internal flags byte)
//   end-4   4     CRC32(originalInput) — uint32 LE
//   [end]   32    optional: HMAC-SHA3-256 tag over (header || payload || crc32)
//                 — only present if containerFlags bit 0 set
//
// All multi-byte integers are little-endian.

import { crc32 } from "./crc32.ts";
import {
  ChecksumMismatchError,
  InvalidMagicError,
  TruncatedInputError,
  UnsupportedVersionError,
} from "./errors.ts";
import { schaubergerCompress, schaubergerDecompress } from "./schauberger.ts";

const MAGIC = new Uint8Array([0x56, 0x52, 0x5a, 0x31]); // "VRZ1"
const VERSION = 1;

const CFLAG_HAS_CVKDF_TAG = 0x01;
const CFLAG_64BIT_LENGTH = 0x02;

const HMAC_TAG_LEN = 32;

export interface CompressOptions {
  /** zlib compression level 1-9. Default 9. */
  level?: number;
  /**
   * Optional 32-byte HMAC-SHA3-256 key (typically a CVKDF Layer 7 output).
   * When provided, the container appends an HMAC tag over the full frame,
   * making the payload authenticated. Decompress will throw if the tag
   * does not verify with the same key.
   */
  authKey?: Uint8Array;
}

export interface DecompressOptions {
  /** Same key used at compress time. Required iff the container is authenticated. */
  authKey?: Uint8Array;
  /**
   * If true (default), CRC32 is verified after decompress. If false, only
   * structural integrity is checked. Auth tag is always verified when
   * present, regardless of this flag.
   */
  verifyChecksum?: boolean;
}

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
  // Lazy-load to keep the core dep-free in non-auth flows.
  // node:crypto's createHmac supports 'sha3-256' on Node 18+.
  const { createHmac } = require("node:crypto") as typeof import("node:crypto");
  return new Uint8Array(createHmac("sha3-256", key).update(data).digest());
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function pack(input: Uint8Array, opts: CompressOptions = {}): Uint8Array {
  const payload = schaubergerCompress(input, { level: opts.level });
  const checksum = crc32(input);
  const useAuthTag = opts.authKey != null;

  const use64 = input.length >= 0xffffffff;
  const lengthFieldSize = use64 ? 12 : 4; // 4 sentinel + 8 uint64, or just 4
  const headerSize = 4 + 1 + 1 + lengthFieldSize; // magic + version + flags + length
  const totalSize =
    headerSize + payload.length + 4 + (useAuthTag ? HMAC_TAG_LEN : 0);

  const out = new Uint8Array(totalSize);
  out.set(MAGIC, 0);
  out[4] = VERSION;
  let cflags = 0;
  if (useAuthTag) cflags |= CFLAG_HAS_CVKDF_TAG;
  if (use64) cflags |= CFLAG_64BIT_LENGTH;
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
    if (opts.authKey!.length === 0) {
      throw new Error("authKey must be non-empty");
    }
    const tagInputEnd = headerSize + payload.length + 4;
    const tagInput = out.subarray(0, tagInputEnd);
    const tag = hmacSha3_256(opts.authKey!, tagInput);
    out.set(tag, tagInputEnd);
  }

  return out;
}

export function unpack(container: Uint8Array, opts: DecompressOptions = {}): Uint8Array {
  if (container.length < 4 + 1 + 1 + 4 + 4) {
    throw new TruncatedInputError(14, container.length);
  }
  for (let i = 0; i < 4; i++) {
    if (container[i] !== MAGIC[i]) {
      const found = String.fromCharCode(...container.slice(0, 4));
      throw new InvalidMagicError(found);
    }
  }
  const version = container[4];
  if (version !== VERSION) throw new UnsupportedVersionError(version);

  const cflags = container[5];
  const has64 = (cflags & CFLAG_64BIT_LENGTH) !== 0;
  const hasTag = (cflags & CFLAG_HAS_CVKDF_TAG) !== 0;

  const view = new DataView(container.buffer, container.byteOffset, container.byteLength);
  let originalLength: number;
  let headerSize: number;
  if (has64) {
    if (container.length < 4 + 1 + 1 + 12 + 4) {
      throw new TruncatedInputError(22, container.length);
    }
    const sentinel = readUint32LE(view, 6);
    if (sentinel !== 0xffffffff) {
      throw new TruncatedInputError(22, container.length);
    }
    const big = readUint64LE(view, 10);
    if (big > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error("Container declares > 2^53 bytes; not supported in this build");
    }
    originalLength = Number(big);
    headerSize = 18;
  } else {
    originalLength = readUint32LE(view, 6);
    headerSize = 10;
  }

  const tagSize = hasTag ? HMAC_TAG_LEN : 0;
  const minSize = headerSize + 1 + 4 + tagSize; // header + min payload (1 byte flags) + crc + tag
  if (container.length < minSize) {
    throw new TruncatedInputError(minSize, container.length);
  }

  const payloadEnd = container.length - 4 - tagSize;
  const payload = container.subarray(headerSize, payloadEnd);
  const declaredCrc = readUint32LE(view, payloadEnd);

  if (hasTag) {
    if (!opts.authKey) {
      throw new Error(
        "Container is authenticated (CVKDF tag present) but no authKey was provided to decompress",
      );
    }
    const tag = container.subarray(payloadEnd + 4);
    const expected = hmacSha3_256(opts.authKey, container.subarray(0, payloadEnd + 4));
    if (!timingSafeEqual(tag, expected)) {
      const { AuthenticationError } = require("./errors.ts");
      throw new AuthenticationError();
    }
  }

  const restored = schaubergerDecompress(payload);

  if (restored.length !== originalLength) {
    throw new ChecksumMismatchError(declaredCrc, crc32(restored));
  }

  if (opts.verifyChecksum !== false) {
    const actualCrc = crc32(restored);
    if (actualCrc !== declaredCrc) {
      throw new ChecksumMismatchError(declaredCrc, actualCrc);
    }
  }

  return restored;
}

export const MAGIC_BYTES = MAGIC;
export const CONTAINER_VERSION = VERSION;
