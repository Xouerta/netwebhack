export class AtomicInteger {
    private value: number;

    public constructor(initial = 1) {
        this.value = initial;
    }

    public get(): number {
        return this.value;
    }

    public set(newValue: number): void {
        this.value = newValue;
    }

    public incrementAndGet(): number {
        return ++this.value;
    }

    public getAndIncrement(): number {
        return this.value++;
    }

    public decrementAndGet(): number {
        return --this.value;
    }

    public getAndDecrement(): number {
        return this.value--;
    }

    public addAndGet(delta: number): number {
        this.value += delta;
        return this.value;
    }

    public reset() {
        this.value = 1;
    }
}
