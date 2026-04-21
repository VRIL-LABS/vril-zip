// VRIL-ZIP benchmark vs Node built-in compressors on synthetic +
// real fixtures. Outputs a markdown table to stdout and writes
// `BENCHMARKS.md` next to the bench script.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import {
  brotliCompressSync,
  brotliDecompressSync,
  deflateRawSync,
  inflateRawSync,
  gzipSync,
  gunzipSync,
  constants,
} from "node:zlib";

import { compress as vrilCompress, decompress as vrilDecompress } from "../src/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../../..");

interface Fixture {
  name: string;
  data: Uint8Array;
}

function loadOrSynth(name: string, path: string, fallback: () => Uint8Array): Fixture {
  const full = join(ROOT, path);
  if (existsSync(full)) {
    return { name, data: new Uint8Array(readFileSync(full)) };
  }
  return { name: `${name} (synth)`, data: fallback() };
}

function rng(seed: number) {
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

function repeated(byte: number, n: number): Uint8Array {
  const out = new Uint8Array(n);
  out.fill(byte);
  return out;
}

function lorem(): Uint8Array {
  const passage =
    "In any sufficiently advanced civilisation the lossless compression of arbitrary bit strings is bounded below by the Shannon entropy of the source. ";
  return new TextEncoder().encode(passage.repeat(2000));
}

function jsonCorpus(): Uint8Array {
  const arr = Array.from({ length: 5000 }, (_, i) => ({
    id: i,
    name: `record-${i}`,
    tags: ["alpha", "beta", "gamma", "delta"].slice(0, (i % 4) + 1),
    payload: { kind: "vril", value: i * 1.618 },
    ts: 1_700_000_000 + i,
  }));
  return new TextEncoder().encode(JSON.stringify(arr));
}

function timed<T>(fn: () => T): { value: T; ms: number } {
  const start = performance.now();
  const value = fn();
  const ms = performance.now() - start;
  return { value, ms };
}

interface Result {
  name: string;
  fixture: string;
  size: number;
  ratio: number;
  cMBps: number;
  dMBps: number;
  ok: boolean;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const ALGS: Array<{
  name: string;
  compress: (d: Uint8Array) => Uint8Array;
  decompress: (d: Uint8Array) => Uint8Array;
}> = [
  {
    name: "vril-zip (lvl 9)",
    compress: (d) => vrilCompress(d, { level: 9 }),
    decompress: (d) => vrilDecompress(d),
  },
  {
    name: "deflate-raw lvl 9",
    compress: (d) => new Uint8Array(deflateRawSync(d, { level: 9 })),
    decompress: (d) => new Uint8Array(inflateRawSync(d)),
  },
  {
    name: "gzip lvl 9",
    compress: (d) => new Uint8Array(gzipSync(d, { level: 9 })),
    decompress: (d) => new Uint8Array(gunzipSync(d)),
  },
  {
    name: "brotli q11",
    compress: (d) =>
      new Uint8Array(
        brotliCompressSync(d, {
          params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
        }),
      ),
    decompress: (d) => new Uint8Array(brotliDecompressSync(d)),
  },
  {
    name: "brotli q5",
    compress: (d) =>
      new Uint8Array(
        brotliCompressSync(d, {
          params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
        }),
      ),
    decompress: (d) => new Uint8Array(brotliDecompressSync(d)),
  },
];

const fixtures: Fixture[] = [
  { name: "lorem 282 KB", data: lorem() },
  { name: "json 5000 records", data: jsonCorpus() },
  { name: "all-zeros 1 MB", data: repeated(0x00, 1024 * 1024) },
  { name: "random 1 MB (incompressible)", data: randomBytes(1024 * 1024, 12345) },
  loadOrSynth("package.json", "package.json", () => new TextEncoder().encode("{}")),
  loadOrSynth(
    "schauberger.ts",
    "lib/vril-zip/src/schauberger.ts",
    () => new TextEncoder().encode("// fallback"),
  ),
];

const results: Result[] = [];

for (const fx of fixtures) {
  for (const alg of ALGS) {
    try {
      const c = timed(() => alg.compress(fx.data));
      const d = timed(() => alg.decompress(c.value));
      const ok = bytesEqual(d.value, fx.data);
      const mb = fx.data.length / (1024 * 1024);
      results.push({
        name: alg.name,
        fixture: fx.name,
        size: c.value.length,
        ratio: fx.data.length / Math.max(c.value.length, 1),
        cMBps: mb / (c.ms / 1000),
        dMBps: mb / (d.ms / 1000),
        ok,
      });
    } catch (e) {
      results.push({
        name: alg.name,
        fixture: fx.name,
        size: 0,
        ratio: 0,
        cMBps: 0,
        dMBps: 0,
        ok: false,
      });
    }
  }
}

// Build a markdown table grouped by fixture
let md = "# VRIL-ZIP Benchmarks\n\n";
md += `Run: ${new Date().toISOString()}  \n`;
md += `Node: ${process.version}  \n`;
md += `Hardware: see \`uname -a\` and \`/proc/cpuinfo\` on the running host\n\n`;
md += "Each row reports compressed size (bytes), ratio (orig÷compressed), ";
md += "compress throughput (MB/s), decompress throughput (MB/s), and round-trip OK.\n\n";

const byFx = new Map<string, Result[]>();
for (const r of results) {
  if (!byFx.has(r.fixture)) byFx.set(r.fixture, []);
  byFx.get(r.fixture)!.push(r);
}

for (const [fx, rows] of byFx) {
  const fixture = fixtures.find((f) => f.name === fx)!;
  md += `## ${fx} — ${fixture.data.length.toLocaleString()} bytes\n\n`;
  md += "| algorithm | compressed | ratio | comp MB/s | decomp MB/s | round-trip |\n";
  md += "|---|---:|---:|---:|---:|:---:|\n";
  for (const r of rows) {
    md += `| ${r.name} | ${r.size.toLocaleString()} | ${r.ratio.toFixed(2)}× | ${r.cMBps.toFixed(1)} | ${r.dMBps.toFixed(1)} | ${r.ok ? "✓" : "✗"} |\n`;
  }
  md += "\n";
}

md += "---\n\n";
md +=
  "**Honest interpretation.** VRIL-ZIP wraps Node's `deflate-raw` (zlib level 9) ";
md +=
  "with the Schauberger φ-permutation pre-pass, an adaptive frequency remap, and an ";
md +=
  "adaptive RLE stage. On highly repetitive inputs (all-zeros, structured JSON) the ";
md +=
  "pre-pass has minor positive impact; on incompressible data (random bytes, already-";
md +=
  "compressed media) the container's store-block fallback prevents bloat. On generic ";
md +=
  "text, brotli-q11 is typically the ratio leader; brotli-q5 is the throughput sweet spot. ";
md +=
  "VRIL-ZIP's value-add is the *self-describing container* (magic, version, CRC, optional ";
md +=
  "CVKDF authentication tag), not raw ratio supremacy. No algorithm in this table can ";
md += "violate Shannon's source coding theorem — and we don't claim to.\n";

console.log(md);

const outPath = join(__dirname, "../BENCHMARKS.md");
writeFileSync(outPath, md);
console.error(`\n→ wrote ${outPath}`);
