import {clamp} from "./math.ts";

export function throttleTimeOut<T extends (...args: any[]) => any>(func: T, wait: number = 200) {
    let timer: number | null = null;
    return function (...args: Parameters<T>) {
        if (timer) return;
        // @ts-ignore
        func.apply(this, args);
        timer = setTimeout((): any => timer = null, wait);
    }
}

export function deepFreeze<T>(obj: T, seen = new WeakSet()): Readonly<T> {
    if (obj === null || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return obj;
    seen.add(obj);

    if (obj instanceof Map) {
        for (const [k, v] of obj) {
            deepFreeze(k as any, seen);
            deepFreeze(v as any, seen);
        }
    } else if (obj instanceof Set) {
        for (const v of obj) {
            deepFreeze(v as any, seen);
        }
    } else {
        for (const key of Reflect.ownKeys(obj)) {
            // @ts-ignore
            const value = obj[key];
            if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
                deepFreeze(value, seen);
            }
        }
    }

    return Object.freeze(obj);
}

export function createClean<T>(obj: T): T {
    return Object.assign(Object.create(null), obj);
}

export function config<T>(obj: T): T {
    return deepFreeze(createClean(obj));
}

export function status<T>(obj: T): T {
    return Object.seal(createClean(obj));
}

export function sleep(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

export function groupBy<T>(arr: T[], keyFn: (t: T) => string) {
    const m = new Map<string, T[]>();
    for (const item of arr) {
        const k = keyFn(item);
        if (!m.has(k)) m.set(k, []);
        m.get(k)!.push(item);
    }
    return m;
}

export function isNonEmptyString(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0;
}

export function hexToRgb(hex: string) {
    const s = hex.replace('#', '');
    return {
        r: parseInt(s.slice(0, 2), 16),
        g: parseInt(s.slice(2, 4), 16),
        b: parseInt(s.slice(4, 6), 16)
    };
}

export function withAlpha(hex: string, a: number): string {
    const c = hexToRgb(hex);
    return `rgba(${c.r},${c.g},${c.b},${a.toFixed(3)})`;
}

export function hexToRgba(hex: string, a: number): string {
    const s = hex.replace('#', "");
    const n = s.length === 3
        ? s.split('').map(c => c + c).join("")
        : s.padEnd(6, '0').slice(0, 6);
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${clamp(a, 0, 1).toFixed(3)})`;
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number = 50) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return function (...args: Parameters<T>) {
        if (timer) clearTimeout(timer);
        // @ts-ignore
        timer = setTimeout(() => func.apply(this, args), wait);
    }
}

export function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length; i--;) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function getCompactTimestamp() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');

    return `${y}${m}${d}_${h}${min}${s}`;
}