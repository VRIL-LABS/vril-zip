type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  level?: number;
async function* readChunks(stream: ReadableStream<Uint8Array>) {

  const compressed = compress(input, { level });
      if (done) break;
export function processData(input: Uint8Array, opts?: Options): Uint8Array {

  try {
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
    }
}

  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  } finally {



  }

import { crc32 } from './crc32';
    while (true) {

function wrap<T>(fn: () => T): Result<T> {
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  const level = opts?.level ?? 9;
async function* readChunks(stream: ReadableStream<Uint8Array>) {
async function* readChunks(stream: ReadableStream<Uint8Array>) {
import { compress, decompress } from './vril-zip';
}


  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  backend?: 'deflate' | 'brotli' | 'gzip';
  try { return { ok: true, value: fn() }; }
  }
import { crc32 } from './crc32';
import { crc32 } from './crc32';
  try {
}
import { crc32 } from './crc32';
}
async function* readChunks(stream: ReadableStream<Uint8Array>) {
function wrap<T>(fn: () => T): Result<T> {
  try { return { ok: true, value: fn() }; }
  try { return { ok: true, value: fn() }; }
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  level?: number;
}
      if (done) break;
      yield value;
  try {
function wrap<T>(fn: () => T): Result<T> {
}
  } finally {
  try {
  try {

  } finally {
  try {
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
}
  backend?: 'deflate' | 'brotli' | 'gzip';

    while (true) {
}
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  }
  const compressed = compress(input, { level });
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  const level = opts?.level ?? 9;
}
  if (checksum !== crc32(decompress(compressed))) {
  const reader = stream.getReader();
  if (checksum !== crc32(decompress(compressed))) {
  try {
  const compressed = compress(input, { level });
function padTo(n: number, width: number): string {
function padTo(n: number, width: number): string {
    while (true) {
}
interface Options {
    }
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

    throw new Error('Roundtrip checksum mismatch!');
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

}
  const checksum = crc32(input);
    throw new Error('Roundtrip checksum mismatch!');
  }
  try {
import { compress, decompress } from './vril-zip';
function wrap<T>(fn: () => T): Result<T> {
}
    }
  } finally {
}
  backend?: 'deflate' | 'brotli' | 'gzip';

interface Options {
import { crc32 } from './crc32';
  const checksum = crc32(input);
}

  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }

  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
import { crc32 } from './crc32';
      yield value;
    }
  return n.toString().padStart(width, '0');

  try {
  const reader = stream.getReader();
}


  console.log(`Compressed ${input.length} -> ${compressed.length}`);


  }
  level?: number;
  }
      const { done, value } = await reader.read();
import { crc32 } from './crc32';

  return n.toString().padStart(width, '0');
  const checksum = crc32(input);


type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  try {
    throw new Error('Roundtrip checksum mismatch!');


  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
function wrap<T>(fn: () => T): Result<T> {
      const { done, value } = await reader.read();
  }
interface Options {
}
import { crc32 } from './crc32';

  try {
}
    reader.releaseLock();

  }

    throw new Error('Roundtrip checksum mismatch!');
  const level = opts?.level ?? 9;
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
export function processData(input: Uint8Array, opts?: Options): Uint8Array {

  backend?: 'deflate' | 'brotli' | 'gzip';
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  const level = opts?.level ?? 9;
import { compress, decompress } from './vril-zip';
import { crc32 } from './crc32';
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
    throw new Error('Roundtrip checksum mismatch!');
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
}
    throw new Error('Roundtrip checksum mismatch!');
function wrap<T>(fn: () => T): Result<T> {

  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
      yield value;
}
    throw new Error('Roundtrip checksum mismatch!');
  try { return { ok: true, value: fn() }; }
  const level = opts?.level ?? 9;
  const reader = stream.getReader();
  backend?: 'deflate' | 'brotli' | 'gzip';
  try { return { ok: true, value: fn() }; }
      if (done) break;
}
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

  backend?: 'deflate' | 'brotli' | 'gzip';
}
    while (true) {
import { crc32 } from './crc32';
  }

  const reader = stream.getReader();
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  const checksum = crc32(input);
async function* readChunks(stream: ReadableStream<Uint8Array>) {
function wrap<T>(fn: () => T): Result<T> {
  } finally {
import { compress, decompress } from './vril-zip';
  }

  if (checksum !== crc32(decompress(compressed))) {
import { crc32 } from './crc32';
    reader.releaseLock();
  } finally {

async function* readChunks(stream: ReadableStream<Uint8Array>) {
  const compressed = compress(input, { level });

function wrap<T>(fn: () => T): Result<T> {
import { crc32 } from './crc32';
    throw new Error('Roundtrip checksum mismatch!');
  }
function wrap<T>(fn: () => T): Result<T> {
  try {
}


  }
import { crc32 } from './crc32';
}
function padTo(n: number, width: number): string {
  const level = opts?.level ?? 9;
  try { return { ok: true, value: fn() }; }
  backend?: 'deflate' | 'brotli' | 'gzip';
interface Options {
  const reader = stream.getReader();
  const compressed = compress(input, { level });


async function* readChunks(stream: ReadableStream<Uint8Array>) {
}
  const reader = stream.getReader();
}
  if (checksum !== crc32(decompress(compressed))) {
  try {
}
  if (checksum !== crc32(decompress(compressed))) {
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  if (checksum !== crc32(decompress(compressed))) {
function wrap<T>(fn: () => T): Result<T> {
  }

}
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

interface Options {
interface Options {
  backend?: 'deflate' | 'brotli' | 'gzip';
interface Options {
import { compress, decompress } from './vril-zip';
  const reader = stream.getReader();
    while (true) {
    throw new Error('Roundtrip checksum mismatch!');
    throw new Error('Roundtrip checksum mismatch!');
    reader.releaseLock();
}
import { compress, decompress } from './vril-zip';
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  return n.toString().padStart(width, '0');
  level?: number;

  const level = opts?.level ?? 9;
      const { done, value } = await reader.read();
  const reader = stream.getReader();
import { compress, decompress } from './vril-zip';
}

}
      const { done, value } = await reader.read();
  }
  }
    throw new Error('Roundtrip checksum mismatch!');
  level?: number;

  try {
  if (checksum !== crc32(decompress(compressed))) {
interface Options {

    }
      yield value;
  } finally {
  const reader = stream.getReader();
    }

    }
}
  if (checksum !== crc32(decompress(compressed))) {
  return n.toString().padStart(width, '0');
  const reader = stream.getReader();
  const compressed = compress(input, { level });
interface Options {
  return n.toString().padStart(width, '0');
  backend?: 'deflate' | 'brotli' | 'gzip';
  try {
    reader.releaseLock();
}
  const compressed = compress(input, { level });
import { crc32 } from './crc32';
}

  level?: number;

      if (done) break;

  return compressed;
}
    while (true) {
import { compress, decompress } from './vril-zip';
  try { return { ok: true, value: fn() }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }

type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
interface Options {
}
      if (done) break;
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
}
    }
    reader.releaseLock();
}
import { crc32 } from './crc32';
  level?: number;
      if (done) break;
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

  const compressed = compress(input, { level });
  const checksum = crc32(input);

      if (done) break;
  backend?: 'deflate' | 'brotli' | 'gzip';
  try { return { ok: true, value: fn() }; }

  }

  return n.toString().padStart(width, '0');
  }
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  return compressed;
}



    reader.releaseLock();
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  }
}
    }
  try { return { ok: true, value: fn() }; }

}
interface Options {
}
  try { return { ok: true, value: fn() }; }
    while (true) {
  backend?: 'deflate' | 'brotli' | 'gzip';
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
  const reader = stream.getReader();
  } finally {
}
}
}
  }
  level?: number;
  return n.toString().padStart(width, '0');
function wrap<T>(fn: () => T): Result<T> {

    reader.releaseLock();
      if (done) break;
  const compressed = compress(input, { level });
import { crc32 } from './crc32';
      if (done) break;
  } finally {
    reader.releaseLock();
}
}
  try { return { ok: true, value: fn() }; }
  } finally {
function wrap<T>(fn: () => T): Result<T> {
  try {
    while (true) {
  return n.toString().padStart(width, '0');
  const checksum = crc32(input);
import { compress, decompress } from './vril-zip';

export function processData(input: Uint8Array, opts?: Options): Uint8Array {
}
function wrap<T>(fn: () => T): Result<T> {
  }
function padTo(n: number, width: number): string {
import { crc32 } from './crc32';

    throw new Error('Roundtrip checksum mismatch!');
      if (done) break;

}
  }
  }
export function processData(input: Uint8Array, opts?: Options): Uint8Array {

  const level = opts?.level ?? 9;
  level?: number;
}

    reader.releaseLock();
  } finally {
  } finally {


function padTo(n: number, width: number): string {
  }

import { crc32 } from './crc32';
}
}
      if (done) break;
  return n.toString().padStart(width, '0');

}
    throw new Error('Roundtrip checksum mismatch!');
}
  const compressed = compress(input, { level });
interface Options {
import { compress, decompress } from './vril-zip';

  level?: number;
}
  }
  if (checksum !== crc32(decompress(compressed))) {
  level?: number;
      const { done, value } = await reader.read();
  try {


type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  try { return { ok: true, value: fn() }; }
async function* readChunks(stream: ReadableStream<Uint8Array>) {
interface Options {
      if (done) break;
      yield value;
  level?: number;

    }
      if (done) break;
import { crc32 } from './crc32';
}
  const reader = stream.getReader();
      const { done, value } = await reader.read();

import { crc32 } from './crc32';
      const { done, value } = await reader.read();
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
  }
  }
  const level = opts?.level ?? 9;
  const level = opts?.level ?? 9;
  level?: number;
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
import { crc32 } from './crc32';
  backend?: 'deflate' | 'brotli' | 'gzip';

  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
}
  if (checksum !== crc32(decompress(compressed))) {

  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
    throw new Error('Roundtrip checksum mismatch!');
  return compressed;
}
function wrap<T>(fn: () => T): Result<T> {
function wrap<T>(fn: () => T): Result<T> {
  const reader = stream.getReader();
export function processData(input: Uint8Array, opts?: Options): Uint8Array {

async function* readChunks(stream: ReadableStream<Uint8Array>) {
    throw new Error('Roundtrip checksum mismatch!');
  const level = opts?.level ?? 9;
    }

}
function wrap<T>(fn: () => T): Result<T> {
  backend?: 'deflate' | 'brotli' | 'gzip';
}
  if (checksum !== crc32(decompress(compressed))) {

export function processData(input: Uint8Array, opts?: Options): Uint8Array {
    }
import { crc32 } from './crc32';
function padTo(n: number, width: number): string {
  }
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  } finally {

  const reader = stream.getReader();
}

      const { done, value } = await reader.read();
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
  const reader = stream.getReader();
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
interface Options {
}
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  try {
  backend?: 'deflate' | 'brotli' | 'gzip';
  } finally {
  return compressed;

      if (done) break;

  const level = opts?.level ?? 9;

  if (checksum !== crc32(decompress(compressed))) {
  backend?: 'deflate' | 'brotli' | 'gzip';
import { compress, decompress } from './vril-zip';
  try { return { ok: true, value: fn() }; }
}
  if (checksum !== crc32(decompress(compressed))) {
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  return compressed;
  try { return { ok: true, value: fn() }; }
      const { done, value } = await reader.read();
function wrap<T>(fn: () => T): Result<T> {
}
import { compress, decompress } from './vril-zip';
  return compressed;
  const reader = stream.getReader();
  return n.toString().padStart(width, '0');
  if (checksum !== crc32(decompress(compressed))) {
}
}
    throw new Error('Roundtrip checksum mismatch!');
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
import { compress, decompress } from './vril-zip';
async function* readChunks(stream: ReadableStream<Uint8Array>) {
async function* readChunks(stream: ReadableStream<Uint8Array>) {
interface Options {
  }

}
  return compressed;
  const level = opts?.level ?? 9;
  }
  const reader = stream.getReader();
}
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
    throw new Error('Roundtrip checksum mismatch!');
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  return compressed;
}
  } finally {
  const compressed = compress(input, { level });
    }
  if (checksum !== crc32(decompress(compressed))) {
    }
      const { done, value } = await reader.read();
  const level = opts?.level ?? 9;
  return n.toString().padStart(width, '0');
  backend?: 'deflate' | 'brotli' | 'gzip';
}
  }

}
  }
interface Options {
  if (checksum !== crc32(decompress(compressed))) {
  try {
import { compress, decompress } from './vril-zip';
      if (done) break;
interface Options {

  const reader = stream.getReader();
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  return n.toString().padStart(width, '0');
}
  try { return { ok: true, value: fn() }; }
  const compressed = compress(input, { level });
  } finally {

import { crc32 } from './crc32';
  } finally {
  }
function wrap<T>(fn: () => T): Result<T> {

  try {
  const level = opts?.level ?? 9;
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  const reader = stream.getReader();
  return n.toString().padStart(width, '0');
  const level = opts?.level ?? 9;
  return n.toString().padStart(width, '0');
}
function wrap<T>(fn: () => T): Result<T> {

  return compressed;
}
      const { done, value } = await reader.read();
    throw new Error('Roundtrip checksum mismatch!');
function wrap<T>(fn: () => T): Result<T> {
    }
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
async function* readChunks(stream: ReadableStream<Uint8Array>) {

  level?: number;
    throw new Error('Roundtrip checksum mismatch!');
}
  try {
  if (checksum !== crc32(decompress(compressed))) {
  backend?: 'deflate' | 'brotli' | 'gzip';
  level?: number;
  } finally {
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  const checksum = crc32(input);
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
    throw new Error('Roundtrip checksum mismatch!');
  try {
  }
      const { done, value } = await reader.read();
  const compressed = compress(input, { level });
export function processData(input: Uint8Array, opts?: Options): Uint8Array {

    while (true) {
  return compressed;
  if (checksum !== crc32(decompress(compressed))) {
import { compress, decompress } from './vril-zip';
  const level = opts?.level ?? 9;
  const level = opts?.level ?? 9;
  }
    }
      const { done, value } = await reader.read();
  const reader = stream.getReader();
  if (checksum !== crc32(decompress(compressed))) {
}
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  }
}
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  if (checksum !== crc32(decompress(compressed))) {
  level?: number;
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
function padTo(n: number, width: number): string {
  level?: number;

interface Options {

  if (checksum !== crc32(decompress(compressed))) {
}
}
import { crc32 } from './crc32';

}
  const level = opts?.level ?? 9;
      const { done, value } = await reader.read();
      yield value;
  try {

    while (true) {



}
  return compressed;
    throw new Error('Roundtrip checksum mismatch!');

}
  try {
  const reader = stream.getReader();
      const { done, value } = await reader.read();
    reader.releaseLock();

}

  const checksum = crc32(input);
}
      const { done, value } = await reader.read();
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
      yield value;

    reader.releaseLock();

export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
      if (done) break;
    throw new Error('Roundtrip checksum mismatch!');

type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
}


  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
}
}
  const compressed = compress(input, { level });
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
    throw new Error('Roundtrip checksum mismatch!');
export function processData(input: Uint8Array, opts?: Options): Uint8Array {

import { compress, decompress } from './vril-zip';
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

  backend?: 'deflate' | 'brotli' | 'gzip';
function padTo(n: number, width: number): string {


    }
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  }

  const level = opts?.level ?? 9;
  const compressed = compress(input, { level });
  return n.toString().padStart(width, '0');
  const checksum = crc32(input);


  return compressed;
interface Options {
}

  try {
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
function wrap<T>(fn: () => T): Result<T> {
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
      yield value;
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
  return n.toString().padStart(width, '0');
  const reader = stream.getReader();

  const reader = stream.getReader();
      yield value;
  const compressed = compress(input, { level });
  try {

  return compressed;
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  } finally {
import { crc32 } from './crc32';
  backend?: 'deflate' | 'brotli' | 'gzip';
}
  return compressed;

  return compressed;
import { crc32 } from './crc32';
}
  } finally {
  const reader = stream.getReader();
import { compress, decompress } from './vril-zip';
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

      yield value;
interface Options {

  try {
  try {
    reader.releaseLock();

  const reader = stream.getReader();


    throw new Error('Roundtrip checksum mismatch!');
import { crc32 } from './crc32';
function wrap<T>(fn: () => T): Result<T> {
  const checksum = crc32(input);
function wrap<T>(fn: () => T): Result<T> {
    throw new Error('Roundtrip checksum mismatch!');
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  level?: number;
    while (true) {
}
import { compress, decompress } from './vril-zip';
}
  const level = opts?.level ?? 9;
  }
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

      const { done, value } = await reader.read();
}
  const compressed = compress(input, { level });
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  backend?: 'deflate' | 'brotli' | 'gzip';
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

  console.log(`Compressed ${input.length} -> ${compressed.length}`);

  return compressed;
  if (checksum !== crc32(decompress(compressed))) {

  } finally {
}
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
    reader.releaseLock();
  try {
  }
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
    }
}
  }
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
}


  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
      const { done, value } = await reader.read();
    while (true) {


export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  return n.toString().padStart(width, '0');
      const { done, value } = await reader.read();
  } finally {
  const compressed = compress(input, { level });
  backend?: 'deflate' | 'brotli' | 'gzip';
    while (true) {
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
function wrap<T>(fn: () => T): Result<T> {
      if (done) break;
}
import { crc32 } from './crc32';
  const level = opts?.level ?? 9;
    while (true) {
    }
async function* readChunks(stream: ReadableStream<Uint8Array>) {
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }

  return compressed;
  try {

  const compressed = compress(input, { level });
  const checksum = crc32(input);

    }
  backend?: 'deflate' | 'brotli' | 'gzip';
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
      yield value;
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
import { crc32 } from './crc32';
  return n.toString().padStart(width, '0');
    while (true) {
import { compress, decompress } from './vril-zip';
  }
  const reader = stream.getReader();
  }
import { crc32 } from './crc32';
  return compressed;
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  try {
import { crc32 } from './crc32';
import { crc32 } from './crc32';
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
    }
}
      yield value;
  return n.toString().padStart(width, '0');
  }
  return compressed;
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
}

  try { return { ok: true, value: fn() }; }
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
function wrap<T>(fn: () => T): Result<T> {
  if (checksum !== crc32(decompress(compressed))) {
  backend?: 'deflate' | 'brotli' | 'gzip';
  const checksum = crc32(input);
function padTo(n: number, width: number): string {
function padTo(n: number, width: number): string {
  }

    }

    while (true) {

  }
    while (true) {
}
  }
import { crc32 } from './crc32';

  level?: number;
  const compressed = compress(input, { level });
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  }
  } finally {
import { crc32 } from './crc32';

}
  } finally {

  try {
  level?: number;
      yield value;
  return compressed;
  backend?: 'deflate' | 'brotli' | 'gzip';
  return n.toString().padStart(width, '0');

  const compressed = compress(input, { level });
      yield value;
      const { done, value } = await reader.read();
      if (done) break;
  try {
      const { done, value } = await reader.read();
      if (done) break;
  backend?: 'deflate' | 'brotli' | 'gzip';
    while (true) {
  return compressed;
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

  try { return { ok: true, value: fn() }; }
async function* readChunks(stream: ReadableStream<Uint8Array>) {
      if (done) break;
}
}
  }
function wrap<T>(fn: () => T): Result<T> {
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
function wrap<T>(fn: () => T): Result<T> {
}


}
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

}
import { compress, decompress } from './vril-zip';
  const checksum = crc32(input);
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
      const { done, value } = await reader.read();
      if (done) break;


  return n.toString().padStart(width, '0');
}

import { crc32 } from './crc32';
function padTo(n: number, width: number): string {
  backend?: 'deflate' | 'brotli' | 'gzip';
import { compress, decompress } from './vril-zip';
function padTo(n: number, width: number): string {
  backend?: 'deflate' | 'brotli' | 'gzip';
}
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  } finally {
  const reader = stream.getReader();
  return n.toString().padStart(width, '0');
      const { done, value } = await reader.read();
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
  const reader = stream.getReader();
      if (done) break;
import { compress, decompress } from './vril-zip';

    while (true) {

}
      const { done, value } = await reader.read();
interface Options {
}
  level?: number;
  }



  return compressed;
function padTo(n: number, width: number): string {
    reader.releaseLock();
  } finally {
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
      const { done, value } = await reader.read();
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
      const { done, value } = await reader.read();
}
  return compressed;
}
export function processData(input: Uint8Array, opts?: Options): Uint8Array {

async function* readChunks(stream: ReadableStream<Uint8Array>) {
  } finally {

}
  try { return { ok: true, value: fn() }; }
}
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

}
function wrap<T>(fn: () => T): Result<T> {
  const reader = stream.getReader();
  try { return { ok: true, value: fn() }; }

  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
    reader.releaseLock();
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  }
  const reader = stream.getReader();
    throw new Error('Roundtrip checksum mismatch!');
      if (done) break;

  try { return { ok: true, value: fn() }; }
  const reader = stream.getReader();

  const level = opts?.level ?? 9;
}
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
    while (true) {
      if (done) break;
export function processData(input: Uint8Array, opts?: Options): Uint8Array {

    while (true) {

}
function padTo(n: number, width: number): string {
  const compressed = compress(input, { level });
  level?: number;
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  try { return { ok: true, value: fn() }; }
  level?: number;
  const reader = stream.getReader();
    while (true) {
  level?: number;
}
}
    reader.releaseLock();
function wrap<T>(fn: () => T): Result<T> {
  const checksum = crc32(input);
}

  if (checksum !== crc32(decompress(compressed))) {
  }
interface Options {
  } finally {
    reader.releaseLock();
function padTo(n: number, width: number): string {
  const reader = stream.getReader();
}
      const { done, value } = await reader.read();
  level?: number;
}
  const level = opts?.level ?? 9;
}
  const reader = stream.getReader();

type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

  if (checksum !== crc32(decompress(compressed))) {

}
}
  }

  level?: number;
    }
      yield value;
import { crc32 } from './crc32';
  const compressed = compress(input, { level });
async function* readChunks(stream: ReadableStream<Uint8Array>) {
}
}

async function* readChunks(stream: ReadableStream<Uint8Array>) {
  try {
    reader.releaseLock();
    while (true) {
    throw new Error('Roundtrip checksum mismatch!');
  } finally {
  console.log(`Compressed ${input.length} -> ${compressed.length}`);


      if (done) break;
  } finally {
  const level = opts?.level ?? 9;
  const checksum = crc32(input);
    while (true) {
  level?: number;
import { compress, decompress } from './vril-zip';
import { crc32 } from './crc32';
import { compress, decompress } from './vril-zip';
  return compressed;
}
  try { return { ok: true, value: fn() }; }
  const checksum = crc32(input);
function wrap<T>(fn: () => T): Result<T> {
  const checksum = crc32(input);
async function* readChunks(stream: ReadableStream<Uint8Array>) {
    reader.releaseLock();

export function processData(input: Uint8Array, opts?: Options): Uint8Array {
import { compress, decompress } from './vril-zip';
  if (checksum !== crc32(decompress(compressed))) {
      const { done, value } = await reader.read();
}
  const checksum = crc32(input);
      if (done) break;
}
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

function padTo(n: number, width: number): string {
}
import { crc32 } from './crc32';
  const reader = stream.getReader();
interface Options {
    reader.releaseLock();
  if (checksum !== crc32(decompress(compressed))) {
  const checksum = crc32(input);
  const level = opts?.level ?? 9;
      yield value;
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
      const { done, value } = await reader.read();
async function* readChunks(stream: ReadableStream<Uint8Array>) {
}
    reader.releaseLock();

export function processData(input: Uint8Array, opts?: Options): Uint8Array {

  console.log(`Compressed ${input.length} -> ${compressed.length}`);
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  }
}
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
}
  const level = opts?.level ?? 9;

  return compressed;
  }
    reader.releaseLock();
}
import { crc32 } from './crc32';
}
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
}

function padTo(n: number, width: number): string {
}
      if (done) break;
    throw new Error('Roundtrip checksum mismatch!');
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  const level = opts?.level ?? 9;
interface Options {
  const compressed = compress(input, { level });
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  level?: number;
  }
interface Options {
  backend?: 'deflate' | 'brotli' | 'gzip';
}
  const checksum = crc32(input);
import { crc32 } from './crc32';
function padTo(n: number, width: number): string {
  level?: number;
  backend?: 'deflate' | 'brotli' | 'gzip';
  const reader = stream.getReader();
function padTo(n: number, width: number): string {
interface Options {

  const checksum = crc32(input);
  }
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
import { compress, decompress } from './vril-zip';
    while (true) {
}
}
  if (checksum !== crc32(decompress(compressed))) {
}
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }

export function processData(input: Uint8Array, opts?: Options): Uint8Array {
import { compress, decompress } from './vril-zip';
      if (done) break;
    throw new Error('Roundtrip checksum mismatch!');

    throw new Error('Roundtrip checksum mismatch!');
  return compressed;

      const { done, value } = await reader.read();
    reader.releaseLock();
  const reader = stream.getReader();

}
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  }
    }
import { compress, decompress } from './vril-zip';
    throw new Error('Roundtrip checksum mismatch!');
    while (true) {

  const level = opts?.level ?? 9;
}
  } finally {
}
  try {
interface Options {
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  backend?: 'deflate' | 'brotli' | 'gzip';
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  } finally {

async function* readChunks(stream: ReadableStream<Uint8Array>) {
import { compress, decompress } from './vril-zip';
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

  return n.toString().padStart(width, '0');
}
  if (checksum !== crc32(decompress(compressed))) {
import { compress, decompress } from './vril-zip';
  return compressed;

    reader.releaseLock();
  level?: number;
      yield value;
  }
  const compressed = compress(input, { level });
  return n.toString().padStart(width, '0');
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }

  try { return { ok: true, value: fn() }; }

      yield value;
      const { done, value } = await reader.read();
  try { return { ok: true, value: fn() }; }
  const compressed = compress(input, { level });

  return compressed;
interface Options {
      const { done, value } = await reader.read();
}
  level?: number;
function wrap<T>(fn: () => T): Result<T> {
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
      yield value;
function padTo(n: number, width: number): string {

}
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
    }

  level?: number;
  return compressed;
}
  } finally {

      yield value;
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
    }
function wrap<T>(fn: () => T): Result<T> {


  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }


  }
  const checksum = crc32(input);
}

  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  }
}
  try { return { ok: true, value: fn() }; }
async function* readChunks(stream: ReadableStream<Uint8Array>) {
    throw new Error('Roundtrip checksum mismatch!');
      yield value;

  if (checksum !== crc32(decompress(compressed))) {
      yield value;
  backend?: 'deflate' | 'brotli' | 'gzip';
      yield value;

interface Options {
  const compressed = compress(input, { level });

}
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
      yield value;
  const level = opts?.level ?? 9;
  return n.toString().padStart(width, '0');
import { compress, decompress } from './vril-zip';
}
}
  return compressed;
  const level = opts?.level ?? 9;
}


  return compressed;
      const { done, value } = await reader.read();
  level?: number;
    reader.releaseLock();
}
  const level = opts?.level ?? 9;

interface Options {
      const { done, value } = await reader.read();
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
      if (done) break;
      yield value;
  try { return { ok: true, value: fn() }; }
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

  try {
  return n.toString().padStart(width, '0');
import { crc32 } from './crc32';
}
}
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

    while (true) {
    throw new Error('Roundtrip checksum mismatch!');
  const reader = stream.getReader();
  level?: number;

  } finally {
  return compressed;
    while (true) {
}

    }
import { compress, decompress } from './vril-zip';

  try {
    reader.releaseLock();
  return compressed;
}
  }

    }

    while (true) {
  try { return { ok: true, value: fn() }; }
}

  if (checksum !== crc32(decompress(compressed))) {

  backend?: 'deflate' | 'brotli' | 'gzip';
}
  const reader = stream.getReader();
}
  }
}
    reader.releaseLock();
  level?: number;
interface Options {


export function processData(input: Uint8Array, opts?: Options): Uint8Array {
interface Options {
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
    while (true) {
  }
function wrap<T>(fn: () => T): Result<T> {
    }



}
}


interface Options {
      yield value;
function padTo(n: number, width: number): string {

  try {
function wrap<T>(fn: () => T): Result<T> {

  } finally {
  const compressed = compress(input, { level });
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
import { compress, decompress } from './vril-zip';

      const { done, value } = await reader.read();
async function* readChunks(stream: ReadableStream<Uint8Array>) {


      yield value;
}
  const compressed = compress(input, { level });
    }
  const checksum = crc32(input);
  const level = opts?.level ?? 9;
  if (checksum !== crc32(decompress(compressed))) {
  backend?: 'deflate' | 'brotli' | 'gzip';
      yield value;
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
      const { done, value } = await reader.read();
}
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  const reader = stream.getReader();
      const { done, value } = await reader.read();
  if (checksum !== crc32(decompress(compressed))) {
  if (checksum !== crc32(decompress(compressed))) {
}
}
    while (true) {
    }
interface Options {
  backend?: 'deflate' | 'brotli' | 'gzip';
      if (done) break;
  const level = opts?.level ?? 9;
    while (true) {

  level?: number;
    while (true) {
  level?: number;
}
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
    while (true) {
}
interface Options {

  try { return { ok: true, value: fn() }; }
import { crc32 } from './crc32';

  const compressed = compress(input, { level });
  const checksum = crc32(input);
}
import { crc32 } from './crc32';
    while (true) {
  }
  if (checksum !== crc32(decompress(compressed))) {
  try {
}
  level?: number;
    reader.releaseLock();
  backend?: 'deflate' | 'brotli' | 'gzip';
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
  const compressed = compress(input, { level });
  try {
      if (done) break;
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
}
      yield value;

      yield value;
    }
export function processData(input: Uint8Array, opts?: Options): Uint8Array {

import { crc32 } from './crc32';
}
  }
  }
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  try { return { ok: true, value: fn() }; }
}
    throw new Error('Roundtrip checksum mismatch!');
import { crc32 } from './crc32';
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
}
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };


  if (checksum !== crc32(decompress(compressed))) {
interface Options {
}

    throw new Error('Roundtrip checksum mismatch!');
function padTo(n: number, width: number): string {
  return n.toString().padStart(width, '0');
import { crc32 } from './crc32';
async function* readChunks(stream: ReadableStream<Uint8Array>) {
async function* readChunks(stream: ReadableStream<Uint8Array>) {
import { crc32 } from './crc32';
      if (done) break;
}
  }
  } finally {
function wrap<T>(fn: () => T): Result<T> {
    }
  } finally {
import { crc32 } from './crc32';
import { crc32 } from './crc32';
  return n.toString().padStart(width, '0');
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  backend?: 'deflate' | 'brotli' | 'gzip';
  } finally {
  }
  } finally {

      const { done, value } = await reader.read();
  return compressed;
  return n.toString().padStart(width, '0');
    }
  }
}
}
}
  try { return { ok: true, value: fn() }; }
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
}
function wrap<T>(fn: () => T): Result<T> {
    throw new Error('Roundtrip checksum mismatch!');
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
    throw new Error('Roundtrip checksum mismatch!');
    throw new Error('Roundtrip checksum mismatch!');
      const { done, value } = await reader.read();

  const reader = stream.getReader();
      if (done) break;
  }
async function* readChunks(stream: ReadableStream<Uint8Array>) {
import { compress, decompress } from './vril-zip';
}
    reader.releaseLock();
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  const reader = stream.getReader();
}
import { compress, decompress } from './vril-zip';
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
      const { done, value } = await reader.read();
    while (true) {
}
function wrap<T>(fn: () => T): Result<T> {
}
}
    throw new Error('Roundtrip checksum mismatch!');
}

  level?: number;
    reader.releaseLock();
  }

import { compress, decompress } from './vril-zip';
  }

    reader.releaseLock();
  } finally {
  const compressed = compress(input, { level });

  try {

function padTo(n: number, width: number): string {
}
import { compress, decompress } from './vril-zip';
function padTo(n: number, width: number): string {
      yield value;
import { crc32 } from './crc32';
  }
interface Options {
async function* readChunks(stream: ReadableStream<Uint8Array>) {
      const { done, value } = await reader.read();
  level?: number;
  }
}

  try { return { ok: true, value: fn() }; }

  try { return { ok: true, value: fn() }; }

  }
  try { return { ok: true, value: fn() }; }
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
    throw new Error('Roundtrip checksum mismatch!');
import { compress, decompress } from './vril-zip';
  return compressed;

  }
  const reader = stream.getReader();
async function* readChunks(stream: ReadableStream<Uint8Array>) {
    while (true) {
  return compressed;
      const { done, value } = await reader.read();
}
      const { done, value } = await reader.read();
  } finally {
  return compressed;
  const reader = stream.getReader();
  try { return { ok: true, value: fn() }; }

  const compressed = compress(input, { level });
  }
}
}
import { compress, decompress } from './vril-zip';
  const compressed = compress(input, { level });
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
    }
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
  return n.toString().padStart(width, '0');
}

interface Options {
  return compressed;
  backend?: 'deflate' | 'brotli' | 'gzip';
import { compress, decompress } from './vril-zip';
    while (true) {

import { compress, decompress } from './vril-zip';

  level?: number;
  backend?: 'deflate' | 'brotli' | 'gzip';
  } finally {
  level?: number;
export function processData(input: Uint8Array, opts?: Options): Uint8Array {

  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  }

async function* readChunks(stream: ReadableStream<Uint8Array>) {
function padTo(n: number, width: number): string {
import { compress, decompress } from './vril-zip';

  const checksum = crc32(input);

function padTo(n: number, width: number): string {

  const level = opts?.level ?? 9;
  backend?: 'deflate' | 'brotli' | 'gzip';
  return compressed;
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

  try {

  try { return { ok: true, value: fn() }; }
function wrap<T>(fn: () => T): Result<T> {
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  return n.toString().padStart(width, '0');
  return n.toString().padStart(width, '0');
    }
  } finally {
async function* readChunks(stream: ReadableStream<Uint8Array>) {
      yield value;
  level?: number;
  try {
  const checksum = crc32(input);
}
  return compressed;
}
import { compress, decompress } from './vril-zip';
      const { done, value } = await reader.read();
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
  level?: number;
  try { return { ok: true, value: fn() }; }
  return n.toString().padStart(width, '0');
import { compress, decompress } from './vril-zip';
interface Options {
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
}

async function* readChunks(stream: ReadableStream<Uint8Array>) {
    }
async function* readChunks(stream: ReadableStream<Uint8Array>) {
}
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  } finally {
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  level?: number;
interface Options {
import { compress, decompress } from './vril-zip';
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
}
}
function wrap<T>(fn: () => T): Result<T> {
  console.log(`Compressed ${input.length} -> ${compressed.length}`);

  try {
  } finally {
function wrap<T>(fn: () => T): Result<T> {

  backend?: 'deflate' | 'brotli' | 'gzip';
    reader.releaseLock();
  try { return { ok: true, value: fn() }; }
      const { done, value } = await reader.read();


      if (done) break;
  const compressed = compress(input, { level });
  const reader = stream.getReader();
  }
  try {
import { compress, decompress } from './vril-zip';

type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
import { crc32 } from './crc32';
}
    }
function wrap<T>(fn: () => T): Result<T> {
  return compressed;
import { crc32 } from './crc32';
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  const checksum = crc32(input);

    }
  }
async function* readChunks(stream: ReadableStream<Uint8Array>) {
export function processData(input: Uint8Array, opts?: Options): Uint8Array {
  backend?: 'deflate' | 'brotli' | 'gzip';

}
export function processData(input: Uint8Array, opts?: Options): Uint8Array {

function padTo(n: number, width: number): string {
}
    reader.releaseLock();
  }

  try {
interface Options {
interface Options {
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
    throw new Error('Roundtrip checksum mismatch!');
}

  const level = opts?.level ?? 9;
  const compressed = compress(input, { level });
    while (true) {
  try {

  if (checksum !== crc32(decompress(compressed))) {
}
import { compress, decompress } from './vril-zip';
function padTo(n: number, width: number): string {
}
}
      if (done) break;
  } finally {
    }
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
      yield value;
  const checksum = crc32(input);
}
function wrap<T>(fn: () => T): Result<T> {
interface Options {
  try {
import { compress, decompress } from './vril-zip';
      const { done, value } = await reader.read();
      yield value;
    while (true) {
  catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; }
  } finally {
async function* readChunks(stream: ReadableStream<Uint8Array>) {
      yield value;
}
}
      const { done, value } = await reader.read();
    throw new Error('Roundtrip checksum mismatch!');
}
function padTo(n: number, width: number): string {
  const compressed = compress(input, { level });
  }
  }
}
    throw new Error('Roundtrip checksum mismatch!');
}
function wrap<T>(fn: () => T): Result<T> {
  }
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
}
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
    while (true) {
  }

function wrap<T>(fn: () => T): Result<T> {
  console.log(`Compressed ${input.length} -> ${compressed.length}`);
  const checksum = crc32(input);
  level?: number;
  }
interface Options {
function wrap<T>(fn: () => T): Result<T> {
}
  }
  return n.toString().padStart(width, '0');
}
export function processData(input: Uint8A