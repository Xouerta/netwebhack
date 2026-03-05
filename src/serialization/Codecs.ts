import type {Codec} from "./Codec.ts";
import {config} from "../utils/uit.ts";
import type {NbtCompound} from "../nbt/element/NbtCompound.ts";
import {NbtInt8} from "../nbt/element/NbtInt8.ts";
import {NbtInt32} from "../nbt/element/NbtInt32.ts";
import {NbtUint32} from "../nbt/element/NbtUint32.ts";
import {NbtFloat} from "../nbt/element/NbtFloat.ts";
import {NbtDouble} from "../nbt/element/NbtDouble.ts";
import {NbtString} from "../nbt/element/NbtString.ts";
import type {NbtElement} from "../nbt/element/NbtElement.ts";

export class Codecs {
    public static readonly INT8: Codec<number> = this.of(
        value => NbtInt8.of(value),
        input => input.value
    );

    public static readonly INT32: Codec<number> = this.of(
        value => NbtInt32.of(value),
        input => input.value
    );

    public static readonly UINT32: Codec<number> = this.of(
        value => NbtUint32.of(value),
        input => input.value
    );

    public static readonly FLOAT: Codec<number> = this.of(
        value => NbtFloat.of(value),
        input => input.value
    );

    public static readonly DOABLE: Codec<number> = this.of(
        value => NbtDouble.of(value),
        input => input.value
    );

    public static readonly STRING: Codec<string> = this.of(
        value => NbtString.of(value),
        input => input.value
    );

    public static readonly BOOLEAN: Codec<boolean> = this.of(
        value => NbtInt8.bool(value),
        input => input.value !== 0
    );

    public static readonly NBT_COMPOUND: Codec<NbtCompound> = this.of(
        value => value,
        input => input
    );

    public static of<A, T extends NbtElement>(
        encoder: (value: A) => T,
        decoder: (value: T) => A | null
    ): Codec<A> {
        return config({
            encode: encoder,
            decode: decoder
        });
    }
}