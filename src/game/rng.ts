/** Tohumlu rastgele sayı üreteci (mulberry32). Aynı tohum, aynı dizi. */
export class Rng {
  private s: number;

  constructor(tohum: number) {
    this.s = tohum >>> 0;
  }

  /** [0,1) aralığında sayı. */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** min ve max dahil tamsayı. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** p olasılıkla true. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Karıştırılmış kopya (Fisher-Yates). */
  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
