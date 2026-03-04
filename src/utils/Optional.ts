import type {Consumer, Predicate, Supplier} from "../types.ts";

export class Optional<T> {
    private static readonly EMPTY = Object.freeze(new Optional(null)) as Optional<null>;
    private readonly value: T;

    public static empty<T>() {
        const t = this.EMPTY as Optional<T>;
        Object.freeze(t);
        return t;
    }

    private constructor(value: T) {
        this.value = value;
    }

    public static of<T>(value: T): Optional<T> {
        if (value === null || value === undefined) {
            throw new Error(`Optional cannot be a null or undefined`);
        }
        return new Optional(value);
    }

    public static ofNullable<T>(value: T | null | undefined): Optional<T> {
        return (value === null || value === undefined) ? this.EMPTY as Optional<T> : new Optional<T>(value);
    }

    public get(): T {
        if (this.value === null) {
            throw new ReferenceError("No value present");
        }

        return this.value;
    }

    public isPresent(): boolean {
        return this.value !== null;
    }

    public isEmpty(): boolean {
        return this.value === null;
    }

    public ifPresent(action: Consumer<T>): void {
        if (this.value !== null) {
            action(this.value);
        }
    }

    public ifPresentOrElse(action: Consumer<T>, emptyAction: CallableFunction): void {
        if (this.value !== null) {
            action(this.value);
        } else {
            emptyAction();
        }
    }

    public filter(predicate: Predicate<T>): Optional<T> {
        if (this.isEmpty()) {
            return this;
        }
        return predicate(this.value) ? this : Optional.empty();
    }

    public or(supplier: Supplier<Optional<T>>): Optional<T> {
        if (this.isPresent()) {
            return this;
        }
        return supplier();
    }

    public orElse(other: T) {
        return this.value !== null ? this.value : other;
    }

    public orElseGet(supplier: Supplier<T>): T {
        return this.value !== null ? this.value : supplier();
    }
}