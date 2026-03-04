import type {FunctionReturn} from "../../types.ts";
import {Optional} from "../Optional.ts";

export interface Ok<T> {
    readonly ok: true;
    readonly value: T;
}

export interface Err<E> {
    readonly ok: false;
    readonly error: E;
}

export type ResultType<T, E> = Ok<T> | Err<E>;

export class Result<T, E> {
    private readonly inner: ResultType<T, E>;

    public constructor(result: ResultType<T, E>) {
        this.inner = result;
    }

    public static ok<T, E>(value: T): Result<T, E> {
        return new Result<T, E>({ok: true, value});
    }

    public static err<T, E>(error: E): Result<T, E> {
        return new Result<T, E>({ok: false, error});
    }

    public isOk(): boolean {
        return this.inner.ok;
    }

    public isErr(): boolean {
        return !this.inner.ok;
    }

    public unwrap(): T {
        if (this.inner.ok) return this.inner.value;
        throw new Error(`Panic because ${this.inner.error}`);
    }

    public unwrapErr(): E {
        if (!this.inner.ok) return this.inner.error;
        throw new Error(`Result is Ok`);
    }

    public unwrapOr(defaultValue: T): T {
        return this.inner.ok ? this.inner.value : defaultValue;
    }

    public unwrapOrElse(func: FunctionReturn<E, T>): T {
        return this.inner.ok ? this.inner.value : func(this.inner.error);
    }

    public map<U>(func: FunctionReturn<T, U>): Result<U, E> {
        if (this.inner.ok) {
            return Result.ok(func(this.inner.value));
        }
        return Result.err(this.inner.error);
    }

    public mapErr<F>(func: FunctionReturn<E, F>): Result<T, F> {
        if (!this.inner.ok) {
            return Result.err(func(this.inner.error));
        }
        return Result.ok(this.inner.value);
    }

    public andThen<U>(func: FunctionReturn<T, Result<U, E>>): Result<U, E> {
        if (this.inner.ok) {
            return func(this.inner.value);
        }
        return Result.err(this.inner.error);
    }

    public ok(): Optional<T> {
        if (this.inner.ok) {
            return Optional.of(this.inner.value);
        }
        return Optional.empty();
    }
}

export function Ok<T>(value: T): Ok<T> {
    return {ok: true, value};
}

export function Err<E>(error: E): Err<E> {
    return {ok: false, error};
}