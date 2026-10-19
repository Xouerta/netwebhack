import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export class NbtInt16 implements NbtElement {
    public static readonly TYPE: NbtType<NbtInt16> = config({
        read(reader: BinaryReader) {
            return NbtInt16.of(reader.readInt16());
        }
    });

    public static of(value: number): NbtInt16 {
        return new NbtInt16(Math.floor(value));
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

    public toString(): string {
        return `${this.value}s`;
    }
}