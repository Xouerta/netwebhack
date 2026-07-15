import {Entity} from "./Entity.ts";
import type {Position} from "../core/Position.ts";
import type {Item} from "../item/Item.ts";
import {Items} from "../item/Items.ts";
import type {Consumer} from "../types/types.ts";
import {Inventory} from "../inventory/Inventory.ts";
import {SoundSystem} from "../systems/SoundSystem.ts";

export class PlayerEntity extends Entity {
    private readonly inventory: Inventory = new Inventory(10);

    public constructor() {
        super(1, 1, 2, 1, 1);
    }

    public takeDamage(damage: number) {
        super.takeDamage(damage);
        SoundSystem.play('hurt');
    }

    /**
     * 重置玩家到起点
     */
    public reset() {
        this.setPos(1, 1);
        this.setHealth(this.getMaxHealth());
    }

    /**
     * 增加最大生命值
     */
    public increaseMaxHp(amount: number) {
        this.setMaxHealth(this.getMaxHealth() + amount);
        this.setHealth(this.getHealth() + amount);
    }

    /**
     * 计算玩家战力（用于AI判断）
     */
    public getPower() {
        return this.atk + this.def + Math.floor(this.getHealth() / 2);
    }

    /**
     * 检查是否在终点
     */
    public isAtGoal(goalPos: Position) {
        return this.row === goalPos.row && this.col === goalPos.col;
    }

    public getInventory() {
        return this.inventory;
    }

    /**
     * 使用血药
     * @returns {boolean} 是否使用成功
     */
    public usePotion(): number {
        if (this.getHealth() === this.getMaxHealth()) return 2;
        return this.useItem(Items.POTION, () => this.heal(1)) ? 1 : 0;
    }

    /**
     * 使用剑（永久提升攻击力）
     * @returns {boolean} 是否使用成功
     */
    public useSword(): boolean {
        return this.useItem(Items.SWORD, () => this.atk++);
    }

    /**
     * 使用盾（永久提升防御力）
     * @returns {boolean} 是否使用成功
     */
    public useShield(): boolean {
        return this.useItem(Items.SHIELD, () => this.def++);
    }

    private useItem(item: Item, callback?: Consumer<Item>): boolean {
        const removed = this.inventory.removeItem(item);
        if (removed === null) return false;
        callback?.(item);
        return true;
    }
}
