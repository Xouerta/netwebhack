import type {NbtElement} from "../nbt/element/NbtElement.ts";

export interface Codec<A> {
    encode(value: A): NbtElement;

    decode(value: NbtElement): A | null;
}