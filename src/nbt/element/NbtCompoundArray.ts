import type {NbtElement} from "./NbtElement.ts";
import {NbtCompound} from "./NbtCompound.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import {config} from "../../utils/uit.ts";

export class NbtCompoundArray implements NbtElement {
    public static readonly TYPE: NbtType<NbtCompoundArray> = config({
        read(reader: BinaryReader): NbtCompoundArray {
            const len = reader.readVarUint();
            const array: NbtCompound[] = new Array(len);

            for (let i = 0; i < len; i++) {
                array[i] = NbtCompound.TYPE.read(reader);
            }

            return new NbtCompoundArray(array);
        }
    });

    public readonly value: NbtCompound[];

    public constructor(value: NbtCompound[]) {
        this.value = value;
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.CompoundArray;
    }

    public write(writer: BinaryWriter): void {
        writer.writeVarUint(this.value.length);
        for (const compound of this.value) {
            compound.write(writer);
        }
    }

    public copy(): NbtCompoundArray {
        const array = this.value.map(compound => compound.copy());
        return new NbtCompoundArray(array);
    }
}
