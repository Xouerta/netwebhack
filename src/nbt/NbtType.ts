import type {NbtElement} from "./element/NbtElement.ts";
import type {BinaryReader} from "./BinaryReader.ts";
import {config} from "../utils/uit.ts";

export interface NbtType<T extends NbtElement> {
    read(reader: BinaryReader): T;
}

export const NbtTypeId = config({
    End: 0,
    Int8: 1,
    Int16: 2,
    Int32: 3,
    Float: 4,
    Double: 5,
    Uint32: 6,
    String: 7,
    Compound: 8,
    Int8Array: 9,
    Int16Array: 10,
    Int32Array: 11,
    FloatArray: 12,
    DoubleArray: 13,
    Uint32Array: 14,
    StringArray: 15,
    CompoundArray: 16,
    Number: 99
});

export type NbtTypeIndex = typeof NbtTypeId[keyof typeof NbtTypeId];