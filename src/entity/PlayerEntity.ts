import {Entity} from "./Entity.ts";
import type {Position} from "../core/Position.ts";
import type {Item} from "../item/Item.ts";

export class PlayerEntity extends Entity {
    private readonly inventory: { items: Item[], maxSize: number };

    public constructor() {
        super(1, 1, 5, 1, 1);

        this.inventory = {
            items: [], // 物品数组，最大10个
            maxSize: 10
        };
    }

    /**
     * 重置玩家到起点
     */
    public reset() {
        this.pos.row = 1;
        this.pos.col = 1;
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
     * 移动到新位置
     */
    public moveTo(row: number, col: number) {
        this.pos.row = row;
        this.pos.col = col;
    }

    /**
     * 检查是否在终点
     */
    public isAtGoal(goalPos: Position) {
        return this.pos.row === goalPos.row && this.pos.col === goalPos.col;
    }

    // ========== 背包系统方法 ==========

    /**
     * 获取背包物品列表
     */
    public getInventory() {
        return this.inventory;
    }

    /**
     * 添加物品到背包
     * @param {string} itemType - 物品类型: 'sword', 'shield', 'potion'
     * @returns {boolean} 是否添加成功
     */
    public addToInventory(itemType: 'sword' | 'shield' | 'potion'): boolean {
        if (this.inventory.items.length >= this.inventory.maxSize) {
            return false;
        }

        this.inventory.items.push({
            type: itemType,
            id: performance.now() + crypto.randomUUID()
        });

        return true;
    }

    /**
     * 从背包移除物品
     * @param {number} index - 物品索引
     * @returns {object|null} 移除的物品
     */
    public removeFromInventory(index: number): Item | null {
        if (index < 0 || index >= this.inventory.items.length) {
            return null;
        }
        return this.inventory.items.splice(index, 1)[0];
    }

    /**
     * 使用血药
     * @returns {boolean} 是否使用成功
     */
    public usePotion(): boolean {
        // 查找背包中的血药
        const potionIndex = this.inventory.items.findIndex(item => item.type === 'potion');

        if (potionIndex === -1) {
            return false;
        }

        // 移除血药并治疗
        this.inventory.items.splice(potionIndex, 1);
        this.heal(1);
        return true;
    }

    /**
     * 使用剑（永久提升攻击力）
     * @returns {boolean} 是否使用成功
     */
    public useSword(): boolean {
        const swordIndex = this.inventory.items.findIndex(item => item.type === 'sword');

        if (swordIndex === -1) {
            return false;
        }

        this.inventory.items.splice(swordIndex, 1);
        this.atk++;
        return true;
    }

    /**
     * 使用盾（永久提升防御力）
     * @returns {boolean} 是否使用成功
     */
    public useShield(): boolean {
        const shieldIndex = this.inventory.items.findIndex(item => item.type === 'shield');

        if (shieldIndex === -1) {
            return false;
        }

        this.inventory.items.splice(shieldIndex, 1);
        this.def++;
        return true;
    }

    /**
     * 获取背包剩余空间
     */
    public getInventorySpace() {
        return this.inventory.maxSize - this.inventory.items.length;
    }

    /**
     * 检查背包是否已满
     */
    public isInventoryFull() {
        return this.inventory.items.length >= this.inventory.maxSize;
    }

    /**
     * 获取物品显示名称
     */
    public getItemDisplayName(itemType: 'sword' | 'shield' | 'potion') {
        const names = {
            'sword': '🗡️ 剑',
            'shield': '🛡️ 盾',
            'potion': '🧴 血药'
        };
        return names[itemType] ?? itemType;
    }
}
