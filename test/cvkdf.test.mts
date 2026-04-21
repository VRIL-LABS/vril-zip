import { test } from "node:test";
import assert from "node:assert/strict";

import { cvkdf, testCosts } from "../src/cvkdf.ts";
import { compress, decompress, AuthenticationError } from "../src/index.ts";

const baseInput = {
  agentId: "agent-007",
  environment: "test",
  epoch: 1_700_000_000,
  context: "vril-zip:roundtrip",
  stateProof: new TextEncoder().encode("state:v1:hash:0xdeadbeef"),
  realWorldAttestation: new TextEncoder().encode("tx:0xcafe:confirmed"),
  anchor: "genesis:2026-04-21T00:00:00Z",
  product: "vril-zip-test",
  costOverride: testCosts(),
};

test("cvkdf: produces a 32-byte key", async () => {
  const key = await cvkdf(baseInput);
  assert.equal(key.length, 32);
});

test("cvkdf: deterministic for identical input", async () => {
  const a = await cvkdf(baseInput);
  const b = await cvkdf(baseInput);
  assert.deepEqual(Array.from(a), Array.from(b));
});

test("cvkdf: any input change produces a different key (Layer 1)", async () => {
  const a = await cvkdf(baseInput);
  const b = await cvkdf({ ...baseInput, agentId: "agent-008" });
  assert.notDeepEqual(Array.from(a), Array.from(b));
});

test("cvkdf: changed Layer 5 attestation produces a different key", async () => {
  const a = await cvkdf(baseInput);
  const b = await cvkdf({
    ...baseInput,
    realWorldAttestation: new TextEncoder().encode("tx:0xcafe:reverted"),
  });
  assert.notDeepEqual(Array.from(a), Array.from(b));
});

test("cvkdf: changed product domain isolates keys", async () => {
  const a = await cvkdf(baseInput);
  const b = await cvkdf({ ...baseInput, product: "different-product" });
  assert.notDeepEqual(Array.from(a), Array.from(b));
});

test("authenticated container: round-trip with correct key succeeds", async () => {
  const key = await cvkdf(baseInput);
  const data = new TextEncoder().encode("authenticated payload");
  const packed = compress(data, { authKey: key });
  const back = decompress(packed, { authKey: key });
  assert.deepEqual(Array.from(back), Array.from(data));
});

test("authenticated container: wrong key throws AuthenticationError", async () => {
  const keyA = await cvkdf(baseInput);
  const keyB = await cvkdf({ ...baseInput, agentId: "wrong-agent" });
  const data = new TextEncoder().encode("authenticated payload");
  const packed = compress(data, { authKey: keyA });
  assert.throws(() => decompress(packed, { authKey: keyB }), AuthenticationError);
});

test("authenticated container: missing key on auth'd payload throws", async () => {
  const key = await cvkdf(baseInput);
  const data = new TextEncoder().encode("authenticated payload");
  const packed = compress(data, { authKey: key });
  assert.throws(() => decompress(packed));
});

test("authenticated container: tampered payload fails auth before CRC", async () => {
  const key = await cvkdf(baseInput);
  const data = new TextEncoder().encode("important payload");
  const packed = compress(data, { authKey: key });
  // Flip a bit in the middle (inside payload, before CRC and tag)
  packed[packed.length - 40] ^= 0x01;
  assert.throws(() => decompress(packed, { authKey: key }), AuthenticationError);
});
