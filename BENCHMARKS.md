# VRIL-ZIP Benchmarks

Run: 2026-04-21T07:25:55.406Z  
Node: v24.13.0  
Hardware: see `uname -a` and `/proc/cpuinfo` on the running host

Each row reports compressed size (bytes), ratio (orig÷compressed), compress throughput (MB/s), decompress throughput (MB/s), and round-trip OK.

## lorem 282 KB — 294,000 bytes

| algorithm | compressed | ratio | comp MB/s | decomp MB/s | round-trip |
|---|---:|---:|---:|---:|:---:|
| vril-zip (lvl 9) | 1,287 | 228.44× | 13.0 | 151.0 | ✓ |
| deflate-raw lvl 9 | 1,272 | 231.13× | 214.8 | 352.1 | ✓ |
| gzip lvl 9 | 1,290 | 227.91× | 193.4 | 307.0 | ✓ |
| brotli q11 | 90 | 3266.67× | 13.8 | 197.1 | ✓ |
| brotli q5 | 111 | 2648.65× | 223.1 | 367.7 | ✓ |

## json 5000 records — 618,784 bytes

| algorithm | compressed | ratio | comp MB/s | decomp MB/s | round-trip |
|---|---:|---:|---:|---:|:---:|
| vril-zip (lvl 9) | 69,460 | 8.91× | 3.0 | 11.5 | ✓ |
| deflate-raw lvl 9 | 70,078 | 8.83× | 29.2 | 672.3 | ✓ |
| gzip lvl 9 | 70,096 | 8.83× | 27.2 | 410.3 | ✓ |
| brotli q11 | 35,705 | 17.33× | 0.6 | 274.3 | ✓ |
| brotli q5 | 44,363 | 13.95× | 53.8 | 345.4 | ✓ |

## all-zeros 1 MB — 1,048,576 bytes

| algorithm | compressed | ratio | comp MB/s | decomp MB/s | round-trip |
|---|---:|---:|---:|---:|:---:|
| vril-zip (lvl 9) | 48 | 21845.33× | 18.8 | 15.6 | ✓ |
| deflate-raw lvl 9 | 1,033 | 1015.08× | 215.5 | 333.8 | ✓ |
| gzip lvl 9 | 1,051 | 997.69× | 259.5 | 328.9 | ✓ |
| brotli q11 | 14 | 74898.29× | 32.5 | 286.0 | ✓ |
| brotli q5 | 13 | 80659.69× | 511.0 | 353.7 | ✓ |

## random 1 MB (incompressible) — 1,048,576 bytes

| algorithm | compressed | ratio | comp MB/s | decomp MB/s | round-trip |
|---|---:|---:|---:|---:|:---:|
| vril-zip (lvl 9) | 1,048,591 | 1.00× | 6.0 | 320.0 | ✓ |
| deflate-raw lvl 9 | 1,048,896 | 1.00× | 38.6 | 137.3 | ✓ |
| gzip lvl 9 | 1,048,914 | 1.00× | 40.0 | 844.3 | ✓ |
| brotli q11 | 1,048,581 | 1.00× | 2.2 | 1422.9 | ✓ |
| brotli q5 | 1,048,581 | 1.00× | 194.0 | 2437.3 | ✓ |

## package.json — 585 bytes

| algorithm | compressed | ratio | comp MB/s | decomp MB/s | round-trip |
|---|---:|---:|---:|---:|:---:|
| vril-zip (lvl 9) | 343 | 1.71× | 0.6 | 6.9 | ✓ |
| deflate-raw lvl 9 | 328 | 1.78× | 11.4 | 35.0 | ✓ |
| gzip lvl 9 | 346 | 1.69× | 16.2 | 31.8 | ✓ |
| brotli q11 | 303 | 1.93× | 0.3 | 8.2 | ✓ |
| brotli q5 | 319 | 1.83× | 3.3 | 12.1 | ✓ |

## schauberger.ts — 9,572 bytes

| algorithm | compressed | ratio | comp MB/s | decomp MB/s | round-trip |
|---|---:|---:|---:|---:|:---:|
| vril-zip (lvl 9) | 3,115 | 3.07× | 2.3 | 19.2 | ✓ |
| deflate-raw lvl 9 | 3,100 | 3.09× | 12.4 | 95.0 | ✓ |
| gzip lvl 9 | 3,118 | 3.07× | 30.3 | 47.0 | ✓ |
| brotli q11 | 2,723 | 3.52× | 0.6 | 71.5 | ✓ |
| brotli q5 | 2,985 | 3.21× | 16.6 | 87.3 | ✓ |

---

**Honest interpretation.** VRIL-ZIP wraps Node's `deflate-raw` (zlib level 9) with the Schauberger φ-permutation pre-pass, an adaptive frequency remap, and an adaptive RLE stage. On highly repetitive inputs (all-zeros, structured JSON) the pre-pass has minor positive impact; on incompressible data (random bytes, already-compressed media) the container's store-block fallback prevents bloat. On generic text, brotli-q11 is typically the ratio leader; brotli-q5 is the throughput sweet spot. VRIL-ZIP's value-add is the *self-describing container* (magic, version, CRC, optional CVKDF authentication tag), not raw ratio supremacy. No algorithm in this table can violate Shannon's source coding theorem — and we don't claim to.
