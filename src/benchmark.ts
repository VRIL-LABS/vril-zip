// VRIL-ZIP v2 Benchmark Harness
//
// Compares VRIL-ZIP v2 against raw entropy backends:
//   - deflate-raw level 9 (fflate)
//   - gzip level 9 (fflate)
//   - brotli quality 11 (node:zlib)
//   - brotli quality 5 (node:zlib)
//
// On synthetic test files:
//   - Lorem ipsum text
//   - JSON data
//   - All-zeros
//   - Random bytes
//   - Source code (simulated)
//   - Binary data
//   - CSV data
//   - Structured/periodic data

import * as fflate from "fflate";
import {
  brotliCompressSync,
  brotliDecompressSync,
  constants as zlibConstants,
} from "node:zlib";
import { pack, unpack, MAGIC_BYTES, CONTAINER_VERSION } from "./container.js";
import type { EntropyBackend } from "./transformer.js";

const BROTLI_PARAM_QUALITY = zlibConstants.BROTLI_PARAM_QUALITY;

// ─────────────────────────────────────────────────────────────
// Test data generators
// ─────────────────────────────────────────────────────────────

function generateLoremText(size: number): Uint8Array {
  const words = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
    "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore",
    "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam",
    "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
    "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in",
    "reprehenderit", "voluptate", "velit", "esse", "cillum", "fugiat", "nulla",
    "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
    "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
    "est", "laborum", "the", "quick", "brown", "fox", "jumps", "over",
    "lazy", "dog", "pack", "my", "box", "with", "five", "dozen", "liquor",
    "jugs", "jackdaws", "love", "my", "big", "sphinx", "of", "quartz",
    "how", "vexingly", "daft", "zebras", "quiz", "two", "driven", "jocks",
    "help", "fax", "my", "quiz", "bug", "type", "function", "return",
    "const", "let", "var", "for", "while", "if", "else", "class", "import",
    "export", "default", "async", "await", "try", "catch", "throw", "new",
  ];
  const text: string[] = [];
  let len = 0;
  while (len < size) {
    const word = words[Math.floor(Math.random() * words.length)];
    text.push(word);
    len += word.length + 1;
  }
  return new TextEncoder().encode(text.join(" ").slice(0, size));
}

function generateJson(size: number): Uint8Array {
  const entries: string[] = [];
  let len = 0;
  let i = 0;
  entries.push('{\n  "items": [');
  len += 14;
  while (len < size - 10) {
    const entry =
      `    {"id": ${i}, "name": "item_${i}", "value": ${Math.random() * 1000 | 0}, ` +
      `"active": ${Math.random() > 0.5}, "tags": ["tag${i % 5}", "tag${(i + 1) % 5}"]}`;
    entries.push(entry);
    len += entry.length + 2;
    i++;
  }
  entries.push("  ]\n}");
  return new TextEncoder().encode(entries.join(",\n").slice(0, size));
}

function generateZeros(size: number): Uint8Array {
  return new Uint8Array(size);
}

function generateRandom(size: number): Uint8Array {
  const data = new Uint8Array(size);
  crypto.getRandomValues(data);
  return data;
}

function generateSourceCode(size: number): Uint8Array {
  const lines = [
    'import { compress, decompress } from \'./vril-zip\';',
    'import { crc32 } from \'./crc32\';',
    '',
    'interface Options {',
    '  level?: number;',
    '  backend?: \'deflate\' | \'brotli\' | \'gzip\';',
    '}',
    '',
    'export function processData(input: Uint8Array, opts?: Options): Uint8Array {',
    '  const level = opts?.level ?? 9;',
    '  const compressed = compress(input, { level });',
    '  console.log(`Compressed ${input.length} -> ${compressed.length}`);',
    '  const checksum = crc32(input);',
    '  if (checksum !== crc32(decompress(compressed))) {',
    '    throw new Error(\'Roundtrip checksum mismatch!\');',
    '  }',
    '  return compressed;',
    '}',
    '',
    '// Utility functions',
    'function padTo(n: number, width: number): string {',
    '  return n.toString().padStart(width, \'0\');',
    '}',
    '',
    'async function* readChunks(stream: ReadableStream<Uint8Array>) {',
    '  const reader = stream.getReader();',
    '  try {',
    '    while (true) {',
    '      const { done, value } = await reader.read();',
    '      if (done) break;',
    '      yield value;',
    '    }',
    '  } finally {',
    '    reader.releaseLock();',
    '  }',
    '}',
    '',
    'type Result<T> = { ok: true; value: T } | { ok: false; error: Error };',
    '',
    'function wrap<T>(fn: () => T): Result<T> {',
    '  try {',
    '    return { ok: true, value: fn() };',
    '  } catch (e) {',
    '    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };',
    '  }',
    '}',
  ];
  const text: string[] = [];
  let len = 0;
  while (len < size) {
    const line = lines[Math.floor(Math.random() * lines.length)];
    text.push(line);
    len += line.length + 1;
  }
  return new TextEncoder().encode(text.join("\n").slice(0, size));
}

function generateBinary(size: number): Uint8Array {
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    switch (i % 16) {
      case 0: data[i] = 0xDE; break;
      case 1: data[i] = 0xAD; break;
      case 2: data[i] = 0xBE; break;
      case 3: data[i] = 0xEF; break;
      default: data[i] = (Math.random() * 256) | 0; break;
    }
  }
  return data;
}

function generateCsv(size: number): Uint8Array {
  const lines: string[] = [];
  let len = 0;
  lines.push("id,name,value,active,created");
  len += 37;
  let i = 0;
  while (len < size - 5) {
    const line = `${i},"user_${i}",${(Math.random() * 10000) | 0},${Math.random() > 0.5},"2024-01-${String((i % 28) + 1).padStart(2, "0")}"`;
    lines.push(line);
    len += line.length + 1;
    i++;
  }
  return new TextEncoder().encode(lines.join("\n").slice(0, size));
}

function generateStructured(size: number): Uint8Array {
  // Periodic data with small variations (like sensor readings)
  const data = new Uint8Array(size);
  const period = 16;
  for (let i = 0; i < size; i++) {
    const base = (i % period) * 16;
    const noise = (Math.random() * 4 - 2) | 0;
    data[i] = Math.max(0, Math.min(255, base + noise));
  }
  return data;
}

// ─────────────────────────────────────────────────────────────
// Backend benchmarks
// ─────────────────────────────────────────────────────────────

export interface BenchmarkResult {
  algorithm: string;
  compressedSize: number;
  ratio: number;       // input/output (higher = better compression)
  compressMs: number;
  decompressMs: number;
  roundTripOk: boolean;
}

function benchDeflateRaw9(data: Uint8Array): BenchmarkResult {
  const t0 = performance.now();
  const comp = fflate.deflateSync(data, { level: 9, raw: true } as fflate.DeflateOptions);
  const t1 = performance.now();
  const decomp = fflate.inflateSync(comp, { raw: true } as fflate.InflateOptions);
  const t2 = performance.now();
  const roundTripOk = arraysEqual(data, decomp);
  const ratio = data.length / Math.max(1, comp.length);
  return {
    algorithm: "deflate-raw L9",
    compressedSize: comp.length,
    ratio,
    compressMs: t1 - t0,
    decompressMs: t2 - t1,
    roundTripOk,
  };
}

function benchGzip9(data: Uint8Array): BenchmarkResult {
  const t0 = performance.now();
  const comp = fflate.gzipSync(data, { level: 9 });
  const t1 = performance.now();
  const decomp = fflate.gunzipSync(comp);
  const t2 = performance.now();
  const roundTripOk = arraysEqual(data, decomp);
  const ratio = data.length / Math.max(1, comp.length);
  return {
    algorithm: "gzip L9",
    compressedSize: comp.length,
    ratio,
    compressMs: t1 - t0,
    decompressMs: t2 - t1,
    roundTripOk,
  };
}

function benchBrotli11(data: Uint8Array): BenchmarkResult {
  const t0 = performance.now();
  const comp = new Uint8Array(brotliCompressSync(data, {
    params: { [BROTLI_PARAM_QUALITY]: 11 },
  }));
  const t1 = performance.now();
  const decomp = new Uint8Array(brotliDecompressSync(comp));
  const t2 = performance.now();
  const roundTripOk = arraysEqual(data, decomp);
  const ratio = data.length / Math.max(1, comp.length);
  return {
    algorithm: "brotli Q11",
    compressedSize: comp.length,
    ratio,
    compressMs: t1 - t0,
    decompressMs: t2 - t1,
    roundTripOk,
  };
}

function benchBrotli5(data: Uint8Array): BenchmarkResult {
  const t0 = performance.now();
  const comp = new Uint8Array(brotliCompressSync(data, {
    params: { [BROTLI_PARAM_QUALITY]: 5 },
  }));
  const t1 = performance.now();
  const decomp = new Uint8Array(brotliDecompressSync(comp));
  const t2 = performance.now();
  const roundTripOk = arraysEqual(data, decomp);
  const ratio = data.length / Math.max(1, comp.length);
  return {
    algorithm: "brotli Q5",
    compressedSize: comp.length,
    ratio,
    compressMs: t1 - t0,
    decompressMs: t2 - t1,
    roundTripOk,
  };
}

function benchVrilZipV2(data: Uint8Array, backend?: EntropyBackend | "auto"): BenchmarkResult {
  const label = backend === "auto" ? "auto" : backend!;
  const t0 = performance.now();
  const comp = pack(data, { level: 9, backend: backend ?? "auto" });
  const t1 = performance.now();
  const decomp = unpack(comp);
  const t2 = performance.now();
  const roundTripOk = arraysEqual(data, decomp);
  const ratio = data.length / Math.max(1, comp.length);
  return {
    algorithm: `VRZ2 (${label})`,
    compressedSize: comp.length,
    ratio,
    compressMs: t1 - t0,
    decompressMs: t2 - t1,
    roundTripOk,
  };
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// Main benchmark runner
// ─────────────────────────────────────────────────────────────

interface TestFile {
  name: string;
  data: Uint8Array;
}

export function runBenchmark(
  fileSize: number = 100_000,
  customFiles?: TestFile[]
): BenchmarkResult[][] {
  console.log("═".repeat(90));
  console.log("  VRIL-ZIP v2 Universal Transformer Edition — Benchmark");
  console.log(`  Magic: ${new TextDecoder().decode(MAGIC_BYTES)} | Version: ${CONTAINER_VERSION}`);
  console.log(`  Test file size: ${fileSize.toLocaleString()} bytes`);
  console.log("═".repeat(90));

  const testFiles: TestFile[] = customFiles ?? [
    { name: "Lorem text", data: generateLoremText(fileSize) },
    { name: "JSON", data: generateJson(fileSize) },
    { name: "All zeros", data: generateZeros(fileSize) },
    { name: "Random bytes", data: generateRandom(fileSize) },
    { name: "Source code", data: generateSourceCode(fileSize) },
    { name: "Binary mixed", data: generateBinary(fileSize) },
    { name: "CSV", data: generateCsv(fileSize) },
    { name: "Structured", data: generateStructured(fileSize) },
  ];

  const allResults: BenchmarkResult[][] = [];

  for (const file of testFiles) {
    console.log(`\n── ${file.name} (${file.data.length.toLocaleString()} bytes) ──`);

    const results: BenchmarkResult[] = [];

    try { results.push(benchDeflateRaw9(file.data)); } catch (e) {
      console.log(`  [ERROR] deflate-raw: ${(e as Error).message}`);
    }
    try { results.push(benchGzip9(file.data)); } catch (e) {
      console.log(`  [ERROR] gzip: ${(e as Error).message}`);
    }
    try { results.push(benchBrotli11(file.data)); } catch (e) {
      console.log(`  [ERROR] brotli-11: ${(e as Error).message}`);
    }
    try { results.push(benchBrotli5(file.data)); } catch (e) {
      console.log(`  [ERROR] brotli-5: ${(e as Error).message}`);
    }
    try { results.push(benchVrilZipV2(file.data, "auto")); } catch (e) {
      console.log(`  [ERROR] VRZ2: ${(e as Error).message}`);
    }

    // Sort by ratio descending (best compression first)
    results.sort((a, b) => b.ratio - a.ratio);

    console.log(
      "  " +
      "Algorithm".padEnd(22) +
      "Compressed".padStart(12) +
      "Ratio".padStart(10) +
      "C(ms)".padStart(10) +
      "D(ms)".padStart(10) +
      "OK".padStart(5)
    );
    console.log("  " + "─".repeat(65));

    for (const r of results) {
      const ratioStr = r.ratio > 1 ? r.ratio.toFixed(2) + "x" : (r.ratio).toFixed(3);
      console.log(
        "  " +
        r.algorithm.padEnd(22) +
        r.compressedSize.toLocaleString().padStart(12) +
        ratioStr.padStart(10) +
        r.compressMs.toFixed(1).padStart(10) +
        r.decompressMs.toFixed(1).padStart(10) +
        (r.roundTripOk ? "✓" : "✗").padStart(5)
      );
    }

    allResults.push(results);
  }

  // Summary table
  console.log("\n" + "═".repeat(90));
  console.log("  SUMMARY — Best compression ratio per file");
  console.log("═".repeat(90));
  console.log(
    "  " +
    "File".padEnd(16) +
    "Best Algorithm".padEnd(22) +
    "Ratio".padStart(10) +
    "VRZ2 Ratio".padStart(12)
  );
  console.log("  " + "─".repeat(58));

  for (let i = 0; i < testFiles.length; i++) {
    const results = allResults[i];
    if (!results || results.length === 0) continue;
    const best = results[0]; // sorted by ratio descending
    const vrz2 = results.find((r) => r.algorithm.startsWith("VRZ2"));
    console.log(
      "  " +
      testFiles[i].name.padEnd(16) +
      best.algorithm.padEnd(22) +
      best.ratio.toFixed(2).padStart(10) +
      (vrz2 ? vrz2.ratio.toFixed(2).padStart(12) : "N/A".padStart(12))
    );
  }

  // Verify all roundtrips
  const allOk = allResults.every((results) =>
    results.every((r) => r.roundTripOk)
  );
  console.log(`\n  All roundtrip verifications: ${allOk ? "✓ PASSED" : "✗ FAILED"}`);
  console.log("═".repeat(90));

  return allResults;
}

/**
 * Format benchmark results as a compact table string.
 */
export function formatBenchmarkTable(allResults: BenchmarkResult[][]): string {
  const lines: string[] = [];
  for (let i = 0; i < allResults.length; i++) {
    const results = allResults[i];
    if (!results || results.length === 0) continue;
    lines.push(`File ${i + 1}:`);
    for (const r of results) {
      lines.push(
        `  ${r.algorithm.padEnd(22)} ${r.compressedSize.toLocaleString().padStart(10)} bytes  ${r.ratio.toFixed(3).padStart(8)}x  ${r.compressMs.toFixed(1).padStart(8)}ms  roundtrip=${r.roundTripOk}`
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

// Run when executed directly
const isMain =
  process.argv[1]?.endsWith("benchmark.js") ||
  process.argv[1]?.endsWith("benchmark.ts");
if (isMain) {
  const sizeArg = process.argv[2];
  const size = sizeArg ? parseInt(sizeArg, 10) : 100_000;
  runBenchmark(isNaN(size) ? 100_000 : size);
}
