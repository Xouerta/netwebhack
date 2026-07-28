import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export class NbtUint32Array implements NbtElement {
    public static readonly TYPE: NbtType<NbtUint32Array> = config({
        read(reader: BinaryReader): NbtUint32Array {
            const len = reader.readVarUint();
            const array = new Uint32Array(len);

            for (let i = 0; i < len; i++) {
                array[i] = reader.readUint32();
            }

            return new NbtUint32Array(array);
        }
    });

    public readonly value: Uint32Array;

    public constructor(value: Uint32Array) {
        this.value = value;
    }

    public static create(list: number[]) {
        return new NbtUint32Array(new Uint32Array(list));
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.Uint32Array;
    }

    public write(writer: BinaryWriter): void {
        writer.writeVarUint(this.value.length);
        for (const num of this.value) {
            writer.writeUint32(num);
        }
    }

    public copy(): NbtUint32Array {
        return new NbtUint32Array(new Uint32Array(this.value));
    }

    public toString() {
        return `[U;${this.value.join(",")}]`;
    }
}