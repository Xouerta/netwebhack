export interface Comparable {
    equal(other: unknown): boolean;

    // i32
    hashCode(): number;
}