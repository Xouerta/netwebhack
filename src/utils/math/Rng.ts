export abstract class Rng {
    /** 下一个 uint32 */
    public abstract next(): number;

    public nextFloat(): number {
        return this.next() / 0x100000000;
    }

    public nextInt(min: number, max: number): number {
        return min + (this.next() % (max - min + 1));
    }

    public pick<T>(arr: readonly T[]): T {
        return arr[this.next() % arr.length];
    }

    public shuffleInplace<T>(arr: T[]): T[] {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.next() % (i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}