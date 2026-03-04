import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config, deepFreeze} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export class NbtUint32 implements NbtElement {
    public static readonly TYPE: NbtType<NbtUint32> = config({
        read(reader: BinaryReader) {
            return NbtUint32.of(reader.readUint32());
        }
    });

    public static of(value: number): NbtUint32 {
        value = value >>> 0;
        return value >= 0 && value <= 512 ? this.cache[value] : new NbtUint32(value);
    }

    public readonly value: number;

    private constructor(value: number) {
        this.value = value;
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.Uint32;
    }

    public write(writer: BinaryWriter): void {
        writer.writeUint32(this.value);
    }

    public copy(): NbtUint32 {
        return this;
    }

    private static readonly cache: NbtUint32[] = new Array<NbtUint32>(513);
    static {
        for (let i = 0; i < this.cache.length; i++) {
            this.cache[i] = new NbtUint32(i);
        }
        deepFreeze(this.cache);
    }

    public toString(): string {
        return `${this.value}u`;
    }
}