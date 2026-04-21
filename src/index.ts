// VRIL-ZIP — provably lossless compression with a φ-permutation pre-pass.
//
// Quick start:
//
//   import { compress, decompress } from "@workspace/vril-zip";
//   const buf = new TextEncoder().encode("hello world");
//   const packed = compress(buf);
//   const back = decompress(packed);
//   // back deeply equals buf
//
// Authenticated mode (optional, requires a key — typically derived via
// CVKDF; see `./cvkdf`):
//
//   import { compress, decompress } from "@workspace/vril-zip";
//   import { cvkdf } from "@workspace/vril-zip/cvkdf";
//   const key = await cvkdf({ ...preconditions });
//   const packed = compress(buf, { authKey: key });
//   const back = decompress(packed, { authKey: key });
//
// The container is self-describing — decoder needs only the compressed
// bytes (plus the same key when authenticated mode was used).

export { pack as compress, unpack as decompress, MAGIC_BYTES, CONTAINER_VERSION } from "./container.ts";
export type { CompressOptions, DecompressOptions } from "./container.ts";
export {
  VrilZipError,
  InvalidMagicError,
  UnsupportedVersionError,
  TruncatedInputError,
  ChecksumMismatchError,
  AuthenticationError,
} from "./errors.ts";
export { crc32 } from "./crc32.ts";
