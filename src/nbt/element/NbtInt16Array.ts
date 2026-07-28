import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";
import {config} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";

export class NbtInt16Array implements NbtElement {
    public static readonly TYPE: NbtType<NbtInt16Array> = config({
        read(reader: BinaryReader): NbtInt16Array {
            const len = reader.readVarUint();
            const array = new Int16Array(len);

            for (let i = 0; i < len; i++) {
                array[i] = reader.readInt16();
            }

            return new NbtInt16Array(array);
        }
    });

    public readonly value: Int16Array;

    public constructor(value: Int16Array) {
        this.value = value;
    }

    public static create(list: number[]) {
        return new NbtInt16Array(new Int16Array(list));
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.Int16Array;
    }

    public write(writer: BinaryWriter): void {
        writer.writeVarUint(this.value.length);
        for (const num of this.value) {
            writer.writeInt16(num);
        }
    }

    public copy(): NbtInt16Array {
        const array = new Int16Array(this.value);
        return new NbtInt16Array(array);
    }

    public toString(): string {
        return `[S;${this.value.join(',')}]`;
    }
}