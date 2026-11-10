/**
 * Incremental SHA-256 (FIPS 180-4) in plain TypeScript.
 *
 * WebCrypto only hashes a whole buffer at once, which would force re-reading
 * multi-gigabyte model files after the download. This implementation hashes
 * each network chunk as it arrives, and its state can be exported so a paused
 * download resumes hashing exactly where it stopped.
 */

const K = new Int32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const INITIAL = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19,
];

const BLOCK = 64;

/** Serializable snapshot of a hash in progress. */
export type Sha256State = {
  /** Eight 32-bit working variables, as signed integers. */
  h: number[];
  /** Bytes not yet forming a full 64-byte block, hex encoded. */
  pending: string;
  /** Total bytes consumed so far. */
  length: number;
};

export function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 1)
    out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length >> 1);
  for (let i = 0; i < out.length; i += 1)
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export class Sha256 {
  private h = Int32Array.from(INITIAL);
  private readonly w = new Int32Array(64);
  private readonly buffer = new Uint8Array(BLOCK);
  private buffered = 0;
  private total = 0;
  private finished = false;

  /** Total bytes hashed so far. */
  get length(): number {
    return this.total;
  }

  update(data: Uint8Array): this {
    if (this.finished) throw new Error("Sha256: digest already produced.");
    let offset = 0;
    const size = data.length;
    this.total += size;
    if (this.buffered > 0) {
      const take = Math.min(BLOCK - this.buffered, size);
      this.buffer.set(data.subarray(0, take), this.buffered);
      this.buffered += take;
      offset = take;
      if (this.buffered < BLOCK) return this;
      this.compress(this.buffer, 0);
      this.buffered = 0;
    }
    for (; offset + BLOCK <= size; offset += BLOCK) this.compress(data, offset);
    if (offset < size) {
      this.buffer.set(data.subarray(offset), 0);
      this.buffered = size - offset;
    }
    return this;
  }

  /** Finishes the hash. The instance cannot be updated afterwards. */
  digest(): Uint8Array {
    if (!this.finished) {
      const bitsHigh = Math.floor(this.total / 0x20000000);
      const bitsLow = (this.total << 3) >>> 0;
      const padLength =
        this.buffered < 56 ? 56 - this.buffered : 120 - this.buffered;
      const tail = new Uint8Array(padLength + 8);
      tail[0] = 0x80;
      const view = new DataView(tail.buffer);
      view.setUint32(padLength, bitsHigh, false);
      view.setUint32(padLength + 4, bitsLow, false);
      const total = this.total;
      this.update(tail);
      this.total = total;
      this.finished = true;
    }
    const out = new Uint8Array(32);
    const view = new DataView(out.buffer);
    for (let i = 0; i < 8; i += 1) view.setInt32(i * 4, this.h[i], false);
    return out;
  }

  hex(): string {
    return bytesToHex(this.digest());
  }

  /** Snapshot that `Sha256.restore` turns back into a live hasher. */
  save(): Sha256State {
    if (this.finished) throw new Error("Sha256: digest already produced.");
    return {
      h: Array.from(this.h),
      pending: bytesToHex(this.buffer.subarray(0, this.buffered)),
      length: this.total,
    };
  }

  static restore(state: Sha256State): Sha256 {
    const pending = hexToBytes(state.pending);
    if (
      state.h.length !== 8 ||
      pending.length >= BLOCK ||
      !Number.isSafeInteger(state.length) ||
      state.length < 0 ||
      state.length % BLOCK !== pending.length
    )
      throw new Error("Sha256: invalid saved state.");
    const hasher = new Sha256();
    hasher.h = Int32Array.from(state.h);
    hasher.buffer.set(pending, 0);
    hasher.buffered = pending.length;
    hasher.total = state.length;
    return hasher;
  }

  private compress(data: Uint8Array, start: number): void {
    const w = this.w;
    for (let i = 0; i < 16; i += 1) {
      const j = start + i * 4;
      w[i] =
        (data[j] << 24) |
        (data[j + 1] << 16) |
        (data[j + 2] << 8) |
        data[j + 3];
    }
    for (let i = 16; i < 64; i += 1) {
      const x = w[i - 15];
      const y = w[i - 2];
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      const s1 =
        ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    const h = this.h;
    let a = h[0];
    let b = h[1];
    let c = h[2];
    let d = h[3];
    let e = h[4];
    let f = h[5];
    let g = h[6];
    let hh = h[7];
    for (let i = 0; i < 64; i += 1) {
      const s1 =
        ((e >>> 6) | (e << 26)) ^
        ((e >>> 11) | (e << 21)) ^
        ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + s1 + ch + K[i] + w[i]) | 0;
      const s0 =
        ((a >>> 2) | (a << 30)) ^
        ((a >>> 13) | (a << 19)) ^
        ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + maj) | 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + hh) | 0;
  }
}

export function sha256Hex(data: Uint8Array): string {
  return new Sha256().update(data).hex();
}
