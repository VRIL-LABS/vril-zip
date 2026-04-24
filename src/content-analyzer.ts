// VRIL-ZIP v2 Universal Content Analyzer
//
// Detects content type, computes entropy, identifies patterns, and
// recommends optimal compression pipelines based on data characteristics.
//
// Magic byte detection covers: PNG, JPEG, GIF, BMP, WAV, MP3, FLAC, OGG,
// MP4, AVI, MKV, ZIP, GZ, RAR, 7Z, TAR, PDF, EXE, ELF, and many more.

// ─────────────────────────────────────────────────────────────
// Content type classification
// ─────────────────────────────────────────────────────────────

export type ContentType =
  | "text"
  | "json"
  | "xml"
  | "csv"
  | "source-code"
  | "structured"
  | "image"
  | "audio"
  | "video"
  | "archive"
  | "binary"
  | "random";

export interface ContentAnalysis {
  /** Detected or inferred content type. */
  type: ContentType;
  /** Shannon entropy in bits per byte (0.0 – 8.0). */
  entropy: number;
  /** Number of distinct byte values in the data (0 – 256). */
  uniqueBytes: number;
  /** Fraction of bytes that are part of runs ≥ 3 (0.0 – 1.0). */
  runFraction: number;
  /** Total size of the input in bytes. */
  size: number;
  /** Pipeline names recommended for this content type. */
  recommendedPipelines: string[];
  /** Detected magic type if applicable. */
  magicType?: string;
  /** Fraction of printable ASCII bytes (0.0 – 1.0). */
  printability: number;
  /** Detected periodicity strength (0.0 – 1.0). */
  periodicity: number;
  /** Fraction of whitespace bytes (0.0 – 1.0). */
  whitespaceFraction: number;
}

// ─────────────────────────────────────────────────────────────
// Magic byte signatures
// ─────────────────────────────────────────────────────────────

interface MagicSignature {
  bytes: number[];
  offset: number;
  /** Generic category for pipeline selection. */
  category: ContentType;
  /** Human-readable format name. */
  format: string;
}

const MAGIC_SIGNATURES: MagicSignature[] = [
  // Images
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0, category: "image", format: "PNG" },
  { bytes: [0xff, 0xd8, 0xff], offset: 0, category: "image", format: "JPEG" },
  { bytes: [0x47, 0x49, 0x46, 0x38], offset: 0, category: "image", format: "GIF" },
  { bytes: [0x42, 0x4d], offset: 0, category: "image", format: "BMP" },
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, category: "image", format: "WebP" }, // RIFF (WebP starts with RIFF...WEBP)
  { bytes: [0x00, 0x00, 0x01, 0x00], offset: 0, category: "image", format: "ICO" },

  // Audio
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, category: "audio", format: "RIFF/WAV" }, // RIFF container
  { bytes: [0xff, 0xfb], offset: 0, category: "audio", format: "MP3" },
  { bytes: [0xff, 0xf3], offset: 0, category: "audio", format: "MP3" },
  { bytes: [0xff, 0xf2], offset: 0, category: "audio", format: "MP3" },
  { bytes: [0x49, 0x44, 0x33], offset: 0, category: "audio", format: "MP3/ID3" },
  { bytes: [0x66, 0x4c, 0x61, 0x43], offset: 0, category: "audio", format: "FLAC" },
  { bytes: [0x4f, 0x67, 0x67, 0x53], offset: 0, category: "audio", format: "OGG" },
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, category: "audio", format: "WAV" },

  // Video
  { bytes: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], offset: 0, category: "video", format: "MP4" },
  { bytes: [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70], offset: 0, category: "video", format: "MP4" },
  { bytes: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], offset: 0, category: "video", format: "MP4" },
  { bytes: [0x00, 0x00, 0x00, 0x24, 0x66, 0x74, 0x79, 0x70], offset: 0, category: "video", format: "MP4" },
  { bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0, category: "video", format: "MKV/WebM" },

  // Archives (already compressed — likely incompressible)
  { bytes: [0x50, 0x4b, 0x03, 0x04], offset: 0, category: "archive", format: "ZIP" },
  { bytes: [0x1f, 0x8b], offset: 0, category: "archive", format: "gzip" },
  { bytes: [0x52, 0x61, 0x72, 0x21], offset: 0, category: "archive", format: "RAR" },
  { bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], offset: 0, category: "archive", format: "7z" },
  { bytes: [0x28, 0xb5, 0x2f, 0xfd], offset: 0, category: "archive", format: "zstd" },
  { bytes: [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00], offset: 0, category: "archive", format: "xz" },
  { bytes: [0x42, 0x5a, 0x68], offset: 0, category: "archive", format: "BZ2" },

  // Documents
  { bytes: [0x25, 0x50, 0x44, 0x46], offset: 0, category: "binary", format: "PDF" },

  // Executables
  { bytes: [0x4d, 0x5a], offset: 0, category: "binary", format: "EXE" },
  { bytes: [0x7f, 0x45, 0x4c, 0x46], offset: 0, category: "binary", format: "ELF" },
  { bytes: [0xca, 0xfe, 0xba, 0xbe], offset: 0, category: "binary", format: "Mach-O" },
  { bytes: [0xfe, 0xed, 0xfa, 0xce], offset: 0, category: "binary", format: "Mach-O" },
];

// ─────────────────────────────────────────────────────────────
// Analysis functions
// ─────────────────────────────────────────────────────────────

/**
 * Detect magic bytes and return the matched format/category.
 */
function detectMagic(data: Uint8Array): { category: ContentType; format: string } | null {
  for (const sig of MAGIC_SIGNATURES) {
    if (data.length < sig.offset + sig.bytes.length) continue;
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (data[sig.offset + i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) return { category: sig.category, format: sig.format };
  }
  return null;
}

/**
 * Compute Shannon entropy in bits per byte.
 */
function computeEntropy(data: Uint8Array): number {
  const n = data.length;
  if (n === 0) return 0;

  const freq = new Float64Array(256);
  for (let i = 0; i < n; i++) freq[data[i]]++;

  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      const p = freq[i] / n;
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

/**
 * Count distinct byte values.
 */
function countUniqueBytes(data: Uint8Array): number {
  const seen = new Uint8Array(256);
  let count = 0;
  for (let i = 0; i < data.length; i++) {
    if (seen[data[i]] === 0) {
      seen[data[i]] = 1;
      count++;
    }
  }
  return count;
}

/**
 * Compute the fraction of bytes in runs of length ≥ 3.
 */
function computeRunFraction(data: Uint8Array): number {
  const scanLen = Math.min(data.length, 8192);
  if (scanLen === 0) return 0;

  let runBytes = 0;
  let i = 0;
  while (i < scanLen) {
    let run = 1;
    while (i + run < scanLen && data[i + run] === data[i] && run < 255) run++;
    if (run >= 3) runBytes += run;
    i += run;
  }
  return runBytes / scanLen;
}

/**
 * Compute the fraction of printable ASCII bytes.
 */
function computePrintability(data: Uint8Array): number {
  const scanLen = Math.min(data.length, 4096);
  if (scanLen === 0) return 0;

  let printable = 0;
  for (let i = 0; i < scanLen; i++) {
    const b = data[i];
    if ((b >= 0x20 && b <= 0x7e) || b === 0x09 || b === 0x0a || b === 0x0d) {
      printable++;
    }
  }
  return printable / scanLen;
}

/**
 * Compute the fraction of whitespace bytes.
 */
function computeWhitespaceFraction(data: Uint8Array): number {
  const scanLen = Math.min(data.length, 4096);
  if (scanLen === 0) return 0;

  let ws = 0;
  for (let i = 0; i < scanLen; i++) {
    const b = data[i];
    if (b === 0x09 || b === 0x0a || b === 0x0d || b === 0x20) ws++;
  }
  return ws / scanLen;
}

/**
 * Detect periodicity via sampled autocorrelation.
 */
function computePeriodicity(data: Uint8Array): number {
  const size = data.length;
  if (size < 32) return 0;

  const sampleLen = Math.min(size, 1024);
  const step = Math.max(1, Math.floor(sampleLen / 256));
  let bestCorr = 0;

  for (let period = 2; period <= Math.min(128, Math.floor(sampleLen / 4)); period++) {
    let corr = 0;
    let count = 0;
    for (let j = period; j < sampleLen; j += step) {
      if (data[j] === data[j - period]) corr++;
      count++;
    }
    const normalizedCorr = count > 0 ? corr / count : 0;
    if (normalizedCorr > bestCorr) bestCorr = normalizedCorr;
  }
  return bestCorr;
}

/**
 * Detect if data looks like CSV (high comma/delimiter frequency + text-like).
 */
function looksLikeCsv(data: Uint8Array): boolean {
  const scanLen = Math.min(data.length, 2048);
  if (scanLen === 0) return false;

  let commas = 0;
  let newlines = 0;
  let printable = 0;
  for (let i = 0; i < scanLen; i++) {
    const b = data[i];
    if (b === 0x2c) commas++; // comma
    if (b === 0x0a || b === 0x0d) newlines++;
    if ((b >= 0x20 && b <= 0x7e) || b === 0x09 || b === 0x0a || b === 0x0d) printable++;
  }

  const printRatio = printable / scanLen;
  if (printRatio < 0.7) return false;
  if (newlines === 0) return false;
  if (commas < newlines * 0.5) return false; // At least ~0.5 commas per line

  return true;
}

/**
 * Detect if data looks like source code.
 */
function looksLikeSourceCode(data: Uint8Array): boolean {
  const scanLen = Math.min(data.length, 2048);
  if (scanLen === 0) return false;

  let braces = 0;
  let parens = 0;
  let semicolons = 0;
  let printable = 0;
  let equals = 0;
  for (let i = 0; i < scanLen; i++) {
    const b = data[i];
    if (b === 0x7b || b === 0x7d) braces++; // { }
    if (b === 0x28 || b === 0x29) parens++; // ( )
    if (b === 0x3b) semicolons++;          // ;
    if (b === 0x3d) equals++;              // =
    if ((b >= 0x20 && b <= 0x7e) || b === 0x09 || b === 0x0a || b === 0x0d) printable++;
  }

  const printRatio = printable / scanLen;
  if (printRatio < 0.75) return false;
  if (braces < 2) return false;
  if (semicolons + equals < 2) return false;

  return true;
}

/**
 * Detect if data looks like XML.
 */
function looksLikeXml(data: Uint8Array): boolean {
  const scanLen = Math.min(data.length, 512);
  if (scanLen < 5) return false;

  // Check for <?xml or <root-like patterns
  let hasAngleBracket = false;
  let hasXmlDecl = false;

  const text = new TextDecoder("utf-8", { fatal: false }).decode(data.subarray(0, scanLen));

  if (text.startsWith("<?xml") || text.startsWith("<!DOCTYPE")) hasXmlDecl = true;
  if (text.includes("<") && text.includes(">")) hasAngleBracket = true;

  if (hasXmlDecl && hasAngleBracket) return true;

  // Check for HTML-like patterns with balanced tags
  const openTags = (text.match(/<[a-zA-Z][^>]*>/g) || []).length;
  const closeTags = (text.match(/<\/[a-zA-Z]+>/g) || []).length;
  if (openTags >= 2 && closeTags >= 1) return true;

  return false;
}

// ─────────────────────────────────────────────────────────────
// Main analysis function
// ─────────────────────────────────────────────────────────────

/**
 * Analyze input data and determine its content characteristics.
 * Used by the Universal Transformer Pipeline to select optimal preprocessing.
 */
export function analyzeContent(data: Uint8Array): ContentAnalysis {
  const size = data.length;
  const magic = detectMagic(data);
  const entropy = computeEntropy(data);
  const uniqueBytes = countUniqueBytes(data);
  const runFraction = computeRunFraction(data);
  const printability = computePrintability(data);
  const whitespaceFraction = computeWhitespaceFraction(data);
  const periodicity = computePeriodicity(data);

  // ── Determine content type ──

  let type: ContentType;
  let recommendedPipelines: string[];

  // Priority 1: Magic byte detection (already-compressed formats)
  if (magic) {
    switch (magic.category) {
      case "archive":
        type = "archive";
        recommendedPipelines = ["stored"];
        break;
      case "image":
        type = "image";
        recommendedPipelines = [
          "delta-deflate",
          "zero-rle-deflate",
          "bare-deflate",
          "bare-brotli",
        ];
        break;
      case "audio":
        type = "audio";
        recommendedPipelines = ["delta-deflate", "bare-deflate", "bare-brotli"];
        break;
      case "video":
        type = "video";
        recommendedPipelines = ["stored", "bare-deflate"];
        break;
      default:
        type = "binary";
        recommendedPipelines = ["bare-deflate", "bare-brotli", "stored"];
    }
  }
  // Priority 2: Text-like content
  else if (printability > 0.85 && entropy < 6.0) {
    if (looksLikeXml(data)) {
      type = "xml";
      recommendedPipelines = [
        "bwt-mtf-rle-deflate",
        "bwt-mtf-deflate",
        "v1-schauberger",
        "spiral-remap-deflate",
        "bare-brotli",
        "bare-deflate",
      ];
    } else if (looksLikeCsv(data)) {
      type = "csv";
      recommendedPipelines = [
        "delta-deflate",
        "v1-schauberger",
        "bwt-mtf-deflate",
        "bare-brotli",
      ];
    } else if (looksLikeSourceCode(data)) {
      type = "source-code";
      recommendedPipelines = [
        "bwt-mtf-rle-deflate",
        "bwt-mtf-deflate",
        "v1-schauberger",
        "spiral-remap-deflate",
        "bare-brotli",
        "bare-deflate",
      ];
    } else if (
      size >= 1 &&
      (data[0] === 0x7b || data[0] === 0x5b) &&
      printability > 0.7
    ) {
      type = "json";
      recommendedPipelines = [
        "bwt-mtf-rle-deflate",
        "bwt-mtf-deflate",
        "v1-schauberger",
        "spiral-remap-deflate",
        "bare-brotli",
        "bare-deflate",
      ];
    } else {
      type = "text";
      recommendedPipelines = [
        "bwt-mtf-deflate",
        "v1-schauberger",
        "spiral-remap-deflate",
        "bare-brotli",
        "bare-deflate",
      ];
    }
  }
  // Priority 3: Structured data (periodic but not text)
  else if (periodicity > 0.3 && runFraction < 0.1) {
    type = "structured";
    recommendedPipelines = [
      "delta-deflate",
      "delta-bwt-mtf-deflate",
      "bwt-mtf-deflate",
      "bare-brotli",
    ];
  }
  // Priority 4: High entropy (likely random or encrypted)
  else if (entropy > 7.8 && uniqueBytes > 240) {
    type = "random";
    recommendedPipelines = ["stored"];
  }
  // Priority 5: Default binary
  else {
    type = "binary";
    recommendedPipelines = [
      "bare-deflate",
      "bare-brotli",
      "v1-schauberger",
      "remap-deflate",
      "delta-deflate",
      "stored",
    ];
  }

  // Filter BWT pipelines for large inputs (> 1MB)
  if (size > 1024 * 1024) {
    recommendedPipelines = recommendedPipelines.filter(
      (p) => !p.startsWith("bwt-mtf")
    );
  }

  return {
    type,
    entropy,
    uniqueBytes,
    runFraction,
    size,
    recommendedPipelines,
    magicType: magic?.format,
    printability,
    periodicity,
    whitespaceFraction,
  };
}
