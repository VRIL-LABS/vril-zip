<p align="center">
  <img src="assets/header.svg" alt="VRIL-ZIP v2 — Universal Transformer Edition by VRIL LABS" width="100%"/>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/vril-zip-v2"><img src="https://img.shields.io/npm/v/vril-zip-v2?color=%237b2fbe&logo=npm&label=npm" alt="npm version"/></a>
  <a href="https://www.npmjs.com/package/vril-zip-v2"><img src="https://img.shields.io/npm/dm/vril-zip-v2?color=%239d4edd&label=downloads" alt="npm downloads"/></a>
  <a href="https://github.com/VRIL-LABS/vril-zip/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-VRIL%20OSS%20v1.0-%23c77dff" alt="license"/></a>
</p>

# `vril-zip-v2`

> Provably lossless compression with a universal transformer pipeline, multi-backend entropy coding, content detection, and CVKDF-authenticated mode.

VRIL-ZIP v2.0.0 features a **Universal Transformer Pipeline**. It auto-detects content type (text, JSON, XML, CSV, binary, images, audio, archives) and selects the optimal preprocessing combination from multiple candidate pipelines — BWT, MTF, RLE, delta encoding, φ-permutation, and frequency remap. All candidates are evaluated against deflate-raw, brotli, and gzip; the smallest result is stored in a self-describing `VRZ2` container.

## Install

```bash
npm install vril-zip-v2
```

Available on npm: [**vril-zip-v2**](https://www.npmjs.com/package/vril-zip-v2)

## Quick Start

```javascript
import { compress, decompress } from 'vril-zip-v2';

const data = new TextEncoder().encode('Hello, VRIL-ZIP v2!');
const packed = compress(data);
const restored = decompress(packed);
// restored deeply equals data — CRC32 verified automatically
```

## Features

- **Universal Transformer Pipeline** — Auto-detects content type (text, JSON, XML, CSV, binary, images, audio, archives) and selects optimal preprocessing
- **Multi-Backend** — Evaluates deflate-raw, brotli, and gzip, picks the smallest output
- **Preprocessing Stages** — BWT, MTF, RLE, delta encoding, φ-permutation, frequency remap
- **CVKDF Authenticated Mode** — 7-layer key derivation with real-world attestation gate
- **Self-Describing Container** — VRZ2 format with magic, version, backend flags, CRC32, optional HMAC
- **100% Lossless** — Byte-perfect round-trip guaranteed

## Authenticated mode (optional)

Bind a payload's integrity to a key derived from a real-world precondition using **CVKDF** (Centripetal Vortex Key Derivation Function — VRIL LABS' multi-layer KDF; see `./src/cvkdf.ts`):

```javascript
import { compress, decompress } from 'vril-zip-v2';
import { cvkdf } from 'vril-zip-v2/dist/cvkdf.js';

// Derive a key using CVKDF (in production, use real attestations)
const key = await cvkdf({
  agentId: 'agent-001',
  environment: 'prod',
  epoch: Math.floor(Date.now() / 1000),
  context: 'vril-zip-v2:archive',
  stateProof: new Uint8Array(32),         // hash of external state
  realWorldAttestation: new Uint8Array(32), // verified event bytes
  anchor: 'genesis:2026-04-23',
  costOverride: cvkdf.testCosts(),        // reduced for demo
});

const packed = compress(data, { authKey: key });
const restored = decompress(packed, { authKey: key });
// Wrong key → AuthenticationError
```

The tag is verified in constant time *before* decompression, so a tampered payload never reaches the decoder.

## Benchmark Results

VRIL-ZIP v2 achieves the **best aggregate compression ratio (2.90x)** across 12 diverse file types (1.06MB total), outperforming brotli Q11 (1.91x), brotli Q5 (1.87x), deflate-raw (1.83x), and gzip (1.83x).

See [BENCHMARKS.md](./BENCHMARKS.md) for complete results.

Run the benchmark harness:

```bash
pnpm --filter @VRIL-LABS/vril-zip bench
```

Output goes to stdout and to `BENCHMARKS.md`. Compares VRIL-ZIP against `deflate-raw lvl 9`, `gzip lvl 9`, `brotli q11` (max ratio), and `brotli q5` (throughput sweet spot) on a curated fixture set. Every row reports compress/decompress throughput in MB/s, ratio, and a round-trip pass/fail.

## CLI

```bash
node dist/cli.js compress <file> [-o output.vrz2]
node dist/cli.js decompress <file> [-o output]
node dist/cli.js info <file>
```

## Tests

```bash
pnpm --filter @VRIL-LABS/vril-zip test
```

Property + adversarial round-trip suite using Node's built-in `node:test` runner. Includes:

* Empty / 1-byte / 2-byte / 1 KB / 1 MB across all-zeros, all-FF, ASCII text, JSON, random, alternating, and ramp distributions.
* 64 random-size random-seed fixtures per run.
* Real project files (`schauberger.ts`, `container.ts`, `package.json`, etc.).
* Inverse property checks on every individual transform.
* Container integrity: corrupted CRC, bad magic, tampered payload, wrong auth key.

## Architecture

```
Input → Content Analyzer → Candidate Pipeline Generator → Evaluate All → Pick Smallest → VRZ2 Container
```

### Candidate Pipelines
1. Bare deflate-raw / brotli / gzip (baselines)
2. BWT + MTF + deflate (text optimization)
3. Delta + deflate (structured data)
4. φ-permutation + frequency remap + RLE + deflate (v1 Schauberger)
5. Content-type specific combinations

### VRZ2 Container Format

The full byte-level container spec is in [`SPEC.md`](./SPEC.md). It's self-contained — anyone can build an interoperable third-party encoder or decoder from it.

```
┌────────┬──────┬──────────────────────────────────────────┐
│ Offset │ Size │ Field                                     │
├────────┼──────┼──────────────────────────────────────────┤
│   0    │   4  │ magic = "VRZ2"                            │
│   4    │   1  │ version = 2                               │
│   5    │   1  │ containerFlags (auth, 64-bit, backend)    │
│   6    │4|12  │ originalLength                            │
│  ...   │   N  │ payload (preprocessing flags + compressed)│
│ end-4  │   4  │ CRC32(originalInput)                      │
│ [end]  │  32  │ optional HMAC-SHA3-256 tag                │
└────────┴──────┴──────────────────────────────────────────┘
```

## VRIL-ZIP technicals

* **Lossless.** `decompress(compress(x)) === x` byte-for-byte for every valid `x`. Tested on synthetic adversarial cases (all-zeros, all-FF, random, alternating, ramps), real source files in this repo, and 64 random-size random-seed property fixtures every test run.
* **Self-describing.** Container is `VRZ2` magic + version + flags + length + payload + CRC32 (+ optional 32-byte HMAC tag). Decoder needs only the bytes.
* **Realistic.** On structured text and JSON, ratio is in the same neighborhood as `deflate-raw` level 9 or better, with the universal transformer contributing meaningful improvements for each content type.

## Design notes

### Why a universal transformer?

Different content types have fundamentally different statistical structure. Text benefits from BWT+MTF (brings high-frequency symbols to rank 0, producing near-zero runs that entropy-code optimally). Structured/columnar data benefits from delta encoding (removes inter-row correlation). Binary data with byte-value skew benefits from frequency remap. The v2 pipeline evaluates all candidates and picks the winner — no manual tuning required.

### Why φ?

The golden ratio gives a low-discrepancy stride (Weyl equidistribution). Combined with the gcd bump-to-coprime, it produces a bijective permutation that interleaves data in a Fibonacci-like pattern. On certain structured payloads (regularly-spaced repeats, fixed-width columnar data) this brings long-range matches inside LZ77's window. The pre-pass is **never lossy** — bijective by construction — and it adds zero runtime cost the decoder couldn't reverse.

### Why a CVKDF tag?

Most authenticated-encryption schemes derive their key from a single password or pre-shared secret. CVKDF treats key derivation as a 7-layer pipeline gated on a real-world precondition (Layer 5: a verified, irreversible, externally confirmable event). The result: the only way to produce a valid tag is to have actually witnessed the event. Useful for archive integrity, escrow release conditions, attestation-bound storage, and time-anchored audit trails.

### Multi-backend entropy selection

The encoder evaluates deflate-raw (RFC 1951), brotli (RFC 7932), and gzip (RFC 1952) on the transformed payload and records the winning backend in the container flags. Decoders use the flag to select the correct decompressor — no ambiguity, no trial-and-error.

## Academic / engineering references

The design is grounded in standard, peer-reviewed work.

* Shannon, C.E. — *A Mathematical Theory of Communication*, Bell System Technical Journal, 1948. Sets the entropy floor every lossless compressor lives under.
* Burrows, M. & Wheeler, D.J. — *A Block-sorting Lossless Data Compression Algorithm*, SRC Technical Report 124, 1994. Foundation of the BWT transform used in pipeline 2.
* Deutsch, P. — *DEFLATE Compressed Data Format Specification version 1.3*, RFC 1951, May 1996. One of three entropy backends in VRIL-ZIP v2.
* Alakuijala, J. et al. — *Brotli Compressed Data Format*, RFC 7932, July 2016. One of three entropy backends in VRIL-ZIP v2.
* Collet, Y. & Kucherawy, M. — *Zstandard Compression and the application/zstd Media Type*, RFC 8478, October 2018. Background for future entropy-backend candidates.
* Duda, J. — *Asymmetric numeral systems: entropy coding combining speed of Huffman coding with compression rate of arithmetic coding*, arXiv:1311.2540, 2013. Underpinning of zstd's entropy stage; informs future backend choices.
* Larsson, N.J. & Moffat, A. — *Off-line dictionary-based compression*, Proc. IEEE 2000. Background for optional Re-Pair-style preprocessing.
* Weyl, H. — *Über die Gleichverteilung von Zahlen mod. Eins*, Math. Ann. 1916. Justifies the low-discrepancy property of φ-stride permutations.

## License

*Copyright (c) 2026 VLABS, LLC. All rights reserved.* <br>
*[VRIL LABS Open Source License v1.0](https://github.com/VRIL-LABS/vril-zip/blob/main/LICENSE) — https://vril.li/license*.

---

<div align="center">
  <sub>Built by <strong>VRIL LABS</strong> · Encrypting the future</sub>
</div>
