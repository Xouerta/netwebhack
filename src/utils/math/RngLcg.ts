import type {Seed} from "../../core/Seed.ts";
import {Rng} from "./Rng.ts";

export class RngLcg extends Rng {
    private static readonly A = 1664525;
    private static readonly C = 1013904223;

    private state: number;

    public constructor(seed: Seed, stream: number = 0) {
        super();
        this.state = seed.expand(1, stream)[0];
    }

    public next() {
        this.state = (Math.imul(RngLcg.A, this.state) + RngLcg.C) >>> 0;
        return this.state;
    }
}