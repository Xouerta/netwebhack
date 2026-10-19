import type {NbtTypeIndex} from "../NbtType.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";

export interface NbtElement {
    getType(): NbtTypeIndex;

    write(writer: BinaryWriter): void;

    copy(): NbtElement;
}