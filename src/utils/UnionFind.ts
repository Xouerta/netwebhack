export class UnionFind<T> {
    private readonly parent: Map<T, T> = new Map();

    public find(k: T): T {
        if (!this.parent.has(k)) {
            this.parent.set(k, k);
        }
        if (this.parent.get(k) !== k) {
            this.parent.set(k, this.find(this.parent.get(k)!));
        }
        return this.parent.get(k)!;
    }

    public union(a: T, b: T) {
        const ra = this.find(a), rb = this.find(b);
        if (ra !== rb) {
            this.parent.set(ra, rb);
        }
    }

    public connected(a: T, b: T) {
        return this.find(a) === this.find(b);
    }
}