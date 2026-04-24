// VRIL-ZIP v2 error hierarchy.
// Ported from v1 with additions for multi-backend and content detection.

/**
 * Base error for all VRIL-ZIP v2 operations.
 */
export class VrilZipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VrilZipError";
  }
}

/**
 * Thrown when container magic bytes are not "VRZ2".
 */
export class InvalidMagicError extends VrilZipError {
  constructor(found: string) {
    super(`Invalid VRIL-ZIP magic: expected "VRZ2", found "${found}"`);
    this.name = "InvalidMagicError";
  }
}

/**
 * Thrown when container version is not 2.
 */
export class UnsupportedVersionError extends VrilZipError {
  constructor(version: number) {
    super(`Unsupported VRIL-ZIP container version: ${version}`);
    this.name = "UnsupportedVersionError";
  }
}

/**
 * Thrown when the input buffer is too short to be a valid container.
 */
export class TruncatedInputError extends VrilZipError {
  constructor(needed: number, got: number) {
    super(`Truncated VRIL-ZIP container: need ${needed} bytes, got ${got}`);
    this.name = "TruncatedInputError";
  }
}

/**
 * Thrown when the decompressed data's CRC-32 does not match the container.
 */
export class ChecksumMismatchError extends VrilZipError {
  constructor(expected: number, actual: number) {
    super(
      `CRC32 mismatch: expected 0x${expected.toString(16).padStart(8, "0")}, got 0x${actual.toString(16).padStart(8, "0")} — input is corrupted`
    );
    this.name = "ChecksumMismatchError";
  }
}

/**
 * Thrown when HMAC-SHA3-256 tag verification fails.
 */
export class AuthenticationError extends VrilZipError {
  constructor() {
    super(
      "CVKDF HMAC tag verification failed — payload is unauthenticated or tampered"
    );
    this.name = "AuthenticationError";
  }
}

/**
 * Thrown when an unsupported entropy backend is requested or encountered.
 */
export class UnsupportedBackendError extends VrilZipError {
  constructor(backend: string) {
    super(`Unsupported entropy backend: "${backend}"`);
    this.name = "UnsupportedBackendError";
  }
}

/**
 * Thrown when content detection fails to classify the input.
 */
export class ContentDetectionError extends VrilZipError {
  constructor(reason: string) {
    super(`Content detection failed: ${reason}`);
    this.name = "ContentDetectionError";
  }
}
