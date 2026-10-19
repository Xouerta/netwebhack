export const PI2 = Math.PI * 2;

export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rotl(x: number, k: number): number {
    return ((x << k) | (x >>> (32 - k))) >>> 0;
}