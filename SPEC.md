# VRIL-ZIP Container Format Specification — `VRZ1`

Version 1, April 2026 · VRIL LABS

This document defines the on-the-wire byte layout of a VRIL-ZIP v1 container. Anyone implementing a third-party encoder or decoder should be able to round-trip against the reference implementation in `lib/vril-zip/src/` from this document alone.

## Goals

* **Self-describing.** Decoder needs only the bytes — no side-channel `originalSize`, no out-of-band parameters (other than the optional auth key).
* **Tamper-evident.** A 32-bit IEEE CRC of the *original* (decompressed) input is appended; any single-bit corruption of input or payload is caught.
* **Optionally authenticated.** A 32-byte HMAC-SHA3-256 tag may be appended, keyed by an out-of-band secret (typically the 32-byte output of CVKDF).
* **Future-extensible.** A version byte and a flags byte give us room to evolve the entropy backend (e.g. zstd in v2) without breaking compatibility.

## Overall layout

```
┌────────┬──────┬───────────────────────────────────────────────────────┐
│ offset │ size │ field                                                 │
├────────┼──────┼───────────────────────────────────────────────────────┤
│   0    │   4  │ magic = "VRZ1"  (0x56 0x52 0x5A 0x31)                 │
│   4    │   1  │ version = 0x01                                        │
│   5    │   1  │ containerFlags                                        │
│   6    │ 4|12 │ originalLength                                        │
│  ...   │   N  │ payload                                               │
│ end-T-4│   4  │ crc32(originalInput)                                  │
│ end-T  │   T  │ optional HMAC-SHA3-256 tag (T = 32 if present, else 0)│
└────────┴──────┴───────────────────────────────────────────────────────┘
```

All multi-byte integers are **little-endian**.

## containerFlags (1 byte)

| bit | name              | meaning                                                          |
|----:|-------------------|------------------------------------------------------------------|
|   0 | `HAS_CVKDF_TAG`   | A 32-byte HMAC-SHA3-256 tag is present at end-of-frame           |
|   1 | `LENGTH_64BIT`    | `originalLength` is encoded as `0xFFFFFFFF` + uint64 LE (12 bytes total) |
| 2-7 | (reserved)        | MUST be 0; decoders MUST reject containers with reserved bits set |

## originalLength

* **Default form (4 bytes):** little-endian uint32 holding the length of the original input in bytes.
* **64-bit form (12 bytes):** if the input is `≥ 2^32 − 1` bytes, the 4-byte field is `0xFFFFFFFF` and an immediately-following 8-byte little-endian uint64 holds the true length. The `LENGTH_64BIT` flag MUST be set.

## payload

The payload is the output of the Schauberger pipeline. Its first byte is an **internal flags byte** (defined by the pipeline, not the container):

| bit | name              | meaning                                                          |
|----:|-------------------|------------------------------------------------------------------|
|   0 | `FREQ_REMAP`      | hyperbolic frequency remap was applied during compress           |
|   1 | `RLE`             | centripetal run-length encoding was applied                      |
|   2 | `STORED`          | entropy backend skipped (incompressible input); body is raw post-permutation bytes |
| 3-7 | (reserved)        | MUST be 0                                                        |

The remainder of the payload is the deflate-raw (RFC 1951) compressed bytes when `STORED=0`, or the raw post-permutation [+ optional remap] bytes when `STORED=1`.

## Pipeline (informative)

The forward pipeline is:

```
data
  → goldenSpiralReorder       (φ-permutation, bijective)
  → [hyperbolicFrequencyRemap] (only if ≥128 unique bytes in first 512)
  → [centripetalRunLength]     (only if ≥2% bytes in runs of ≥3)
  → deflate-raw level 9        (skipped if it bloats; STORED flag set instead)
```

Reverse pipeline runs the inverse of each applied stage (gated by the internal flags byte).

### `goldenSpiralReorder`

Given input length `n`:

1. Compute `stride = round(n / φ)` where `φ = 1.6180339887…`.
2. Bump `stride` until `gcd(stride, n) == 1` (ensures full permutation).
3. Forward: `output[(i * stride) mod n] = input[i]` for `i ∈ [0, n)`.
4. Reverse: `output[i] = input[(i * stride) mod n]` for `i ∈ [0, n)`.

The same `stride` works in both directions because forward writes at `σ(i)` and reverse reads at `σ(i)` — the operations compose to identity for any coprime stride.

### `hyperbolicFrequencyRemap`

1. Build the byte frequency table.
2. Sort symbols descending by frequency (ties broken by symbol value ascending).
3. Header: 1-byte K (count of distinct symbols, with 0 meaning 256), then K bytes giving the symbols in rank order.
4. Body: each input byte replaced by its rank.

Reverse: read header, build inverse map, replace each body byte.

### `centripetalRunLength`

* Run of ≥3 equal bytes b: `[0xFF, runLen, b]`
* Any literal `0xFF` byte: `[0xFF, 0x01, 0xFF]`
* All other literal bytes: emitted as-is

Decoding rule: byte `0xFF` is always a marker followed by `[runLen, value]`; all other bytes are literal.

## CRC32

Polynomial `0xEDB88320` (IEEE 802.3 reflected), same as gzip / PNG / zip. Computed over the **original input bytes**, not over the payload. A decoder verifies the CRC after decompression; mismatch indicates either corruption of the payload or of the CRC field.

## CVKDF authentication tag (optional)

When `HAS_CVKDF_TAG` is set, the last 32 bytes of the container are an HMAC-SHA3-256 tag computed over `header || payload || crc32` using the supplied 32-byte authentication key.

The key SHOULD be the 32-byte output of a CVKDF derivation (`@workspace/vril-zip/cvkdf`), but any 32-byte secret is accepted by this layer.

Decoders MUST verify the tag in constant time *before* attempting decompression. Decoders MUST reject the container if a tag is present and either (a) no key was supplied, or (b) the key produces a different tag.

## Error conditions

A conforming decoder MUST distinguish:

* **InvalidMagicError** — first 4 bytes ≠ `"VRZ1"`.
* **UnsupportedVersionError** — `version != 0x01`.
* **TruncatedInputError** — container is shorter than the minimum size implied by its flags.
* **ChecksumMismatchError** — CRC32 of decompressed bytes ≠ declared CRC, or decompressed length ≠ `originalLength`.
* **AuthenticationError** — `HAS_CVKDF_TAG` is set and the supplied key produces a different HMAC.

Reserved-bit set, length-mismatch with payload bounds, or invalid internal-flags combinations are all classed as `TruncatedInputError` or a generic `VrilZipError`.

## Worked example: `compress("VRIL")`

Input: `0x56 0x52 0x49 0x4C` (4 bytes, ASCII "VRIL").

Container produced by the reference implementation (level 9):

```
56 52 5A 31           magic
01                    version
00                    containerFlags (no CVKDF tag, 32-bit length)
04 00 00 00           originalLength = 4
00                    internal flags (no remap, no RLE, not stored)
… deflate-raw bytes … payload
crc                   CRC32(0x56 52 49 4C) = 0x6DE7…  (little-endian)
```

The reference implementation in `src/container.ts` together with the test suite in `test/roundtrip.test.mts` is the normative reference.

## Versioning policy

* `VRZ1` (this spec) is frozen. Any breaking change to the container layout, the pipeline, or the CRC polynomial requires a new magic (`VRZ2`, etc.).
* Adding a new entropy backend (e.g. zstd in v2) is a breaking change because it requires a new flag bit interpretation. Backends added in non-breaking fashion would re-use the existing `STORED` semantics with a new internal flag bit (still `VRZ1`).
* The CVKDF tag is part of `VRZ1`; it MAY be present or absent in any v1 container.
