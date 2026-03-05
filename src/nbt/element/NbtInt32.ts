import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export class NbtInt32 implements NbtElement {
    public static readonly TYPE: NbtType<NbtInt32> = config({
        read(reader: BinaryReader) {
            return NbtInt32.of(reader.readInt32());
        }
    });

    public static of(value: number): NbtInt32 {
        return new NbtInt32(Math.floor(value));
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

    public toString(): string {
        return `${this.value}i`;
    }
}