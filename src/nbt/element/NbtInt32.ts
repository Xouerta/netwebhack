import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config, deepFreeze} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export class NbtInt32 implements NbtElement {
    public static readonly TYPE: NbtType<NbtInt32> = config({
        read(reader: BinaryReader) {
            return NbtInt32.of(reader.readInt32());
        }
    });

    public static of(value: number): NbtInt32 {
        value = Math.floor(value);
        return value >= -128 && value <= 512 ? this.cache[value + 128] : new NbtInt32(value);
    }

    public readonly value: number;

    private constructor(value: number) {
        this.value = value;
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.Int32;
    }

    public write(writer: BinaryWriter): void {
        writer.writeInt32(this.value);
    }

    public copy(): NbtInt32 {
        return this;
    }

    private static readonly cache: NbtInt32[] = new Array<NbtInt32>(641);
    static {
        for (let i = 0; i < this.cache.length; i++) {
            this.cache[i] = new NbtInt32(i - 128);
        }
        deepFreeze(this.cache);
    }

    public toString(): string {
        return `${this.value}i`;
    }
}