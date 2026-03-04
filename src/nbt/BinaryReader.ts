import type {UUID} from "../types.ts";
import {UUIDUtil} from "../utils/UUIDUtil.ts";

export class BinaryReader {
    private view: DataView<ArrayBuffer>;
    private offset = 0;

    public constructor(bytes: Uint8Array<ArrayBuffer>) {
        this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }

    public bytesRemaining(): number {
        return this.view.byteLength - this.offset;
    }

    public readInt8(): number {
        const v = this.view.getInt8(this.offset);
        this.offset += 1;
        return v;
    }

    public readBoolean(): boolean {
        return this.readInt8() !== 0;
    }

    public readUint8(): number {
        const v = this.view.getUint8(this.offset);
        this.offset += 1;
        return v;
    }

    public readInt16(): number {
        const v = this.view.getInt16(this.offset, true);
        this.offset += 2;
        return v;
    }

    public readInt32(): number {
        const v = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return v;
    }

    public readFloat(): number {
        const v = this.view.getFloat32(this.offset, true);
        this.offset += 4;
        return v;
    }

    public readDouble(): number {
        const v = this.view.getFloat64(this.offset, true);
        this.offset += 8;
        return v;
    }

    public readUint16(): number {
        const v = this.view.getUint16(this.offset, true);
        this.offset += 2;
        return v;
    }

    public readUint32(): number {
        const v = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return v;
    }

    public readVarUint(): number {
        let num = 0;
        let shift = 0;

        while (true) {
            if (this.offset >= this.view.byteLength) {
                throw new Error("Buffer underflow while reading VarInt");
            }

            const b = this.view.getUint8(this.offset++);
            num |= (b & 0x7F) << shift;

            if ((b & 0x80) === 0) {
                break;
            }

            shift += 7;
            if (shift > 35) {
                throw new Error("VarInt too big");
            }
        }

        return num;
    }

    public readString(): string {
        const len = this.readUint16();
        console.assert(len >= 0 && this.offset + len <= this.view.byteLength, "Invalid string length");

        const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, len);
        const str = new TextDecoder("utf-8", {fatal: true}).decode(bytes);
        this.offset += len;
        return str;
    }

    public readUUID(): UUID {
        if (this.offset + 16 > this.view.byteLength) {
            throw new Error("Buffer underflow while reading UUID");
        }
        const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, 16);
        this.offset += 16;
        return UUIDUtil.stringify(bytes);
    }

    public readSlice(len: number): Uint8Array<ArrayBuffer> {
        if (len < 0 || len > this.bytesRemaining()) {
            throw new RangeError(`Cannot read slice of ${len} bytes, only ${this.bytesRemaining()} available`);
        }
        const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, len);
        this.offset += len;
        return bytes;
    }

    public getBuffer() {
        return new Uint8Array(this.view.buffer);
    }

    public getOffset(): number {
        return this.offset;
    }
}
