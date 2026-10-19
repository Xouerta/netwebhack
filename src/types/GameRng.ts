import type {Rng} from "../utils/math/Rng.ts";
import type {Seed} from "../core/Seed.ts";
import {RngXor} from "../utils/math/RngXor.ts";
import {RngLcg} from "../utils/math/RngLcg.ts";

export class GameRng {
    public readonly maze: Rng;
    public readonly goal: Rng;
    public readonly item: Rng;
    public readonly monster: Rng;
    public readonly event: Rng;

    public constructor(seed: Seed) {
        this.maze = new RngXor(seed);
        this.goal = new RngLcg(seed, 1);
        this.item = new RngLcg(seed, 2);
        this.monster = new RngLcg(seed, 3);
        this.event = new RngLcg(seed, 4);
    }
}
