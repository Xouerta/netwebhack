import type {NbtElement} from "./NbtElement.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";

export class NbtInt8 implements NbtElement {
    public static readonly TYPE: NbtType<NbtInt8> = config({
        read(reader: BinaryReader) {
            return NbtInt8.of(reader.readInt8());
        }
    });

    public static of(value: number): NbtInt8 {
        return new NbtInt8(Math.floor(value));
    }

    public static bool(bl: boolean): NbtInt8 {
        return bl ? new NbtInt8(1) : new NbtInt8(0);
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

    public toString(): string {
        return `${this.value}b`;
    }
}