import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import type {NbtElement} from "./NbtElement.ts";
import {config} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export class NbtStringArray implements NbtElement {
    public static readonly TYPE: NbtType<NbtStringArray> = config({
        read(reader: BinaryReader): NbtStringArray {
            const len = reader.readVarUint();
            const array: string[] = new Array(len);

            for (let i = 0; i < len; i++) {
                array[i] = reader.readString();
            }

            return new NbtStringArray(array);
        }
    });

    public readonly value: string[];

    public constructor(value: string[]) {
        this.value = value;
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.StringArray;
    }

    public write(writer: BinaryWriter): void {
        writer.writeVarUint(this.value.length);
        for (const str of this.value) {
            writer.writeString(str);
        }
    }

    public copy(): NbtStringArray {
        return new NbtStringArray(Array.from(this.value));
    }

    public toString(): string {
        const items = this.value
            .map(s => {
                    const escaped = s
                        .replace(/\\/g, '\\\\')
                        .replace(/"/g, '\\"');
                    return `"${escaped}"`;
                }
            )
            .join(',');
        return `[${items}]`;
    }
}