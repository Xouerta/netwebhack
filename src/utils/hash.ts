import type {Comparable} from "../types/Comparable.ts";

export function stringHashCode(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char; // hash * 31 + char
        hash |= 0; // 截断
    }
    return hash;
}

export function numHash(...values: number[]): number {
    if (values.length === 0) return 0;

    let hash = 0;
    for (const value of values) {
        hash = (31 * hash + value) | 0;
    }
    return hash;
}

export function hashCode(...object: Comparable[]): number {
    if (object == null) return 0;

    let hash = 0;
    for (const value of object) {
        hash = 31 * hash + (value == null ? 0 : value.hashCode());
    }
    return hash;
}

export function arrayHash(arr: number[]): number {
    if (arr.length === 0) return 0;

    let hash = 0;
    for (const value of arr) {
        hash = 31 * hash + value;
    }
    return hash;
}