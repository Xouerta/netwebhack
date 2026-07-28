export interface IndexedIterable<T> extends Iterable<T> {
    getIndex(value: T): number;

    getByIndex(index: number): T | null;

    getByIndexOrThrow(index: number): T;

    getIndexOrThrow(value: T): number;

    size(): number;
}