import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";
import {config} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";

export class NbtInt8Array implements NbtElement {
    public static readonly TYPE: NbtType<NbtInt8Array> = config({
        read(reader: BinaryReader): NbtInt8Array {
            const len = reader.readVarUint();
            const bytes = new Int8Array(len);

            for (let i = 0; i < len; i++) {
                bytes[i] = reader.readInt8();
            }

            return new NbtInt8Array(bytes);
        }
    });

    public readonly value: Int8Array;

    public constructor(value: Int8Array) {
        this.value = value;
    }

    public static create(list: number[]) {
        return new NbtInt8Array(new Int8Array(list));
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.Int8Array;
    }

    public write(writer: BinaryWriter): void {
        writer.writeVarUint(this.value.length);
        for (const num of this.value) {
            writer.writeInt8(num);
        }
    }

    public copy(): NbtInt8Array {
        return new NbtInt8Array(new Int8Array(this.value));
    }

    public toString(): string {
        return `[B;${this.value.join(',')}]`;
    }
}