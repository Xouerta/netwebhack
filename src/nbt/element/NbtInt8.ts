import type {NbtElement} from "./NbtElement.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config, deepFreeze} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";

export class NbtInt8 implements NbtElement {
    public static readonly TYPE: NbtType<NbtInt8> = config({
        read(reader: BinaryReader) {
            return NbtInt8.of(reader.readInt8());
        }
    });

    public static of(value: number): NbtInt8 {
        return this.cache[128 + Math.floor(value)];
    }

    public static bool(bl: boolean): NbtInt8 {
        return bl ? this.cache[129] : this.cache[128];
    }

    public readonly value: number;

    private constructor(value: number) {
        this.value = value;
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.Int8;
    }

    public write(writer: BinaryWriter): void {
        writer.writeInt8(this.value);
    }

    public copy(): NbtInt8 {
        return this;
    }

    private static readonly cache: NbtInt8[] = new Array<NbtInt8>(256);
    static {
        for (let i = 0; i < this.cache.length; i++) {
            this.cache[i] = new NbtInt8(i - 128);
        }
        deepFreeze(this.cache);
    }

    public toString(): string {
        return `${this.value}b`;
    }
}