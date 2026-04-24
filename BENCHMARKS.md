# VRIL-ZIP v2 — Comprehensive Benchmark Results

Generated: 2026-04-23T13:47:39.532Z
Node.js: v24.14.1
Timeout per benchmark: 30s
VRZ2 backend: deflate-raw, level 9
Test files: 12

## Test Files

| File | Description | Size |
|------|-------------|------|
| text-lorem.txt | 100KB lorem ipsum text | 100,000 bytes |
| data-json.json | 100KB structured JSON data | 100,000 bytes |
| data-csv.csv | 50KB CSV data | 50,000 bytes |
| data-xml.xml | 50KB XML data | 50,000 bytes |
| code-source.js | 50KB JavaScript source | 50,000 bytes |
| binary-zeros.bin | 100KB all zeros | 100,000 bytes |
| binary-random.bin | 100KB random bytes | 100,000 bytes |
| binary-pattern.bin | 100KB structured binary pattern | 100,000 bytes |
| image-raw.ppm | 256x256 PPM gradient image | 196,623 bytes |
| audio-sine.wav | 1s 8kHz PCM sine wave WAV | 16,044 bytes |
| archive-copy.zip | Small gzip-compressed archive | 50,033 bytes |
| mixed-exec.bin | 100KB executable-like binary | 100,000 bytes |

---

## Per-File Results

### text-lorem.txt — 100KB lorem ipsum text
Original size: **100,000 bytes**

| Rank | Algorithm | Compressed | Ratio | Compress (ms) | Decompress (ms) | Round-trip |
|------|-----------|------------|-------|---------------|-----------------|------------|
| 1 | VRZ2 (deflate-raw L9) | 19,472 | 5.14x | 360.2 | 20.8 | YES |
| 2 | brotli Q11 | 21,768 | 4.59x | 175.0 | 0.4 | YES |
| 3 | deflate-raw L9 | 24,837 | 4.03x | 15.6 | 3.5 | YES |
| 4 | gzip L9 | 24,855 | 4.02x | 10.8 | 3.1 | YES |
| 5 | brotli Q5 | 26,014 | 3.84x | 4.8 | 0.5 | YES |

### data-json.json — 100KB structured JSON data
Original size: **100,000 bytes**

| Rank | Algorithm | Compressed | Ratio | Compress (ms) | Decompress (ms) | Round-trip |
|------|-----------|------------|-------|---------------|-----------------|------------|
| 1 | brotli Q11 | 5,706 | 17.53x | 151.7 | 0.5 | YES |
| 2 | VRZ2 (deflate-raw L9) | 6,884 | 14.53x | 266.1 | 7.2 | YES |
| 3 | brotli Q5 | 7,434 | 13.45x | 5.6 | 0.3 | YES |
| 4 | deflate-raw L9 | 10,033 | 9.97x | 13.5 | 5.7 | YES |
| 5 | gzip L9 | 10,051 | 9.95x | 7.8 | 3.1 | YES |

### data-csv.csv — 50KB CSV data
Original size: **50,000 bytes**

| Rank | Algorithm | Compressed | Ratio | Compress (ms) | Decompress (ms) | Round-trip |
|------|-----------|------------|-------|---------------|-----------------|------------|
| 1 | brotli Q11 | 7,588 | 6.59x | 101.2 | 0.5 | YES |
| 2 | VRZ2 (deflate-raw L9) | 9,371 | 5.34x | 93.0 | 8.1 | YES |
| 3 | brotli Q5 | 9,636 | 5.19x | 1.8 | 0.4 | YES |
| 4 | deflate-raw L9 | 12,538 | 3.99x | 8.2 | 2.9 | YES |
| 5 | gzip L9 | 12,556 | 3.98x | 11.6 | 2.5 | YES |

### data-xml.xml — 50KB XML data
Original size: **50,000 bytes**

| Rank | Algorithm | Compressed | Ratio | Compress (ms) | Decompress (ms) | Round-trip |
|------|-----------|------------|-------|---------------|-----------------|------------|
| 1 | brotli Q11 | 2,852 | 17.53x | 84.3 | 0.2 | YES |
| 2 | VRZ2 (deflate-raw L9) | 3,231 | 15.48x | 185.4 | 11.7 | YES |
| 3 | brotli Q5 | 3,655 | 13.68x | 1.9 | 0.2 | YES |
| 4 | deflate-raw L9 | 5,799 | 8.62x | 7.1 | 2.7 | YES |
| 5 | gzip L9 | 5,817 | 8.60x | 6.8 | 1.7 | YES |

### code-source.js — 50KB JavaScript source
Original size: **50,000 bytes**

| Rank | Algorithm | Compressed | Ratio | Compress (ms) | Decompress (ms) | Round-trip |
|------|-----------|------------|-------|---------------|-----------------|------------|
| 1 | brotli Q11 | 3,044 | 16.43x | 59.1 | 0.2 | YES |
| 2 | VRZ2 (deflate-raw L9) | 3,242 | 15.42x | 192.9 | 10.6 | YES |
| 3 | deflate-raw L9 | 3,445 | 14.51x | 4.0 | 1.5 | YES |
| 4 | gzip L9 | 3,463 | 14.44x | 4.8 | 1.5 | YES |
| 5 | brotli Q5 | 3,526 | 14.18x | 1.1 | 0.2 | YES |

### binary-zeros.bin — 100KB all zeros
Original size: **100,000 bytes**

| Rank | Algorithm | Compressed | Ratio | Compress (ms) | Decompress (ms) | Round-trip |
|------|-----------|------------|-------|---------------|-----------------|------------|
| 1 | brotli Q5 | 13 | 7692.31x | 1.0 | 0.3 | YES |
| 2 | brotli Q11 | 14 | 7142.86x | 10.7 | 0.3 | YES |
| 3 | deflate-raw L9 | 113 | 884.96x | 5.4 | 2.0 | YES |
| 4 | gzip L9 | 131 | 763.36x | 4.6 | 2.0 | YES |
| - | VRZ2 (deflate-raw L9) *(timeout)* | TIMEOUT | 0.000 | - | - | NO |

### binary-random.bin — 100KB random bytes
Original size: **100,000 bytes**

| Rank | Algorithm | Compressed | Ratio | Compress (ms) | Decompress (ms) | Round-trip |
|------|-----------|------------|-------|---------------|-----------------|------------|
| 1 | brotli Q11 | 100,005 | 1.000 | 21.0 | 0.2 | YES |
| 2 | brotli Q5 | 100,005 | 1.000 | 4.6 | 0.2 | YES |
| 3 | VRZ2 (deflate-raw L9) | 100,015 | 1.000 | 45.1 | 1.0 | YES |
| 4 | deflate-raw L9 | 100,025 | 1.000 | 9.6 | 0.4 | YES |
| 5 | gzip L9 | 100,043 | 1.000 | 10.7 | 0.3 | YES |

### binary-pattern.bin — 100KB structured binary pattern
Original size: **100,000 bytes**

| Rank | Algorithm | Compressed | Ratio | Compress (ms) | Decompress (ms) | Round-trip |
|------|-----------|------------|-------|---------------|-----------------|------------|
| 1 | brotli Q11 | 78,061 | 1.28x | 341.1 | 0.8 | YES |
| 2 | brotli Q5 | 78,832 | 1.27x | 3.0 | 0.5 | YES |
| 3 | deflate-raw L9 | 83,672 | 1.20x | 19.5 | 3.9 | YES |
| 4 | VRZ2 (deflate-raw L9) | 83,687 | 1.19x | 63.3 | 5.0 | YES |
| 5 | gzip L9 | 83,690 | 1.19x | 21.7 | 3.9 | YES |

### image-raw.ppm — 256x256 PPM gradient image
Original size: **196,623 bytes**

| Rank | Algorithm | Compressed | Ratio | Compress (ms) | Decompress (ms) | Round-trip |
|------|-----------|------------|-------|---------------|-----------------|------------|
| 1 | VRZ2 (deflate-raw L9) | 687 | 286.21x | 142.9 | 19.4 | YES |
| 2 | deflate-raw L9 | 188,902 | 1.04x | 15.2 | 7.7 | YES |
| 3 | gzip L9 | 188,920 | 1.04x | 14.2 | 6.6 | YES |
| 4 | brotli Q11 | 196,628 | 1.000 | 90.2 | 0.2 | YES |
| 5 | brotli Q5 | 196,628 | 1.000 | 1.6 | 0.2 | YES |

### audio-sine.wav — 1s 8kHz PCM sine wave WAV
Original size: **16,044 bytes**

| Rank | Algorithm | Compressed | Ratio | Compress (ms) | Decompress (ms) | Round-trip |
|------|-----------|------------|-------|---------------|-----------------|------------|
| 1 | brotli Q5 | 467 | 34.36x | 0.7 | 0.1 | YES |
| 2 | brotli Q11 | 475 | 33.78x | 2.5 | 0.3 | YES |
| 3 | deflate-raw L9 | 572 | 28.05x | 2.5 | 0.8 | YES |
| 4 | VRZ2 (deflate-raw L9) | 587 | 27.33x | 718.8 | 1.3 | YES |
| 5 | gzip L9 | 590 | 27.19x | 3.6 | 0.8 | YES |

### archive-copy.zip — Small gzip-compressed archive
Original size: **50,033 bytes**

| Rank | Algorithm | Compressed | Ratio | Compress (ms) | Decompress (ms) | Round-trip |
|------|-----------|------------|-------|---------------|-----------------|------------|
| 1 | brotli Q11 | 50,037 | 1.000 | 11.0 | 0.1 | YES |
| 2 | brotli Q5 | 50,037 | 1.000 | 0.8 | 0.2 | YES |
| 3 | VRZ2 (deflate-raw L9) | 50,048 | 1.000 | 36.7 | 1.0 | YES |
| 4 | deflate-raw L9 | 50,048 | 1.000 | 6.8 | 0.3 | YES |
| 5 | gzip L9 | 50,066 | 0.999 | 7.9 | 0.3 | YES |

### mixed-exec.bin — 100KB executable-like binary
Original size: **100,000 bytes**

| Rank | Algorithm | Compressed | Ratio | Compress (ms) | Decompress (ms) | Round-trip |
|------|-----------|------------|-------|---------------|-----------------|------------|
| 1 | brotli Q11 | 63,424 | 1.58x | 118.2 | 1.2 | YES |
| 2 | brotli Q5 | 66,746 | 1.50x | 2.5 | 1.0 | YES |
| 3 | VRZ2 (deflate-raw L9) | 71,806 | 1.39x | 231.3 | 16.0 | YES |
| 4 | deflate-raw L9 | 71,921 | 1.39x | 16.1 | 4.3 | YES |
| 5 | gzip L9 | 71,939 | 1.39x | 16.6 | 4.0 | YES |

---

## Summary Comparison

| File | Size | Best Algorithm | Best Ratio | VRZ2 Ratio | VRZ2 vs Best | All Round-trips |
|------|------|---------------|------------|------------|--------------|-----------------|
| text-lorem.txt | 100,000 | VRZ2 (deflate-raw L9) | 5.14x | 5.14x | 0.0% smaller | YES |
| data-json.json | 100,000 | brotli Q11 | 17.53x | 14.53x | +20.6% larger | YES |
| data-csv.csv | 50,000 | brotli Q11 | 6.59x | 5.34x | +23.5% larger | YES |
| data-xml.xml | 50,000 | brotli Q11 | 17.53x | 15.48x | +13.3% larger | YES |
| code-source.js | 50,000 | brotli Q11 | 16.43x | 15.42x | +6.5% larger | YES |
| binary-zeros.bin | 100,000 | brotli Q5 | 7692.31x | 0.000 | N/A | YES |
| binary-random.bin | 100,000 | brotli Q11 | 1.000 | 1.000 | +0.0% larger | YES |
| binary-pattern.bin | 100,000 | brotli Q11 | 1.28x | 1.19x | +7.2% larger | YES |
| image-raw.ppm | 196,623 | VRZ2 (deflate-raw L9) | 286.21x | 286.21x | 0.0% smaller | YES |
| audio-sine.wav | 16,044 | brotli Q5 | 34.36x | 27.33x | +25.7% larger | YES |
| archive-copy.zip | 50,033 | brotli Q11 | 1.000 | 1.000 | +0.0% larger | YES |
| mixed-exec.bin | 100,000 | brotli Q11 | 1.58x | 1.39x | +13.2% larger | YES |

### Aggregate Totals

| Algorithm | Total Compressed | Overall Ratio |
|-----------|-----------------|---------------|
| VRZ2 (deflate-raw L9) | 349,030 bytes | 2.90x |
| brotli Q11 | 529,602 bytes | 1.91x |
| brotli Q5 | 542,993 bytes | 1.87x |
| deflate-raw L9 | 551,905 bytes | 1.83x |
| gzip L9 | 552,121 bytes | 1.83x |

---

*Benchmark script: `benchmark-final.mjs`*
