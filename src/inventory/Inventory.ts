import type {Item} from "../item/Item.ts";

export class Inventory {
    private readonly items: Item[] = [];
    private maxSize: number;

    public constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    public addItem(item: Item) {
        if (this.items.length >= this.maxSize) {
            return false;
        }

        this.items.push(item);
        return true;
    }

    public removeIndex(index: number): Item | null {
        if (index < 0 || index >= this.items.length) {
            return null;
        }

        return this.items.splice(index, 1)[0];
    }

    public removeItem(item: Item): Item | null {
        return this.removeIndex(this.findItem(item));
    }

    public findItem(item: Item): number {
        return this.items.indexOf(item);
    }

    public getItems() {
        return this.items;
    }

    public isFull() {
        return this.items.length >= this.maxSize;
    }
}