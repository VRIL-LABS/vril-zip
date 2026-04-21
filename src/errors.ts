export class VrilZipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VrilZipError";
  }
}

export class InvalidMagicError extends VrilZipError {
  constructor(found: string) {
    super(`Invalid VRIL-ZIP magic: expected "VRZ1", found "${found}"`);
    this.name = "InvalidMagicError";
  }
}

export class UnsupportedVersionError extends VrilZipError {
  constructor(version: number) {
    super(`Unsupported VRIL-ZIP container version: ${version}`);
    this.name = "UnsupportedVersionError";
  }
}

export class TruncatedInputError extends VrilZipError {
  constructor(needed: number, got: number) {
    super(`Truncated VRIL-ZIP container: need ${needed} bytes, got ${got}`);
    this.name = "TruncatedInputError";
  }
}

export class ChecksumMismatchError extends VrilZipError {
  constructor(expected: number, actual: number) {
    super(
      `CRC32 mismatch: expected 0x${expected.toString(16).padStart(8, "0")}, got 0x${actual.toString(16).padStart(8, "0")} — input is corrupted`,
    );
    this.name = "ChecksumMismatchError";
  }
}

export class AuthenticationError extends VrilZipError {
  constructor() {
    super("CVKDF HMAC tag verification failed — payload is unauthenticated or tampered");
    this.name = "AuthenticationError";
  }
}
