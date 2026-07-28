import {rotl} from "./math.ts";
import type {Seed} from "../../core/Seed.ts";
import {Rng} from "./Rng.ts";

export class RngXor extends Rng {
    private readonly state: Uint32Array;

    public constructor(seed: Seed, stream: number = 0) {
        super();
        // 用 80-bit 种子展开为 4×uint32（xoshiro128** 所需）
        this.state = seed.expand(4, stream);
        if (this.state.every(v => v === 0)) this.state[0] = 1;
    }

    public next(): number {
        const s = this.state;
        const result = (Math.imul(rotl(Math.imul(s[1], 5) >>> 0, 7), 9)) >>> 0;
        const t = (s[1] << 9) >>> 0;
        s[2] ^= s[0];
        s[3] ^= s[1];
        s[1] ^= s[2];
        s[0] ^= s[3];
        s[2] ^= t;
        s[3] = rotl(s[3], 11) >>> 0;
        return result;
    }
}

