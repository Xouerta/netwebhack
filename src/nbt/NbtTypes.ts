import {NbtInt8} from "./element/NbtInt8.ts";
import {NbtInt16} from "./element/NbtInt16.ts";
import {NbtInt32} from "./element/NbtInt32.ts";
import {NbtEnd} from "./element/NbtEnd.ts";
import {NbtFloat} from "./element/NbtFloat.ts";
import {NbtDouble} from "./element/NbtDouble.ts";
import {NbtUint32} from "./element/NbtUint32.ts";
import {NbtString} from "./element/NbtString.ts";
import {NbtInt8Array} from "./element/NbtInt8Array.ts";
import {NbtInt16Array} from "./element/NbtInt16Array.ts";
import {NbtInt32Array} from "./element/NbtInt32Array.ts";
import {NbtFloatArray} from "./element/NbtFloatArray.ts";
import {NbtDoubleArray} from "./element/NbtDoubleArray.ts";
import {NbtUint32Array} from "./element/NbtUint32Array.ts";
import {NbtStringArray} from "./element/NbtStringArray.ts";
import {NbtCompoundArray} from "./element/NbtCompoundArray.ts";
import {NbtInvalid} from "./element/NbtInvalid.ts";
import type {NbtType} from "./NbtType.ts";
import {NbtCompound} from "./element/NbtCompound.ts";

export class NbtTypes {
    private static readonly VALUES: NbtType<any>[];

    public static getTypeByIndex(index: number): NbtType<any> {
        return index >= 0 && index < this.VALUES.length ? this.VALUES[index] : new NbtInvalid(index);
    }

    public static init() {
        (this.VALUES as any) = [
            NbtEnd.TYPE,
            NbtInt8.TYPE,
            NbtInt16.TYPE,
            NbtInt32.TYPE,
            NbtFloat.TYPE,
            NbtDouble.TYPE,
            NbtUint32.TYPE,
            NbtString.TYPE,
            NbtCompound.TYPE,
            NbtInt8Array.TYPE,
            NbtInt16Array.TYPE,
            NbtInt32Array.TYPE,
            NbtFloatArray.TYPE,
            NbtDoubleArray.TYPE,
            NbtUint32Array.TYPE,
            NbtStringArray.TYPE,
            NbtCompoundArray.TYPE
        ];
    }
}



