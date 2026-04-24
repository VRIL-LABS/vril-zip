# VRIL-ZIP Container Format Specification — `VRZ2`

Version 2, April 2026 · VRIL LABS

This document defines the on-the-wire byte layout of a VRIL-ZIP v2 container. Anyone implementing a third-party encoder or decoder should be able to round-trip against the reference implementation in `src/` from this document alone.

## Goals

* **Self-describing.** Decoder needs only the bytes — no side-channel `originalSize`, no out-of-band parameters (other than the optional auth key).
* **Tamper-evident.** A 32-bit IEEE CRC of the *original* (decompressed) input is appended; any single-bit corruption of input or payload is caught.
* **Optionally authenticated.** A 32-byte HMAC-SHA3-256 tag may be appended, keyed by an out-of-band secret (typically the 32-byte output of CVKDF).
* **Multi-backend.** Container encodes which entropy backend (deflate-raw, brotli, or gzip) produced the payload; the decoder uses the correct decompressor automatically.
* **Future-extensible.** A version byte and a flags byte give us room to evolve the format without breaking compatibility.

## Overall layout

```
┌────────┬──────┬──────────────────────────────────────────┐
│ Offset │ Size │ Field                                     │
├────────┼──────┼──────────────────────────────────────────┤
│   0    │   4  │ magic = "VRZ2"  (0x56 0x52 0x5A 0x32)    │
│   4    │   1  │ version = 0x02                            │
│   5    │   1  │ containerFlags                            │
│   6    │4|12  │ originalLength                            │
│  ...   │   N  │ payload (preprocessing flags + compressed)│
│ end-4  │   4  │ crc32(originalInput)                      │
│ [end]  │  32  │ optional HMAC-SHA3-256 tag                │
└────────┴──────┴──────────────────────────────────────────┘
```

All multi-byte integers are **little-endian**.

## containerFlags (1 byte)

| bit | name              | meaning                                                                        |
|----:|-------------------|--------------------------------------------------------------------------------|
|   0 | `HAS_CVKDF_TAG`   | A 32-byte HMAC-SHA3-256 tag is present at end-of-frame                         |
|   1 | `LENGTH_64BIT`    | `originalLength` is encoded as `0xFFFFFFFF` + uint64 LE (12 bytes total)       |
| 2-3 | `BACKEND`         | Entropy backend used: `00`=deflate-raw, `01`=brotli, `10`=gzip, `11`=reserved |
| 4-7 | (reserved)        | MUST be 0; decoders MUST reject containers with reserved bits set              |

## originalLength

* **Default form (4 bytes):** little-endian uint32 holding the length of the original input in bytes.
* **64-bit form (12 bytes):** if the input is `≥ 2^32 − 1` bytes, the 4-byte field is `0xFFFFFFFF` and an immediately-following 8-byte little-endian uint64 holds the true length. The `LENGTH_64BIT` flag MUST be set.

## payload

The payload begins with an **internal flags byte** (defined by the preprocessing pipeline, not the container):

| bit | name              | meaning                                                                                   |
|----:|-------------------|-------------------------------------------------------------------------------------------|
|   0 | `FREQ_REMAP`      | hyperbolic frequency remap was applied during compress                                    |
|   1 | `RLE`             | centripetal run-length encoding was applied                                               |
|   2 | `STORED`          | entropy backend skipped (incompressible input); body is raw post-transform bytes          |
|   3 | `BWT`             | Burrows-Wheeler Transform was applied                                                     |
|   4 | `MTF`             | Move-to-Front transform was applied (always follows BWT when set)                         |
|   5 | `DELTA`           | delta encoding was applied (structured/columnar data)                                     |
|   6 | `PHI_PERM`        | φ-permutation (Schauberger golden-spiral reorder) was applied                             |
|   7 | (reserved)        | MUST be 0                                                                                 |

The remainder of the payload is the bytes produced by the selected entropy backend (`BACKEND` field in `containerFlags`) when `STORED=0`, or the raw post-transform bytes when `STORED=1`.

## Universal Transformer Pipeline (informative)

VRIL-ZIP v2 uses a content-aware pipeline. A `ContentAnalyzer` inspects the input and selects from multiple candidate pipelines. All candidates are evaluated; the one producing the smallest output is stored in the container.

### Content detection

The analyzer classifies input into one of the following types:

| Type     | Heuristics                                                        |
|----------|-------------------------------------------------------------------|
| `text`   | UTF-8 valid, high printable-ASCII ratio                           |
| `json`   | Passes `JSON.parse`, or starts with `{`/`[` with balanced braces |
| `xml`    | Starts with `<?xml` or `<` with tag structure                     |
| `csv`    | Consistent comma/tab delimiters across lines                      |
| `binary` | Low entropy variance, non-printable bytes common                  |
| `image`  | PNG/JPEG/GIF/WebP/BMP magic bytes                                 |
| `audio`  | WAV/MP3/FLAC/OGG magic bytes                                      |
| `archive`| ZIP/gzip/brotli/zstd magic bytes (already compressed)            |

### Candidate pipelines

1. **Bare baselines** — deflate-raw / brotli / gzip with no preprocessing
2. **BWT + MTF + entropy** — Burrows-Wheeler + Move-to-Front, best for text/DNA
3. **Delta + entropy** — delta encoding, best for structured/columnar data
4. **φ-permutation + freq-remap + RLE + entropy** — Schauberger pipeline (v1 legacy)
5. **Content-type combinations** — e.g. BWT+MTF+RLE for text, delta+RLE for CSV

### Forward transforms (each bijective)

#### `goldenSpiralReorder` (φ-permutation)

Given input length `n`:

1. Compute `stride = round(n / φ)` where `φ = 1.6180339887…`.
2. Bump `stride` until `gcd(stride, n) == 1` (ensures full permutation).
3. Forward: `output[(i * stride) mod n] = input[i]` for `i ∈ [0, n)`.
4. Reverse: `output[i] = input[(i * stride) mod n]` for `i ∈ [0, n)`.

#### `bwtEncode` / `bwtDecode`

Standard Burrows-Wheeler Transform. Suffix-array variant for O(n log n) time. The last-column output and the primary index are concatenated: `[4-byte primaryIndex LE][transformed bytes]`. Inverse recovers the original order via LF-mapping.

#### `mtfEncode` / `mtfDecode`

Move-to-Front on a 256-symbol alphabet. Each input symbol is replaced by its current rank in the alphabet list, then moved to position 0. Inverse reverses the process. Typically applied immediately after BWT to produce a low-entropy symbol sequence.

#### `deltaEncode` / `deltaDecode`

First-order byte delta: `output[0] = input[0]`, `output[i] = input[i] − input[i−1]` (mod 256). Reduces byte variance in structured or columnar data. Inverse: prefix-sum.

#### `hyperbolicFrequencyRemap`

1. Build the byte frequency table.
2. Sort symbols descending by frequency (ties broken by symbol value ascending).
3. Header: 1-byte K (count of distinct symbols, with 0 meaning 256), then K bytes giving the symbols in rank order.
4. Body: each input byte replaced by its rank.

Reverse: read header, build inverse map, replace each body byte.

#### `centripetalRunLength`

* Run of ≥3 equal bytes b: `[0xFF, runLen, b]`
* Any literal `0xFF` byte: `[0xFF, 0x01, 0xFF]`
* All other literal bytes: emitted as-is

Decoding rule: byte `0xFF` is always a marker followed by `[runLen, value]`; all other bytes are literal.

## Entropy backends

| Code | Backend      | RFC / spec           | Notes                          |
|------|--------------|----------------------|--------------------------------|
| `00` | deflate-raw  | RFC 1951             | Default; universally available |
| `01` | brotli       | RFC 7932             | Best ratio on text/HTML        |
| `10` | gzip         | RFC 1952             | Widest ecosystem compatibility |
| `11` | (reserved)   | —                    | MUST NOT be written; decoders MUST reject |

The encoder evaluates all three (or a configurable subset) and picks the smallest output. The chosen backend's code is stored in `containerFlags[2:3]`.

## CRC32

Polynomial `0xEDB88320` (IEEE 802.3 reflected), same as gzip / PNG / zip. Computed over the **original input bytes**, not over the payload. A decoder verifies the CRC after decompression; mismatch indicates either corruption of the payload or of the CRC field.

## CVKDF authentication tag (optional)

When `HAS_CVKDF_TAG` is set, the last 32 bytes of the container are an HMAC-SHA3-256 tag computed over `header || payload || crc32` using the supplied 32-byte authentication key.

The key SHOULD be the 32-byte output of a CVKDF derivation (`src/cvkdf.ts`), but any 32-byte secret is accepted by this layer.

Decoders MUST verify the tag in constant time *before* attempting decompression. Decoders MUST reject the container if a tag is present and either (a) no key was supplied, or (b) the key produces a different tag.

## Error conditions

A conforming decoder MUST distinguish:

* **InvalidMagicError** — first 4 bytes ≠ `"VRZ2"`.
* **UnsupportedVersionError** — `version != 0x02`.
* **TruncatedInputError** — container is shorter than the minimum size implied by its flags.
* **ChecksumMismatchError** — CRC32 of decompressed bytes ≠ declared CRC, or decompressed length ≠ `originalLength`.
* **AuthenticationError** — `HAS_CVKDF_TAG` is set and the supplied key produces a different HMAC.

Reserved-bit set, length-mismatch with payload bounds, or invalid internal-flags combinations are all classed as `TruncatedInputError` or a generic `VrilZipError`.

## Worked example: `compress("VRIL")`

Input: `0x56 0x52 0x49 0x4C` (4 bytes, ASCII "VRIL").

Container produced by the reference implementation (deflate-raw backend, no preprocessing):

```
56 52 5A 32           magic  ("VRZ2")
02                    version
00                    containerFlags (no CVKDF tag, 32-bit length, deflate-raw backend)
04 00 00 00           originalLength = 4
00                    internal flags (no preprocessing applied)
… deflate-raw bytes … payload
crc                   CRC32(0x56 52 49 4C)  (little-endian)
```

The reference implementation in `src/container.ts` together with the test suite in `test/roundtrip.test.mts` is the normative reference.

## Compatibility with VRZ1

`VRZ2` containers use magic bytes `"VRZ2"` (0x56 0x52 0x5A 0x32). A `VRZ1` decoder encountering a `VRZ2` container MUST return **InvalidMagicError** (or equivalent). A `VRZ2` decoder encountering a `VRZ1` container MUST return **UnsupportedVersionError**; it MUST NOT attempt to decompress legacy containers.

Tooling that must handle both formats should inspect the first 4 bytes to dispatch to the appropriate codec.

## Versioning policy

* `VRZ2` (this spec) supersedes `VRZ1`. Any breaking change to the container layout, the pipeline, or the CRC polynomial requires a new magic (`VRZ3`, etc.).
* New entropy backends require a new magic and spec revision; `BACKEND=11` is reserved for that purpose.
* The CVKDF tag is part of `VRZ2`; it MAY be present or absent in any v2 container.
