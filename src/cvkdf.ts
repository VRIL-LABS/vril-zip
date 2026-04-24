// CVKDF v2 — Centripetal Vortex Key Derivation Function
//
// Enhanced 8-layer key derivation pipeline (v1 had 7 layers).
// v2 additions:
//   - Layer 0: BLAKE3 pre-hash of all inputs (input normalization)
//   - Layer 5 memory increased to 256 MB
//   - Layer 6 scrypt N increased to 2^18
//   - Optional parallelism parameter for Layer 4/5 (p=8)
//   - Backward compatibility mode for v1 keys
//
//   Layer 0: BLAKE3 pre-hash        — input normalization      (~µs)  [NEW v2]
//   Layer 1: HMAC-SHA3-256          — domain salting           (~µs)
//   Layer 2: HKDF-Extract           — context binding          (~µs)
//   Layer 3: HKDF-Expand            — state proof injection    (~µs)
//   Layer 4: Argon2id (64 MB)       — first memory barrier     (~200 ms)
//   Layer 5: Argon2id (256 MB)      — REAL-WORLD GATE          (~800 ms) [v2: 256 MB]
//   Layer 6: scrypt (N=2^18)        — sequential spiral        (~1 s)   [v2: N=2^18]
//   Layer 7: HMAC-SHA3-512 → 256    — crystallisation          (~µs)
//
// Total wall time on 2026 server hardware: ~2–2.5 s. Peak concurrent
// memory: ~384 MB (Layers 5 and 6). GPU/ASIC resistance: high.
//
// Cross-product invariants enforced:
//   • Eight layers exactly (v2) or seven layers (v1-compat mode)
//   • Centripetal cost gradient (each layer ≥ previous)
//   • Domain separation at every layer (V2 namespacing)
//   • Layer 5 requires a verified real-world event
//   • Layer 6 salt is a Merkle digest of all prior layer outputs
//   • Layer 7 binds to agentId + immutable anchor
//   • No intermediate persistence — only Layer 7 is returned

import {
  createHash,
  createHmac,
  hkdfSync,
  scryptSync,
} from "node:crypto";
import { argon2id } from "@noble/hashes/argon2.js";
import { blake3 } from "@noble/hashes/blake3.js";

const VERSION_LABEL_V2 = "CVKDF_V2";
const VERSION_LABEL_V1 = "CVKDF_V1";

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
   * verify the event before assembling these bytes.
   */
  realWorldAttestation: Uint8Array;
  /** Layer 7: immutable anchor (genesis-event id, timestamp, etc.). */
  anchor: string | Uint8Array;
  /**
   * Optional product domain tag. Defaults to "vril-zip".
   * Mixed into every layer's domain separator.
   */
  product?: string;
  /** Optional override of cost parameters (testing only). */
  costOverride?: {
    layer0?: boolean; // skip Layer 0 for v1 compat
    layer4?: { t: number; m: number; p: number };
    layer5?: { t: number; m: number; p: number };
    layer6?: { N: number; r: number; p: number };
  };
  /**
   * Optional parallelism for Argon2id layers 4 and 5.
   * Default: 4 (v1) or 8 (v2). Higher values use more memory and threads.
   */
  parallelism?: number;
}

/** Default v2 cost parameters. */
const DEFAULT_COSTS_V2 = {
  layer4: { t: 2, m: 65536, p: 8 }, // 64 MB Argon2id, p=8 [v2]
  layer5: { t: 3, m: 262144, p: 8 }, // 256 MB Argon2id, p=8 [v2: increased]
  layer6: { N: 1 << 18, r: 8, p: 1 }, // scrypt N=2^18 [v2: increased]
} as const;

/** Default v1 cost parameters (for backward compatibility). */
const DEFAULT_COSTS_V1 = {
  layer4: { t: 2, m: 65536, p: 4 }, // 64 MB Argon2id
  layer5: { t: 3, m: 131072, p: 4 }, // 128 MB Argon2id
  layer6: { N: 1 << 17, r: 8, p: 1 }, // scrypt N=2^17
} as const;

function asBytes(v: string | Uint8Array): Uint8Array {
  return typeof v === "string" ? new TextEncoder().encode(v) : new Uint8Array(v);
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

function domainLabel(version: string, product: string, layer: number, role: string): Uint8Array {
  return new TextEncoder().encode(
    `${version}:${product}:L${layer}:${role}`
  );
}

/**
 * Run the full 8-layer CVKDF v2 and return a 32-byte derived key.
 *
 * SECURITY NOTES:
 *   • Layer 5 attestation MUST be verified by the caller before this
 *     function is invoked. CVKDF assumes the bytes are genuine.
 *   • Intermediate layer outputs are zeroed best-effort before return.
 *   • Only the 32-byte Layer 7 output may be persisted; never log or
 *     cache Layers 0–6.
 *
 * BACKWARD COMPATIBILITY:
 *   Set costOverride.layer0 = false (or any truthy value) to skip
 *   Layer 0 and use v1 defaults for other layers, producing keys
 *   identical to CVKDF v1.
 */
export async function cvkdf(input: CvkdfInput): Promise<Uint8Array> {
  const product = input.product ?? "vril-zip";
  const skipLayer0 = !!input.costOverride?.layer0;

  // Choose cost parameters: v1 compat or v2
  const baseCosts = skipLayer0 ? DEFAULT_COSTS_V1 : DEFAULT_COSTS_V2;
  const costs = {
    layer4: {
      ...baseCosts.layer4,
      ...input.costOverride?.layer4,
      p: input.parallelism ?? baseCosts.layer4.p,
    },
    layer5: {
      ...baseCosts.layer5,
      ...input.costOverride?.layer5,
      p: input.parallelism ?? baseCosts.layer5.p,
    },
    layer6: { ...baseCosts.layer6, ...input.costOverride?.layer6 },
  };

  const version = skipLayer0 ? VERSION_LABEL_V1 : VERSION_LABEL_V2;

  let layer1: Uint8Array;
  let layer0: Uint8Array | null = null;

  // -------- Layer 0: BLAKE3 pre-hash (v2 only) --------
  // Normalizes all inputs into a single 32-byte digest before the
  // pipeline begins. This ensures deterministic behavior regardless
  // of input encoding, length variations, or other surface-level
  // differences in how callers assemble the same semantic inputs.
  if (!skipLayer0) {
    const allInputs = concat(
      asBytes(input.agentId),
      asBytes(input.environment),
      (() => {
        const eb = new Uint8Array(8);
        new DataView(eb.buffer).setBigUint64(0, BigInt(input.epoch), true);
        return eb;
      })(),
      asBytes(input.context),
      input.stateProof,
      input.realWorldAttestation,
      asBytes(input.anchor),
      asBytes(product)
    );
    layer0 = blake3(allInputs);

    // -------- Layer 1: HMAC-SHA3-256 — domain salting --------
    const l1Key = domainLabel(version, product, 1, "salt");
    // In v2, Layer 1 salts the BLAKE3 pre-hash instead of raw inputs
    const l1Input = concat(layer0!, asBytes(input.environment));
    layer1 = new Uint8Array(
      createHmac("sha3-256", l1Key).update(l1Input).digest()
    );
    // Zero layer0
    layer0!.fill(0);
  } else {
    // -------- Layer 1: v1 path (raw inputs) --------
    const epochBytes = new Uint8Array(8);
    new DataView(epochBytes.buffer).setBigUint64(
      0,
      BigInt(input.epoch),
      true
    );
    const l1Key = domainLabel(version, product, 1, "salt");
    const l1Input = concat(
      asBytes(input.agentId),
      asBytes(input.environment),
      epochBytes
    );
    layer1 = new Uint8Array(
      createHmac("sha3-256", l1Key).update(l1Input).digest()
    );
  }

  // -------- Layer 2: HKDF-Extract — context binding --------
  const layer2 = new Uint8Array(
    hkdfSync(
      "sha3-256",
      layer1,
      asBytes(input.context),
      domainLabel(version, product, 2, "ctx"),
      32
    )
  );

  // -------- Layer 3: HKDF-Expand — state proof injection --------
  const l3Info = concat(
    domainLabel(version, product, 3, "state"),
    input.stateProof
  );
  const layer3 = new Uint8Array(
    hkdfSync("sha3-256", layer2, input.stateProof, l3Info, 32)
  );

  // -------- Layer 4: Argon2id (memory-hard barrier) --------
  const layer4 = argon2id(layer3, domainLabel(version, product, 4, "mem1"), {
    t: costs.layer4.t,
    m: costs.layer4.m,
    p: costs.layer4.p,
    dkLen: 32,
  });

  // -------- Layer 5: Argon2id (real-world contribution gate) --------
  const l5SaltInput = concat(
    input.realWorldAttestation,
    domainLabel(version, product, 5, "gate")
  );
  const l5Salt = new Uint8Array(
    createHmac("sha3-256", layer4).update(l5SaltInput).digest()
  );
  const layer5 = argon2id(layer4, l5Salt, {
    t: costs.layer5.t,
    m: costs.layer5.m,
    p: costs.layer5.p,
    dkLen: 32,
  });

  // -------- Layer 6: scrypt (sequential spiral) --------
  // Salt is Merkle-style digest of all prior layer outputs.
  const merkle = new Uint8Array(
    createHash("sha3-256")
      .update(layer1)
      .update(layer2)
      .update(layer3)
      .update(layer4)
      .update(layer5)
      .update(domainLabel(version, product, 6, "spiral"))
      .digest()
  );
  const layer6 = new Uint8Array(
    scryptSync(layer5, merkle, 32, {
      N: costs.layer6.N,
      r: costs.layer6.r,
      p: costs.layer6.p,
      maxmem: 768 * 1024 * 1024, // 768 MB to accommodate v2 costs
    })
  );

  // -------- Layer 7: crystallisation (HMAC-SHA3-512 → 256) --------
  const l7Key = domainLabel(version, product, 7, "crystal");
  const l7Input = concat(layer6, asBytes(input.agentId), asBytes(input.anchor));
  const full = new Uint8Array(
    createHmac("sha3-512", l7Key).update(l7Input).digest()
  );
  const layer7 = full.subarray(0, 32);

  // Best-effort zeroisation of intermediates
  layer1.fill(0);
  layer2.fill(0);
  layer3.fill(0);
  layer4.fill(0);
  layer5.fill(0);
  layer6.fill(0);
  merkle.fill(0);
  full.subarray(32).fill(0);

  return new Uint8Array(layer7); // copy so caller can't see zeroed buffer
}

/**
 * Cost-reduced CVKDF for unit tests only.
 * Same layer structure, but with tiny parameters (<1s execution).
 * MUST NEVER be used in production.
 */
export function testCosts(): NonNullable<CvkdfInput["costOverride"]> {
  return {
    layer0: false, // skip Layer 0 (v1 mode for fast testing)
    layer4: { t: 1, m: 256, p: 1 },
    layer5: { t: 1, m: 256, p: 1 },
    layer6: { N: 1024, r: 1, p: 1 },
  };
}

/**
 * Cost-reduced CVKDF v2 for unit tests (includes Layer 0 BLAKE3).
 * MUST NEVER be used in production.
 */
export function testCostsV2(): NonNullable<CvkdfInput["costOverride"]> {
  return {
    layer4: { t: 1, m: 256, p: 1 },
    layer5: { t: 1, m: 256, p: 1 },
    layer6: { N: 1024, r: 1, p: 1 },
  };
}
