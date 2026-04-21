import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { compress, decompress, ChecksumMismatchError, InvalidMagicError } from "../src/index.ts";
import { __test } from "../src/schauberger.ts";

function rng(seed: number) {
  // Mulberry32 PRNG — deterministic, good distribution for fixtures
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBytes(n: number, seed: number): Uint8Array {
  const r = rng(seed);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = (r() * 256) | 0;
  return out;
}

function repeat(byte: number, n: number): Uint8Array {
  const out = new Uint8Array(n);
  out.fill(byte);
  return out;
}

function asciiText(): Uint8Array {
  const passage = `
  In any sufficiently advanced civilisation the lossless compression of
  arbitrary bit strings is bounded below by the Shannon entropy of the
  source. No algorithm can do better in expectation; counting arguments
  forbid even a single bit of universal improvement.  The art is in
  approaching that floor on real-world distributions, not in violating
  it.  VRIL-ZIP makes no claim of violation; it claims only an honest
  φ-permutation pre-pass that improves LZ77 match locality on certain
  structured payloads, plus a CRC-protected, version-tagged container.
  `.repeat(64);
  return new TextEncoder().encode(passage);
}

function jsonish(): Uint8Array {
  const obj = {
    items: Array.from({ length: 200 }, (_, i) => ({
      id: i,
      name: `item-${i}`,
      tags: ["alpha", "beta", "gamma"].slice(0, (i % 3) + 1),
      payload: { kind: "vril", value: i * 1.618033988749895 },
    })),
  };
  return new TextEncoder().encode(JSON.stringify(obj));
}

const FIXTURES: Array<[string, Uint8Array]> = [
  ["empty", new Uint8Array(0)],
  ["one-byte", new Uint8Array([42])],
  ["two-bytes", new Uint8Array([0, 0xff])],
  ["all-zeros-1k", repeat(0x00, 1024)],
  ["all-zeros-1m", repeat(0x00, 1024 * 1024)],
  ["all-ff-1k", repeat(0xff, 1024)],
  ["all-ff-1m", repeat(0xff, 1024 * 1024)],
  ["alternating", Uint8Array.from({ length: 4096 }, (_, i) => i & 1 ? 0xff : 0x00)],
  ["ramp-256", Uint8Array.from({ length: 256 }, (_, i) => i)],
  ["ascii-text", asciiText()],
  ["jsonish", jsonish()],
  ["random-1k", randomBytes(1024, 1)],
  ["random-64k", randomBytes(64 * 1024, 2)],
  ["random-1m", randomBytes(1024 * 1024, 3)],
  ["mixed-low-entropy", concat([asciiText(), repeat(0xab, 256), randomBytes(512, 4)])],
];

function concat(parts: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

for (const [name, data] of FIXTURES) {
  test(`round-trip: ${name} (${data.length} bytes)`, () => {
    const packed = compress(data);
    const back = decompress(packed);
    assert.equal(back.length, data.length, "length mismatch");
    assert.ok(bytesEqual(back, data), `byte content mismatch for ${name}`);
  });
}

// Pull in real project files as additional fixtures
const REAL_FILES = [
  "lib/vril-zip/src/schauberger.ts",
  "lib/vril-zip/src/container.ts",
  "lib/vril-zip/src/cvkdf.ts",
  "package.json",
  "pnpm-workspace.yaml",
];
for (const rel of REAL_FILES) {
  test(`round-trip: real file ${rel}`, () => {
    const root = process.cwd();
    let path = join(root, rel);
    let data: Uint8Array;
    try {
      data = new Uint8Array(readFileSync(path));
    } catch {
      // running from lib/vril-zip — try going up
      path = join(root, "../..", rel);
      data = new Uint8Array(readFileSync(path));
    }
    const packed = compress(data);
    const back = decompress(packed);
    assert.ok(bytesEqual(back, data), `mismatch on ${rel}`);
  });
}

// Property tests: random sizes & seeds
test("property: 64 random fixtures of varying size round-trip", () => {
  const r = rng(0xdeadbeef);
  for (let k = 0; k < 64; k++) {
    const size = Math.floor(r() * 8192);
    const data = randomBytes(size, k * 1009 + 17);
    const packed = compress(data);
    const back = decompress(packed);
    assert.ok(bytesEqual(back, data), `random fixture ${k} (size=${size}) mismatch`);
  }
});

// Container integrity tests
test("integrity: corrupted CRC throws ChecksumMismatchError", () => {
  const data = new TextEncoder().encode("hello vril");
  const packed = compress(data);
  // Flip a bit in the CRC32 footer
  packed[packed.length - 1] ^= 0x01;
  assert.throws(() => decompress(packed), ChecksumMismatchError);
});

test("integrity: bad magic throws InvalidMagicError", () => {
  const packed = compress(new Uint8Array([1, 2, 3]));
  packed[0] = 0xff;
  assert.throws(() => decompress(packed), InvalidMagicError);
});

test("integrity: corrupted payload throws (CRC mismatch or zlib error)", () => {
  const data = randomBytes(2048, 99);
  const packed = compress(data);
  // Flip a bit in the middle of the payload
  packed[packed.length / 2 | 0] ^= 0x80;
  assert.throws(() => decompress(packed));
});

// Inverse tests on individual transforms
test("transform: goldenSpiralReorder is bijective for n in [2, 1000]", () => {
  for (let n = 2; n <= 1000; n++) {
    const data = randomBytes(n, n);
    const fwd = __test.goldenSpiralReorder(data);
    const back = __test.goldenSpiralReorder(fwd, true);
    assert.ok(bytesEqual(back, data), `permutation not bijective at n=${n}`);
  }
});

test("transform: hyperbolicFrequencyRemap round-trips", () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const data = randomBytes(4096, seed);
    const fwd = __test.hyperbolicFrequencyRemap(data);
    const back = __test.hyperbolicFrequencyRemap(fwd, true);
    assert.ok(bytesEqual(back, data));
  }
});

test("transform: centripetalRunLength round-trips with 0xFF literals", () => {
  const data = new Uint8Array([0xff, 0xff, 0xff, 1, 2, 3, 0xff, 0, 0, 0, 0, 0, 5]);
  const fwd = __test.centripetalRunLength(data);
  const back = __test.centripetalRunLengthDecode(fwd);
  assert.ok(bytesEqual(back, data));
});
