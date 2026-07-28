import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config} from "../../utils/uit.ts";
import type {NbtElement} from "./NbtElement.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export class NbtString implements NbtElement {
    public static readonly TYPE: NbtType<NbtString> = config({
        read(reader: BinaryReader) {
            return NbtString.of(reader.readString());
        }
    });
    public static readonly EMPTY = new NbtString('');

    public static of(value: string): NbtString {
        return value.length === 0 ? this.EMPTY : new NbtString(value);
    }

    public readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.String;
    }

    public write(writer: BinaryWriter): void {
        writer.writeString(this.value);
    }

    public copy(): NbtString {
        return this;
    }

    public toString() {
        const escaped = this.value
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
        return `"${escaped}"`
    }
}