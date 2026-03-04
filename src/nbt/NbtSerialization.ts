import {NbtCompound} from "./element/NbtCompound.ts";
import {BinaryWriter} from "./BinaryWriter.ts";
import {NbtTypeId} from "./NbtType.ts";
import type {NbtCompoundArray} from "./element/NbtCompoundArray.ts";

export type KeyIndex = Readonly<{ key: string, type: number, index: number }>;

export class NbtSerialization {
    public static toRootBinary(compound: NbtCompound): Uint8Array<ArrayBuffer> {
        const writer = new BinaryWriter();

        writer.writeInt32(NbtCompound.MAGIC);
        writer.writeInt16(NbtCompound.VERSION);
        compound.write(writer);

        return writer.toUint8Array();
    }

    public static toRootCompactBinary(compound: NbtCompound): Uint8Array<ArrayBuffer> {
        const writer = new BinaryWriter();

        writer.writeInt32(NbtCompound.MAGIC);
        writer.writeInt16(NbtCompound.VERSION);

        return this.toCompactBinary(compound, writer);
    }

    public static toCompactBinary(compound: NbtCompound, writer?: BinaryWriter): Uint8Array<ArrayBuffer> {
        if (!writer) writer = new BinaryWriter();
        const scheme = new Map<string, KeyIndex>();

        this.updateScheme(compound, scheme);

        writer.writeVarUint(scheme.size);
        for (const {key, type} of scheme.values()) {
            writer.writeString(key);
            writer.writeInt8(type);
        }

        if (scheme.size > 0) {
            writer.pushBytes(this.writeWithScheme(compound, scheme));
        }

        writer.writeInt8(NbtTypeId.End);
        return writer.toUint8Array();
    }

    private static writeWithScheme(compound: NbtCompound, scheme: Map<string, KeyIndex>) {
        const writer = new BinaryWriter();

        for (const [key, element] of compound.getEntries()) {
            const type = element.getType();
            const index = scheme.get(`${key}:${type}`)!.index;
            writer.writeVarUint(index);

            if (type === NbtTypeId.Compound) {
                const compound = element as NbtCompound;
                const nested = this.writeWithScheme(compound, scheme);
                writer.writeVarUint(nested.length);
                writer.pushBytes(nested);
                continue;
            }

            if (type === NbtTypeId.CompoundArray) {
                const list = (element as NbtCompoundArray).value;
                writer.writeVarUint(list.length);
                for (const compound of list) {
                    const nested = this.writeWithScheme(compound, scheme);
                    writer.writeVarUint(nested.length);
                    writer.pushBytes(nested);
                }
                continue;
            }
            element.write(writer);
        }

        return writer.toUint8Array();
    }

    private static updateScheme(compound: NbtCompound, scheme: Map<string, KeyIndex>) {
        if (compound.getSize() === 0) return;

        for (const [key, element] of compound.getEntries()) {
            const type = element.getType();
            const compositeKey = `${key}:${type}`;
            if (!scheme.has(compositeKey)) {
                scheme.set(compositeKey, {key, type, index: scheme.size});
            }

            if (type === NbtTypeId.Compound) {
                this.updateScheme(element as NbtCompound, scheme);
                continue;
            }

            if (type === NbtTypeId.CompoundArray) {
                const values = element as NbtCompoundArray;
                for (const compound of values.value) {
                    this.updateScheme(compound, scheme);
                }
            }
        }
    }
}