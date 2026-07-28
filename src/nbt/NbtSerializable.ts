import {NbtCompound} from "./element/NbtCompound.ts";

export interface NbtSerializable {
    writeNBT(nbt: NbtCompound): NbtCompound;

    readNBT(nbt: NbtCompound): void;
}