import type {PlayerEntity} from "../entity/PlayerEntity.ts";
import type {MobEntity} from "../entity/MobEntity.ts";
import type {BiConsumer} from "../types.ts";

export interface GameEvent {
    title: string;
    desc: string;
    options: EventOption[];
}

export interface EventOption {
    text: string;
    effect: (player: PlayerEntity, mobs: MobEntity[], log: BiConsumer<string, string>) => void;
}