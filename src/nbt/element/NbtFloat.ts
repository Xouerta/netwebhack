import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export class NbtFloat implements NbtElement {
    public static readonly TYPE: NbtType<NbtFloat> = config({
        read(reader: BinaryReader) {
            return NbtFloat.of(reader.readFloat());
        }
    });
    public static readonly ZERO = new NbtFloat(0);

    public static of(value: number): NbtFloat {
        return value === 0.0 ? this.ZERO : new NbtFloat(value);
    }

    public readonly value: number;

    private constructor(value: number) {
        this.value = value;
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.Float;
    }

    public write(writer: BinaryWriter): void {
        writer.writeFloat(this.value);
    }

    public copy(): NbtFloat {
        return this;
    }

    public toString(): string {
        return `${this.value}f`;
    }
}