#!/usr/bin/env node
// VRIL-ZIP v2 CLI Interface
//
// Usage:
//   vril-zip compress <input> [-o output.vrz2] [--level 1-9] [--backend auto|deflate|brotli|gzip] [--auth]
//   vril-zip decompress <input.vrz2> [-o output] [--key <hex>]
//   vril-zip benchmark [--size <bytes>]
//   vril-zip info <input.vrz2>

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, basename, extname } from "node:path";
import {
  pack,
  unpack,
  inspectContainer,
  MAGIC_BYTES,
  CONTAINER_VERSION,
} from "./container.js";
import { runBenchmark } from "./benchmark.js";
import type { EntropyBackend } from "./transformer.js";

// ─────────────────────────────────────────────────────────────
// CLI helpers
// ─────────────────────────────────────────────────────────────

function printUsage(): void {
  const usage = `
VRIL-ZIP v2 Universal Transformer Edition
Magic: ${new TextDecoder().decode(MAGIC_BYTES)} | Version: ${CONTAINER_VERSION}

Usage:
  vril-zip compress <input> [options]
  vril-zip decompress <input> [options]
  vril-zip benchmark [options]
  vril-zip info <input>

Commands:
  compress     Compress a file into VRZ2 format
  decompress   Decompress a VRZ2 file
  benchmark    Run compression benchmarks
  info         Display VRZ2 container metadata

Options:
  -o, --output <path>     Output file path (default: auto-detect)
  -l, --level <1-9>       Compression level (default: 9)
  -b, --backend <type>    Backend: auto, deflate, brotli, gzip (default: auto)
  --auth                  Enable HMAC-SHA3-256 authentication (prompts for key)
  --key <hex>             Authentication key as hex string
  --size <bytes>          Benchmark test file size (default: 100000)
  -h, --help              Show this help message
`;
  console.log(usage.trimStart());
}

function parseArgs(argv: string[]): {
  command: string;
  positional: string[];
  flags: Record<string, string>;
} {
  const args = argv.slice(2);
  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const command = args[0];
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    } else if (arg === "-o" || arg === "--output") {
      flags.output = args[++i];
    } else if (arg === "-l" || arg === "--level") {
      flags.level = args[++i];
    } else if (arg === "-b" || arg === "--backend") {
      flags.backend = args[++i];
    } else if (arg === "--auth") {
      flags.auth = "true";
    } else if (arg === "--key") {
      flags.key = args[++i];
    } else if (arg === "--size") {
      flags.size = args[++i];
    } else if (arg.startsWith("--")) {
      flags[arg.slice(2)] = args[++i];
    } else {
      positional.push(arg);
    }
    i++;
  }

  return { command, positional, flags };
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Hex key must have even length");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function defaultOutputPath(inputPath: string, command: string): string {
  const dir = resolve(inputPath, "..");
  const name = basename(inputPath, extname(inputPath));
  if (command === "compress") {
    return resolve(dir, `${name}.vrz2`);
  } else {
    return resolve(dir, `${name}.out`);
  }
}

// ─────────────────────────────────────────────────────────────
// Command handlers
// ─────────────────────────────────────────────────────────────

function cmdCompress(inputPath: string, flags: Record<string, string>): void {
  const input = resolve(inputPath);
  const data = readFileSync(input);
  const output = flags.output
    ? resolve(flags.output)
    : defaultOutputPath(input, "compress");
  const level = flags.level ? parseInt(flags.level, 10) : 9;
  const backendStr = flags.backend ?? "auto";
  let backend: EntropyBackend | "auto" = "auto";
  if (backendStr === "deflate") backend = "deflate-raw";
  else if (backendStr === "brotli") backend = "brotli";
  else if (backendStr === "gzip") backend = "gzip";
  else if (backendStr !== "auto") {
    console.error(`Unknown backend: ${backendStr}`);
    process.exit(1);
  }

  if (level < 1 || level > 9 || isNaN(level)) {
    console.error("Level must be 1-9");
    process.exit(1);
  }

  let authKey: Uint8Array | undefined;
  if (flags.key) {
    authKey = hexToBytes(flags.key);
  }

  console.log(`Compressing: ${input}`);
  console.log(`  Input size: ${data.length.toLocaleString()} bytes`);
  console.log(`  Level: ${level}, Backend: ${backendStr}`);

  const t0 = performance.now();
  const compressed = pack(data, { level, backend, authKey });
  const t1 = performance.now();

  writeFileSync(output, compressed);
  const ratio = data.length / compressed.length;

  console.log(`  Output size: ${compressed.length.toLocaleString()} bytes`);
  console.log(
    `  Ratio: ${ratio.toFixed(2)}x (${((1 - compressed.length / data.length) * 100).toFixed(1)}% reduction)`
  );
  console.log(`  Time: ${(t1 - t0).toFixed(1)}ms`);
  console.log(`  Written to: ${output}`);
  if (authKey) {
    console.log(`  Authenticated: yes (HMAC-SHA3-256)`);
  }
}

function cmdDecompress(inputPath: string, flags: Record<string, string>): void {
  const input = resolve(inputPath);
  const data = readFileSync(input);
  const output = flags.output
    ? resolve(flags.output)
    : defaultOutputPath(input, "decompress");

  let authKey: Uint8Array | undefined;
  if (flags.key) {
    authKey = hexToBytes(flags.key);
  }

  console.log(`Decompressing: ${input}`);
  console.log(`  Input size: ${data.length.toLocaleString()} bytes`);

  const t0 = performance.now();
  const decompressed = unpack(data, { authKey });
  const t1 = performance.now();

  writeFileSync(output, decompressed);

  console.log(`  Output size: ${decompressed.length.toLocaleString()} bytes`);
  console.log(`  Time: ${(t1 - t0).toFixed(1)}ms`);
  console.log(`  Written to: ${output}`);

  // Verify roundtrip
  const reCompressed = pack(decompressed, { level: 9, backend: "auto" });
  const reDecompressed = unpack(reCompressed);
  if (reDecompressed.length !== decompressed.length) {
    console.error("  WARNING: Re-compression roundtrip check failed!");
    process.exit(1);
  }
  for (let i = 0; i < decompressed.length; i++) {
    if (decompressed[i] !== reDecompressed[i]) {
      console.error(`  WARNING: Byte mismatch at offset ${i}!`);
      process.exit(1);
    }
  }
  console.log(`  Roundtrip verification: ✓`);
}

function cmdInfo(inputPath: string): void {
  const input = resolve(inputPath);
  const data = readFileSync(input);

  try {
    const info = inspectContainer(data);
    console.log(`VRZ2 Container Info: ${input}`);
    console.log(`  Version: ${info.version}`);
    console.log(`  Backend: ${info.backend}`);
    console.log(`  Authenticated: ${info.hasAuthTag ? "yes" : "no"}`);
    console.log(
      `  Original size: ${info.originalLength.toLocaleString()} bytes`
    );
    console.log(
      `  Payload size: ${info.payloadLength.toLocaleString()} bytes`
    );
    console.log(
      `  Container size: ${data.length.toLocaleString()} bytes`
    );
    console.log(`  CRC32: 0x${info.crc32.toString(16).padStart(8, "0")}`);
    const overhead = data.length - info.originalLength;
    const savingsPct = (
      (1 - data.length / info.originalLength) *
      100
    ).toFixed(1);
    console.log(
      `  ${overhead >= 0 ? "Overhead" : "Savings"}: ${Math.abs(overhead).toLocaleString()} bytes (${savingsPct}%)`
    );
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}

function cmdBenchmark(flags: Record<string, string>): void {
  const size = flags.size ? parseInt(flags.size, 10) : 100_000;
  runBenchmark(isNaN(size) ? 100_000 : size);
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

function main(): void {
  const { command, positional, flags } = parseArgs(process.argv);

  switch (command) {
    case "compress":
      if (positional.length < 1) {
        console.error("Error: 'compress' requires an input file");
        console.error("Usage: vril-zip compress <input> [options]");
        process.exit(1);
      }
      cmdCompress(positional[0], flags);
      break;

    case "decompress":
      if (positional.length < 1) {
        console.error("Error: 'decompress' requires an input file");
        console.error("Usage: vril-zip decompress <input.vrz2> [options]");
        process.exit(1);
      }
      cmdDecompress(positional[0], flags);
      break;

    case "benchmark":
      cmdBenchmark(flags);
      break;

    case "info":
      if (positional.length < 1) {
        console.error("Error: 'info' requires an input file");
        console.error("Usage: vril-zip info <input.vrz2>");
        process.exit(1);
      }
      cmdInfo(positional[0]);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error("Run 'vril-zip --help' for usage information.");
      process.exit(1);
  }
}

main();
