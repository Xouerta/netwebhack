import type {NbtType, NbtTypeIndex} from "../NbtType.ts";

export class NbtInvalid implements NbtType<any> {
    private readonly type: number;

    public constructor(type: number) {
        this.type = type;
    }

    public read() {
        throw new TypeError(`Invalid type ${this.type}`);
    }

    public getType(): NbtTypeIndex {
        return this.type;
    }

    public toString(): string {
        return `Invalid ${this.type}`;
    }
}