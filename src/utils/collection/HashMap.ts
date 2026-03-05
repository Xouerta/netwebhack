import type {Comparable} from "../../types.ts";

export class HashMap<K extends Comparable, V> implements Map<K, V> {
    private readonly buckets: Map<string, { key: K, value: V }[]> = new Map();
    private itemSize: number = 0;

    public set(key: K, value: V) {
        const hash = key.hashCode();
        const bucket = this.buckets.get(hash);

        if (!bucket) {
            this.buckets.set(hash, [{key, value}]);
            this.itemSize++;
            return this;
        }

        const existingIndex = bucket.findIndex(entry => key.equals(entry.key));
        if (existingIndex >= 0) {
            bucket[existingIndex].value = value;
        } else {
            bucket.push({key, value});
        }

        this.itemSize++;
        return this;
    }

    public get(key: K): V | undefined {
        const hash = key.hashCode();
        const bucket = this.buckets.get(hash);

        if (!bucket) return undefined;

        const entry = bucket.find(entry => key.equals(entry.key));
        return entry?.value;
    }

    public has(key: K): boolean {
        return this.get(key) !== undefined;
    }

    public delete(key: K): boolean {
        const hash = key.hashCode();
        const bucket = this.buckets.get(hash);

        if (!bucket) return false;

        const index = bucket.findIndex(entry => key.equals(entry.key));
        if (index >= 0) {
            bucket.splice(index, 1);
            if (bucket.length === 0) {
                this.buckets.delete(hash);
            }
            this.itemSize--;
            return true;
        }

        return false;
    }

    public clear(): void {
        this.buckets.clear();
        this.itemSize = 0;
    }

    public get size(): number {
        return this.itemSize;
    }

    public keySize(): number {
        return this.buckets.size;
    }

    public* entries(): MapIterator<[K, V]> {
        for (const bucket of this.buckets.values()) {
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

    public readonly [Symbol.toStringTag]: string = 'HashMap';
}
