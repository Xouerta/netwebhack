import type {Supplier} from "../types.ts";

export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export function formatSeed(p1: string, p2: string, p3: string) {
    return p1.toUpperCase().padEnd(3, 'A').slice(0, 3) + '-' +
        p2.toUpperCase().padEnd(3, 'A').slice(0, 3) + '-' +
        p3.toUpperCase().padEnd(3, 'A').slice(0, 3);
}

export function normalizeSeed(raw: string) {
    const cleaned = raw.replace(/[^a-zA-Z0-9\-]/g, '').toUpperCase();
    const parts = cleaned.split('-').filter(p => p.length > 0);
    if (parts.length === 0) return "K18-M7B-X9Z";
    const segs = ["", "", ""];
    for (let i = 0; i < Math.min(parts.length, 3); i++) segs[i] = parts[i];
    return formatSeed(segs[0] || "A", segs[1] || "A", segs[2] || "A");
}

export function seedHash(seedStr: string) {
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) {
        h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
    }
    return Math.abs(h) + 1;
}

export function createRNG(seedInt: number) {
    let state = seedInt % 2147483647;
    if (state <= 0) state = 1;
    return function () {
        state = (state * 1103515245 + 12345) % 2147483647;
        return (state & 0x7fffffff) / 2147483647;
    };
}

export function shuffleArray<T>(array: T[], rng: Supplier<number>) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export function getCell(array: Uint8Array, size: number, row: number, col: number): number {
    return array[row * size + col];
}

export function setCell(array: Uint8Array, size: number, row: number, col: number, value: number): void {
    array[row * size + col] = value;
}