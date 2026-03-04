export type Constructor<T = any> = new (...args: any[]) => T;

export type UUID = `${string}-${string}-${string}-${string}-${string}`;

export type FunctionReturn<T, R> = (val: T) => R;

export type Consumer<T> = (val: T) => void;

export type BiConsumer<T, U> = (val1: T, val2: U) => void;

export type AsyncConsumer<T> = (val: T) => Promise<void>;

export type UnaryOperator<T> = (val: T) => T;

export type Supplier<T> = () => T;

export type Predicate<T> = (val: T) => boolean;

export interface Comparable {
    equals(other: Comparable): boolean;

    hashCode(): string;
}

export interface StoreConfig {
    name: string; // 对象存储名称
    keyPath: string | string[]; // 主键字段名
    autoIncrement?: boolean; // 是否启用主键自增
    indexes?: {
        name: string;       // 索引名称
        keyPath: string | string[];    // 索引字段路径
        unique?: boolean;   // 是否唯一索引
    }[];
}