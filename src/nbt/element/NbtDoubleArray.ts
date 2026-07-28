import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export class NbtDoubleArray implements NbtElement {
    public static readonly TYPE: NbtType<NbtDoubleArray> = config({
        read(reader: BinaryReader): NbtDoubleArray {
            const len = reader.readVarUint();
            const array = new Float64Array(len);

            for (let i = 0; i < len; i++) {
                array[i] = reader.readDouble();
            }

            return new NbtDoubleArray(array);
        }
    });

    public readonly value: Float64Array;

    public constructor(value: Float64Array) {
        this.value = value;
    }

    public static create(array: number[]) {
        return new NbtDoubleArray(new Float64Array(array));
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.DoubleArray;
    }

    public write(writer: BinaryWriter): void {
        writer.writeVarUint(this.value.length);
        for (const num of this.value) {
            writer.writeDouble(num);
        }
    }

    public copy(): NbtDoubleArray {
        const array = new Float64Array(this.value);
        return new NbtDoubleArray(array);
    }

    public toString(): string {
        return `[D;${this.value.join(',')}]`;
    }
}