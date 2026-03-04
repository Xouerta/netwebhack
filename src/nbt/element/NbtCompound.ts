import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import type {BinaryWriter} from "../BinaryWriter.ts";
import {NbtInt8} from "./NbtInt8.ts";
import {NbtInt16} from "./NbtInt16.ts";
import {NbtInt32} from "./NbtInt32.ts";
import {NbtFloat} from "./NbtFloat.ts";
import {NbtDouble} from "./NbtDouble.ts";
import {NbtUint32} from "./NbtUint32.ts";
import {NbtString} from "./NbtString.ts";
import {NbtInt8Array} from "./NbtInt8Array.ts";
import {NbtStringArray} from "./NbtStringArray.ts";
import {NbtInt16Array} from "./NbtInt16Array.ts";
import {NbtInt32Array} from "./NbtInt32Array.ts";
import {NbtFloatArray} from "./NbtFloatArray.ts";
import {NbtDoubleArray} from "./NbtDoubleArray.ts";
import {NbtUint32Array} from "./NbtUint32Array.ts";
import {NbtCompoundArray} from "./NbtCompoundArray.ts";
import {config} from "../../utils/uit.ts";
import type {BinaryReader} from "../BinaryReader.ts";
import {NbtTypes} from "../NbtTypes.ts";


export class NbtCompound implements NbtElement {
    public static readonly MAGIC = 0x6E627430;
    public static readonly VERSION = 6;
    public static readonly TYPE: NbtType<NbtCompound> = config({
        read(reader: BinaryReader): NbtCompound {
            const compound = new NbtCompound();
            while (true) {
                const type = reader.readInt8();
                if (type === 0) break;

                const key = reader.readString();
                const nbt = NbtTypes.getTypeByIndex(type).read(reader);
                compound.put(key, nbt);
            }
            return compound;
        }
    });

    private readonly entries: Map<string, NbtElement>;

    public constructor(map?: Map<string, NbtElement>) {
        this.entries = map ?? new Map();
    }

    public put(key: string, nbt: NbtElement) {
        this.entries.set(key, nbt);
    }

    public putInt8(key: string, value: number): this {
        console.assert(Number.isInteger(value) && value >= -128 && value <= 127, "Int8 out of range");
        this.entries.set(key, NbtInt8.of(value));
        return this;
    }

    public putInt16(key: string, value: number): this {
        console.assert(Number.isInteger(value) && value >= -32768 && value <= 32767, "Int16 out of range");
        this.entries.set(key, NbtInt16.of(value));
        return this;
    }

    public putInt32(key: string, value: number): this {
        console.assert(Number.isInteger(value) && value >= -2147483648 && value <= 2147483647, "Int32 out of range");
        this.entries.set(key, NbtInt32.of(value));
        return this;
    }

    public putFloat(key: string, value: number): this {
        console.assert(Number.isFinite(value), "Float must be finite");
        this.entries.set(key, NbtFloat.of(value));
        return this;
    }

    public putDouble(key: string, value: number): this {
        console.assert(Number.isFinite(value), "Double must be finite");
        this.entries.set(key, NbtDouble.of(value));
        return this;
    }

    public putUint32(key: string, value: number): this {
        console.assert(Number.isInteger(value) && value >= 0 && value <= 0xFFFFFFFF,
            `[NBT] ${key} expected uint32 (0 ~ ${0xFFFFFFFF}), got ${value}`);
        this.entries.set(key, NbtUint32.of(value));
        return this;
    }

    public putString(key: string, value: string): this {
        this.entries.set(key, NbtString.of(value));
        return this;
    }

    public putBoolean(key: string, value: boolean): this {
        this.entries.set(key, NbtInt8.bool(value));
        return this;
    }

    public putInt8Array(key: string, ...value: number[]): this {
        this.entries.set(key, NbtInt8Array.create(value));
        return this;
    }

    public putInt16Array(key: string, ...value: number[]): this {
        this.entries.set(key, NbtInt16Array.create(value));
        return this;
    }

    public putInt32Array(key: string, ...value: number[]): this {
        this.entries.set(key, NbtInt32Array.create(value));
        return this;
    }

    public putFloatArray(key: string, ...value: number[]): this {
        this.entries.set(key, NbtFloatArray.create(value));
        return this;
    }

    public putDoubleArray(key: string, ...value: number[]): this {
        this.entries.set(key, NbtDoubleArray.create(value));
        return this;
    }

    public putUint32Array(key: string, ...value: number[]): this {
        this.entries.set(key, NbtUint32Array.create(value));
        return this;
    }

    public putStringArray(key: string, ...value: string[]): this {
        this.entries.set(key, new NbtStringArray(value));
        return this;
    }

    public putCompound(key: string, value: NbtCompound): this {
        this.entries.set(key, value);
        return this;
    }

    public putCompoundArray(key: string, value: NbtCompound[]) {
        this.entries.set(key, new NbtCompoundArray(value));
        return this;
    }

    public get(key: string): NbtElement | null {
        return this.entries.get(key) ?? null;
    }

    public getKeyType(key: string): NbtTypeIndex {
        const v = this.entries.get(key);
        return v === undefined ? NbtTypeId.End : v.getType();
    }

    public has(key: string): boolean {
        return this.entries.has(key);
    }

    public contains(key: string, type: NbtTypeIndex): boolean {
        const i = this.getKeyType(key);
        if (i === type) return true;
        return i !== NbtTypeId.Number ?
            false :
            i === NbtTypeId.Int8 ||
            i === NbtTypeId.Int16 ||
            i === NbtTypeId.Int32 ||
            i === NbtTypeId.Float ||
            i === NbtTypeId.Double;
    }

    public getInt8(key: string, d = 0): number {
        const v = this.entries.get(key) as NbtInt8;
        return v && v.getType() === NbtTypeId.Int8 ? v.value : d;
    }

    public getInt16(key: string, d = 0): number {
        const v = this.entries.get(key) as NbtInt16;
        return v && v.getType() === NbtTypeId.Int16 ? v.value : d;
    }

    public getInt32(key: string, d = 0): number {
        const v = this.entries.get(key) as NbtInt32;
        return v && v.getType() === NbtTypeId.Int32 ? v.value : d;
    }

    public getFloat(key: string, d = 0): number {
        const v = this.entries.get(key) as NbtFloat;
        return v && v.getType() === NbtTypeId.Float ? v.value : d;
    }

    public getDouble(key: string, d = 0): number {
        const v = this.entries.get(key) as NbtDouble;
        return v && v.getType() === NbtTypeId.Double ? v.value : d;
    }

    public getUint32(key: string, d = 0): number {
        const v = this.entries.get(key) as NbtUint32;
        return v && v.getType() === NbtTypeId.Uint32 ? v.value : d;
    }

    public getString(key: string, d = ""): string {
        const v = this.entries.get(key) as NbtString;
        return v && v.getType() === NbtTypeId.String ? v.value : d;
    }

    public getBoolean(key: string, d: number = 0): boolean {
        return this.getInt8(key, d) !== 0;
    }

    public getInt8Array(key: string): Int8Array {
        const v = this.entries.get(key) as NbtInt8Array;
        return v && v.getType() === NbtTypeId.Int8Array ? v.value : new Int8Array();
    }

    public getInt16Array(key: string): Int16Array {
        const v = this.entries.get(key) as NbtInt16Array;
        return v && v.getType() === NbtTypeId.Int16Array ? v.value : new Int16Array();
    }

    public getInt32Array(key: string): Int32Array {
        const v = this.entries.get(key) as NbtInt32Array;
        return v && v.getType() === NbtTypeId.Int32Array ? v.value : new Int32Array();
    }

    public getFloatArray(key: string): Float32Array {
        const v = this.entries.get(key) as NbtFloatArray;
        return v && v.getType() === NbtTypeId.FloatArray ? v.value : new Float32Array();
    }

    public getDoubleArray(key: string): Float64Array {
        const v = this.entries.get(key) as NbtDoubleArray;
        return v && v.getType() === NbtTypeId.DoubleArray ? v.value : new Float64Array();
    }

    public getUint32Array(key: string): Uint32Array {
        const v = this.entries.get(key) as NbtUint32Array;
        return v && v.getType() === NbtTypeId.Uint32Array ? v.value : new Uint32Array();
    }

    public getStringArray(key: string, d: string[] = []): string[] {
        const v = this.entries.get(key) as NbtStringArray;
        return v && v.getType() === NbtTypeId.StringArray ? v.value : d;
    }

    public getCompound(key: string): NbtCompound {
        const v = this.entries.get(key) as NbtCompound;
        return v && v.getType() === NbtTypeId.Compound ? v : new NbtCompound();
    }

    public getCompoundArray(key: string): NbtCompound[] {
        const v = this.entries.get(key) as NbtCompoundArray;
        return v && v.getType() === NbtTypeId.CompoundArray ? v.value : [];
    }

    public remove(key: string): this {
        this.entries.delete(key);
        return this;
    }

    public removes(...keys: string[]): this {
        for (const key of keys) {
            this.entries.delete(key);
        }
        return this;
    }

    public clear(): this {
        this.entries.clear();
        return this;
    }

    public isEmpty(): boolean {
        return this.entries.size === 0;
    }

    public getEntries(): ReadonlyMap<string, NbtElement> {
        return this.entries;
    }

    public getKeys(): Set<string> {
        return new Set<string>(this.entries.keys());
    }

    public getEntrySet(): Set<[string, NbtElement]> {
        return new Set(this.entries.entries());
    }

    public getSize(): number {
        return this.entries.size;
    }

    public copy() {
        const map = new Map<string, NbtElement>();
        for (const entry of this.entries) {
            map.set(entry[0], entry[1].copy());
        }
        return new NbtCompound(map);
    }

    public getType(): NbtTypeIndex {
        return NbtTypeId.Compound;
    }

    public write(writer: BinaryWriter) {
        for (const [key, element] of this.entries) {
            const type = element.getType();
            writer.writeInt8(type);
            if (type === 0) continue;

            writer.writeString(key);
            element.write(writer);
        }
        writer.writeInt8(0);
    }
}
