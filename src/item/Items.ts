import {config} from "../utils/uit.ts";
import type {Item} from "./Item.ts";

export class Items {
    private static readonly items: Map<number, Item> = new Map();

    public static readonly SWORD = this.registry(0x10, 'sword', '🗡️', '剑');
    public static readonly SHIELD = this.registry(0x11, 'shield', '🛡️', '盾');
    public static readonly POTION = this.registry(0x12, 'potion', '🧴', '恢复药剂');

    private static registry(type: number, name: string, icon: string = '📦', displayName?: string): Item {
        if (this.items.has(type)) {
            throw new Error(`Item ${type} already exists`);
        }

        if (!displayName) displayName = name;
        const item = config({type, name, icon, displayName});
        this.items.set(type, item);
        return item;
    }

    public static getItem(type: number) {
        return this.items.get(type) ?? null;
    }
}