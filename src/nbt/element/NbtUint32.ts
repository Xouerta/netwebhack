import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export class NbtUint32 implements NbtElement {
    public static readonly TYPE: NbtType<NbtUint32> = config({
        read(reader: BinaryReader) {
            return NbtUint32.of(reader.readUint32());
        }
    });

    public static of(value: number): NbtUint32 {
        return new NbtUint32(value >>> 0)
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

    public toString(): string {
        return `${this.value}u`;
    }
}