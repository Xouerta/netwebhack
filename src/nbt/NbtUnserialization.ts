import {BinaryReader} from "./BinaryReader.ts";
import {NbtCompound} from "./element/NbtCompound.ts";
import {NbtTypeId} from "./NbtType.ts";
import {NbtTypes} from "./NbtTypes.ts";

type KeyType = Readonly<{ key: string, type: number }>;


export class NbtUnserialization {
    public static readonly VALIDA_NUMBER_PREFIX = ['B', 'S', 'U', 'F', 'D', 'I'];

    private static checkMagic(buffer: Uint8Array<ArrayBuffer>) {
        const reader = new BinaryReader(buffer);

        const magic = reader.readInt32();
        if (magic !== NbtCompound.MAGIC) {
            console.warn('Invalid magic number');
            return null;
        }

        const version = reader.readInt16();
        if (version !== NbtCompound.VERSION) {
            console.warn(`Unsupported version: ${version}`);
            return null;
        }
        return reader;
    }

    public static fromRootBinary(buffer: Uint8Array<ArrayBuffer>): NbtCompound | null {
        const reader = this.checkMagic(buffer);
        if (!reader) return null;
        return NbtCompound.TYPE.read(reader);
    }

    public static fromBinary(buffer: Uint8Array<ArrayBuffer>): NbtCompound {
        const reader = new BinaryReader(buffer);
        return NbtCompound.TYPE.read(reader);
    }

    public static fromRootCompactBinary(buffer: Uint8Array<ArrayBuffer>): NbtCompound | null {
        const reader = this.checkMagic(buffer);
        if (!reader) return null;
        return this.fromCompactBinary(reader.readSlice(reader.bytesRemaining()));
    }

    public static fromCompactBinary(buffer: Uint8Array<ArrayBuffer>): NbtCompound {
        const reader = new BinaryReader(buffer);

        const schemeSize = reader.readVarUint();
        if (schemeSize === 0) return new NbtCompound();

        const scheme: KeyType[] = [];
        for (let i = 0; i < schemeSize; i++) {
            scheme.push({
                key: reader.readString(),
                type: reader.readInt8()
            });
        }

        const payloadEnd = buffer.length - 1;
        const endTag = buffer[payloadEnd];
        if (endTag !== NbtTypeId.End) {
            throw new Error(`Expected End tag, got ${endTag}`);
        }

        const payload = buffer.subarray(reader.getOffset(), payloadEnd);
        return schemeSize === 0 ? new NbtCompound() : this.parsePayload(payload, scheme);
    }

    private static parsePayload(buffer: Uint8Array<ArrayBuffer>, scheme: KeyType[]) {
        const reader = new BinaryReader(buffer);
        const compound = new NbtCompound();
        while (reader.bytesRemaining() > 0) {
            this.readField(reader, scheme, compound);
        }

        return compound;
    }

    private static readField(reader: BinaryReader, scheme: KeyType[], compound: NbtCompound): void {
        const index = reader.readVarUint();
        if (index >= scheme.length) {
            throw new Error(`Invalid scheme index: ${index}`);
        }

        const {key, type} = scheme[index];
        if (type === NbtTypeId.Compound) {
            const nestedLen = reader.readVarUint();
            const nestedBuf = reader.readSlice(nestedLen);
            const nested = this.parsePayload(nestedBuf, scheme);
            compound.putCompound(key, nested);
            return;
        }
        if (type === NbtTypeId.CompoundArray) {
            const count = reader.readVarUint();
            const list: NbtCompound[] = [];
            for (let i = 0; i < count; i++) {
                const nestedLen = reader.readVarUint();
                const nestedBuf = reader.readSlice(nestedLen);
                const nested = this.parsePayload(nestedBuf, scheme);
                list.push(nested);
            }
            compound.putCompoundArray(key, list);
            return;
        }
        compound.put(key, NbtTypes.getTypeByIndex(type).read(reader));
    }
}