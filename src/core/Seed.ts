export class Seed {
    private static readonly SEED_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    private static readonly SEED_LENGTH = 16;
    private static readonly BITS_PER_CHAR = 5; // log2(32)

    /** 16 个 5-bit 值 (0–31) */
    private readonly values: readonly number[];
    private readonly cache: string;

    public constructor(seedStr: string) {
        const normalized = seedStr.trim().toUpperCase();

        if (normalized.length !== Seed.SEED_LENGTH) {
            throw new Error(
                `Seed must be exactly ${Seed.SEED_LENGTH} characters, got ${normalized.length}`
            );
        }

        const vals: number[] = [];
        for (const ch of normalized) {
            const idx = Seed.SEED_ALPHABET.indexOf(ch);
            if (idx === -1) {
                throw new Error(`Invalid seed character: '${ch}'`);
            }
            vals.push(idx);
        }

        this.values = Object.freeze(vals);
        this.cache = this.values.map(v => Seed.SEED_ALPHABET[v]).join('');
        Object.freeze(this);
    }

    /** 返回 16 个 0–31 的数值（用于 RNG 初始化） */
    public getValues(): readonly number[] {
        return this.values;
    }

    public toString(): string {
        return this.cache;
    }

    /**
     * 将 80-bit 种子通过 SplitMix32 展开为 n 个 uint32，
     * 适用于需要更大状态的 PRNG（如 xoshiro256** 需要 256 bit）。
     */
    public expand(count: number, stream: number = 0): Uint32Array {
        // 先把 16×5bit 打包为连续的 32-bit 块作为初始熵
        const packed = this.packToUint32();
        // 用 SplitMix32 逐步展开
        const result = new Uint32Array(count);

        let state = (packed[0] ^ Math.imul(stream + 1, 0x9E3779B9)) >>> 0;
        for (let i = 0; i < count; i++) {
            state = (state + 0x9E3779B9) >>> 0;
            let z = state;
            z = (z ^ (z >>> 16)) >>> 0;
            z = Math.imul(z, 0x85EBCA6B) >>> 0;
            z = (z ^ (z >>> 13)) >>> 0;
            z = Math.imul(z, 0xC2B2AE35) >>> 0;
            z = (z ^ (z >>> 16)) >>> 0;
            // 混入后续 packed 块（循环使用）
            z = (z ^ packed[(i + 1) % packed.length]) >>> 0;
            result[i] = z;
        }
        return result;
    }

    /** 将 16×5bit 打包为 3 个 uint32（80 bit → 3×32，尾部补零） */
    private packToUint32(): Uint32Array {
        const out = new Uint32Array(3);
        let bitPos = 0;
        for (const v of this.values) {
            const wordIdx = bitPos >>> 5;        // / 32
            const bitOff = bitPos & 31;         // % 32
            out[wordIdx] = (out[wordIdx] | (v << bitOff)) >>> 0;
            if (bitOff + Seed.BITS_PER_CHAR > 32) {
                // 跨字边界
                out[wordIdx + 1] = (out[wordIdx + 1] | (v >>> (32 - bitOff))) >>> 0;
            }
            bitPos += Seed.BITS_PER_CHAR;
        }
        return out;
    }

    /** 校验字符串是否为合法种子 */
    public static isValid(s: string): boolean {
        const t = s.trim().toUpperCase();
        if (t.length !== Seed.SEED_LENGTH) return false;
        return [...t].every(ch => Seed.SEED_ALPHABET.includes(ch));
    }

    /** 生成随机种子字符串（与 genSeed 逻辑一致） */
    public static generate(): string {
        const rv = new Uint32Array(Seed.SEED_LENGTH);
        crypto.getRandomValues(rv);
        return Iterator.from(rv)
            .map(v => Seed.SEED_ALPHABET[v % Seed.SEED_ALPHABET.length])
            .toArray()
            .join('');
    }
}
