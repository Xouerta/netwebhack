import type {Return} from "../../types/types.ts";
import type {Comparable} from "../../types/Comparable.ts";


export class HashMap<K extends Comparable, V> implements Map<K, V> {
    public readonly [Symbol.toStringTag]: string = 'HashMap';

    private readonly loadFactor = 0.75;
    private readonly initCapacity: number;

    private buckets: Array<BucketEntry<K, V>[] | null>;
    private entrySize = 0;

    public constructor(capacity = 16) {
        capacity = 1 << Math.ceil(Math.log2(Math.max(capacity, 1)));
        this.buckets = new Array(capacity).fill(null);
        this.initCapacity = capacity;
    }

    public set(key: K, value: V): this {
        if (this.entrySize / this.buckets.length >= this.loadFactor) {
            this.resize();
        }

        const hash = key.hashCode();
        const idx = hash & (this.buckets.length - 1);
        let bucket = this.buckets[idx];

        if (!bucket) {
            this.buckets[idx] = bucket = [];
        }

        for (const entry of bucket) {
            if (entry.hash === hash && entry.key.equal(key)) {
                entry.value = value;
                return this;
            }
        }

        bucket.push({key, value, hash});
        this.entrySize++;
        return this;
    }

    public get(key: K): V | undefined {
        const hash = key.hashCode();
        const bucket = this.buckets[hash & (this.buckets.length - 1)];

        if (!bucket) return undefined;

        for (const entry of bucket) {
            if (entry.hash === hash && entry.key.equal(key)) {
                return entry.value;
            }
        }
        return undefined;
    }

    public has(key: K): boolean {
        return this.get(key) !== undefined;
    }

    public delete(key: K): boolean {
        const hash = key.hashCode();
        const idx = hash & (this.buckets.length - 1);
        const bucket = this.buckets[idx];

        if (!bucket) return false;

        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i].hash === hash && bucket[i].key.equal(key)) {
                bucket.splice(i, 1);
                if (bucket.length === 0) this.buckets[idx] = null;

                this.entrySize--;
                return true;
            }
        }
        return false;
    }

    public clear(): void {
        this.buckets = new Array(this.initCapacity).fill(null);
        this.entrySize = 0;
    }

    public get size(): number {
        return this.entrySize;
    }

    public* entries(): MapIterator<[K, V]> {
        for (const bucket of this.buckets) {
            if (!bucket) continue;
            for (const {key, value} of bucket) {
                yield [key, value];
            }
        }
    }

    public* keys(): MapIterator<K> {
        for (const [key] of this.entries()) {
            yield key;
        }
    }

    public* values(): MapIterator<V> {
        for (const [, value] of this.entries()) {
            yield value;
        }
    }

    public forEach(callback: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        for (const [key, value] of this.entries()) {
            callback.call(thisArg, value, key, this);
        }
    }

    public [Symbol.iterator](): MapIterator<[K, V]> {
        return this.entries();
    }

    public getOrInsert(key: K, defaultValue: V): V {
        const value = this.get(key);
        if (value !== undefined) return value;

        this.set(key, defaultValue);
        return defaultValue;
    }

    public getOrInsertComputed(key: K, callback: Return<K, V>): V {
        const value = this.get(key);
        if (value !== undefined) return value;

        const newValue = callback(key);
        this.set(key, newValue);
        return newValue;
    }

    private resize(): void {
        const old = this.buckets;
        const newLen = old.length * 2;
        this.buckets = new Array(newLen).fill(null);

        for (const bucket of old) {
            if (!bucket) continue;
            for (let i = 0; i < bucket.length; i++) {
                const {key, value, hash} = bucket[i];
                const idx = hash & (newLen - 1);
                (this.buckets[idx] ??= []).push({key, value, hash});
            }
        }
    }
}

interface BucketEntry<K extends Comparable, V> {
    key: K;
    value: V;
    hash: number;
}