import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export class NbtDouble implements NbtElement {
    public static readonly TYPE: NbtType<NbtDouble> = config({
        read(reader: BinaryReader) {
            return NbtDouble.of(reader.readDouble());
        }
    });
    public static readonly ZERO = new NbtDouble(0);

    public static of(value: number): NbtDouble {
        return value === 0.0 ? this.ZERO : new NbtDouble(value);
    }

    public readonly value: number;

    private constructor(value: number) {
        this.value = value;
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.Double;
    }

    public write(writer: BinaryWriter): void {
        writer.writeDouble(this.value);
    }

    public copy(): NbtDouble {
        return this;
    }

    public toString(): string {
        return `${this.value}d`;
    }
}