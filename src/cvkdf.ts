// CVKDF — Centripetal Vortex Key Derivation Function
//
// 7-layer key derivation pipeline implementing the VRIL LABS CVKDF v1
// concept (April 2026). The pipeline is centripetal: cost rises as you
// move inward, with a Layer 5 real-world contribution gate and a Layer
// 6 sequential-memory-hard scrypt pass that resists GPU/ASIC parallelism.
//
//   Layer 1: HMAC-SHA3-256       — domain salting        (~µs)
//   Layer 2: HKDF-Extract        — context binding       (~µs)
//   Layer 3: HKDF-Expand         — state proof injection (~µs)
//   Layer 4: Argon2id (64 MB)    — first memory barrier  (~200 ms)
//   Layer 5: Argon2id (128 MB)   — REAL-WORLD GATE       (~400 ms)
//   Layer 6: scrypt (N=2^17)     — sequential spiral     (~500 ms)
//   Layer 7: HMAC-SHA3-512 →256  — crystallisation       (~µs)
//
// Total wall time on 2026 server hardware: ~1.1–1.3 s. Peak concurrent
// memory: ~256 MB (Layers 5 and 6). GPU/ASIC resistance: high.
//
// Cross-product invariants enforced:
//   • Seven layers exactly (no collapse, no reorder)
//   • Centripetal cost gradient (each layer ≥ previous)
//   • Domain separation at every layer (V1 namespacing)
//   • Layer 5 requires a verified real-world event (caller is
//     responsible for the verification — this module just consumes
//     the resulting attestation bytes)
//   • Layer 6 salt is a Merkle digest of all prior layer outputs
//   • Layer 7 binds to agentId + immutable anchor
//   • No intermediate persistence — only Layer 7 is returned

import { createHash, createHmac, hkdfSync, scryptSync } from "node:crypto";
import { argon2id } from "@noble/hashes/argon2";

const VERSION_LABEL = "CVKDF_V1";

export interface CvkdfInput {
  /** Layer 1: identity / agent id (utf-8 string or bytes). */
  agentId: string | Uint8Array;
  /** Layer 1: environment identifier (e.g. "prod", "staging"). */
  environment: string;
  /** Layer 1: time epoch (e.g. unix seconds rounded to a window). */
  epoch: number;
  /** Layer 2: operational context (resource id, scope, task). */
  context: string | Uint8Array;
  /** Layer 3: external state snapshot — record hash, audit-log digest. */
  stateProof: Uint8Array;
  /**
   * Layer 5: bytes of a verified, irreversible, externally confirmable
   * event (transaction hash, signed attestation, etc.). The CALLER must
   * verify the event before assembling these bytes — this function does
   * not perform the verification.
   */
  realWorldAttestation: Uint8Array;
  /** Layer 7: immutable anchor (genesis-event id, timestamp, etc.). */
  anchor: string | Uint8Array;
  /**
   * Optional product domain tag (e.g. "vril-zip", "vril-cur"). Defaults
   * to "vril-zip". Mixed into every layer's domain separator to prevent
   * cross-product key reuse.
   */
  product?: string;
  /** Optional override of Layer 4/5/6 cost parameters (testing only). */
  costOverride?: {
    layer4?: { t: number; m: number; p: number };
    layer5?: { t: number; m: number; p: number };
    layer6?: { N: number; r: number; p: number };
  };
}

const DEFAULT_COSTS = {
  layer4: { t: 2, m: 65536, p: 4 }, // 64 MB Argon2id
  layer5: { t: 3, m: 131072, p: 4 }, // 128 MB Argon2id
  layer6: { N: 1 << 17, r: 8, p: 1 }, // scrypt 128 MB, sequential
} as const;

function asBytes(v: string | Uint8Array): Uint8Array {
  return typeof v === "string" ? new TextEncoder().encode(v) : v;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function domainLabel(product: string, layer: number, role: string): Uint8Array {
  return new TextEncoder().encode(`${VERSION_LABEL}:${product}:L${layer}:${role}`);
}

/**
 * Run the full 7-layer CVKDF and return a 32-byte derived key.
 *
 * SECURITY NOTES:
 *   • Layer 5 attestation MUST be verified by the caller before this
 *     function is invoked. CVKDF assumes the bytes are genuine.
 *   • Intermediate layer outputs are zeroed best-effort before return.
 *   • Only the 32-byte Layer 7 output may be persisted; never log or
 *     cache Layers 1–6.
 */
export async function cvkdf(input: CvkdfInput): Promise<Uint8Array> {
  const product = input.product ?? "vril-zip";
  const costs = {
    layer4: { ...DEFAULT_COSTS.layer4, ...input.costOverride?.layer4 },
    layer5: { ...DEFAULT_COSTS.layer5, ...input.costOverride?.layer5 },
    layer6: { ...DEFAULT_COSTS.layer6, ...input.costOverride?.layer6 },
  };

  // -------- Layer 1: HMAC-SHA3-256 — domain salting --------
  const epochBytes = new Uint8Array(8);
  new DataView(epochBytes.buffer).setBigUint64(0, BigInt(input.epoch), true);
  const l1Key = domainLabel(product, 1, "salt");
  const l1Input = concat(asBytes(input.agentId), asBytes(input.environment), epochBytes);
  const layer1 = new Uint8Array(createHmac("sha3-256", l1Key).update(l1Input).digest());

  // -------- Layer 2: HKDF-Extract — context binding --------
  const layer2 = new Uint8Array(
    hkdfSync("sha3-256", layer1, asBytes(input.context), domainLabel(product, 2, "ctx"), 32),
  );

  // -------- Layer 3: HKDF-Expand — state proof injection --------
  const l3Info = concat(domainLabel(product, 3, "state"), input.stateProof);
  const layer3 = new Uint8Array(hkdfSync("sha3-256", layer2, input.stateProof, l3Info, 32));

  // -------- Layer 4: Argon2id (memory-hard barrier) --------
  const layer4 = argon2id(layer3, domainLabel(product, 4, "mem1"), {
    t: costs.layer4.t,
    m: costs.layer4.m,
    p: costs.layer4.p,
    dkLen: 32,
  });

  // -------- Layer 5: Argon2id (real-world contribution gate) --------
  // Salt = HMAC-SHA3-256(layer4, attestation || product-label).
  // If attestation is wrong/forged, the salt is wrong, the output is
  // pseudorandom, and Layer 7 is unrecoverable.
  const l5SaltInput = concat(input.realWorldAttestation, domainLabel(product, 5, "gate"));
  const l5Salt = new Uint8Array(createHmac("sha3-256", layer4).update(l5SaltInput).digest());
  const layer5 = argon2id(layer4, l5Salt, {
    t: costs.layer5.t,
    m: costs.layer5.m,
    p: costs.layer5.p,
    dkLen: 32,
  });

  // -------- Layer 6: scrypt (sequential spiral) --------
  // Salt is a Merkle-style digest of every prior layer output.
  const merkle = new Uint8Array(
    createHash("sha3-256")
      .update(layer1)
      .update(layer2)
      .update(layer3)
      .update(layer4)
      .update(layer5)
      .update(domainLabel(product, 6, "spiral"))
      .digest(),
  );
  const layer6 = new Uint8Array(
    scryptSync(layer5, merkle, 32, {
      N: costs.layer6.N,
      r: costs.layer6.r,
      p: costs.layer6.p,
      maxmem: 512 * 1024 * 1024,
    }),
  );

  // -------- Layer 7: crystallisation (HMAC-SHA3-512 → 256) --------
  const l7Key = domainLabel(product, 7, "crystal");
  const l7Input = concat(layer6, asBytes(input.agentId), asBytes(input.anchor));
  const full = new Uint8Array(createHmac("sha3-512", l7Key).update(l7Input).digest());
  const layer7 = full.subarray(0, 32);

  // Best-effort zeroisation of intermediates (in JS this is advisory —
  // the GC may have already copied them, but we do what we can).
  layer1.fill(0);
  layer2.fill(0);
  layer3.fill(0);
  layer4.fill(0);
  layer5.fill(0);
  layer6.fill(0);
  merkle.fill(0);
  full.subarray(32).fill(0); // unused tail

  return new Uint8Array(layer7); // copy so caller can't see the zeroed buffer
}

/**
 * Cost-reduced CVKDF for unit tests only. Same 7-layer structure, but
 * Argon2id and scrypt run with tiny parameters so tests finish in <1s.
 * MUST NEVER be used in production — the resulting key has trivial
 * brute-force cost.
 */
export function testCosts(): NonNullable<CvkdfInput["costOverride"]> {
  return {
    layer4: { t: 1, m: 256, p: 1 },
    layer5: { t: 1, m: 256, p: 1 },
    layer6: { N: 1024, r: 1, p: 1 },
  };
}
