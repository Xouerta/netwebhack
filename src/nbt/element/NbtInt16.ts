import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config, deepFreeze} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export class NbtInt16 implements NbtElement {
    public static readonly TYPE: NbtType<NbtInt16> = config({
        read(reader: BinaryReader) {
            return NbtInt16.of(reader.readInt16());
        }
    });

    public static of(value: number): NbtInt16 {
        value = Math.floor(value);
        return value >= -128 && value <= 512 ? this.cache[value + 128] : new NbtInt16(value);
    }

    public readonly value: number;

    private constructor(value: number) {
        this.value = value;
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.Int16;
    }

    public write(writer: BinaryWriter): void {
        writer.writeInt16(this.value);
    }

    public copy(): NbtInt16 {
        return this;
    }

    private static readonly cache: NbtInt16[] = new Array<NbtInt16>(641);
    static {
        for (let i = 0; i < this.cache.length; i++) {
            this.cache[i] = new NbtInt16(i - 128);
        }
        deepFreeze(this.cache);
    }

    public toString(): string {
        return `${this.value}s`;
    }
}