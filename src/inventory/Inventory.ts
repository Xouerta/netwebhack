import type {ItemStack} from "../item/ItemStack.ts";
import type {Item} from "../item/Item.ts";

export interface Inventory {
    length(): number;

    isEmpty(): boolean;

    getStack(slot: number): ItemStack;

    removeStack(slot: number, amount?: number): ItemStack;

    setStack(slot: number, stack: ItemStack): void;

    getMaxCountPerStack(): number;

    getMaxCount(stack: ItemStack): number;

    markDirty(): void;

    count(item: Item): number;

    containsAny(): boolean;
}