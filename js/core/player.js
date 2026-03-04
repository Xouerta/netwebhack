/**
 * 玩家类模块
 * 管理玩家属性和状态
 */

class Player {
    constructor() {
        this.row = 1;
        this.col = 1;
        this.hp = 5;
        this.maxHp = 5;
        this.atk = 1;
        this.def = 1;

        // 背包系统
        this.inventory = {
            items: [], // 物品数组，最大10个
            maxSize: 10
        };
    }

    /**
     * 重置玩家到起点
     */
    reset() {
        this.row = 1;
        this.col = 1;
        this.hp = this.maxHp;
    }

    /**
     * 受到伤害
     */
    takeDamage(damage) {
        this.hp = Math.max(0, this.hp - damage);
        return this.hp <= 0;
    }

    /**
     * 治疗
     */
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    /**
     * 增加最大生命值
     */
    increaseMaxHp(amount) {
        this.maxHp += amount;
        this.hp += amount;
    }

    /**
     * 计算玩家战力（用于AI判断）
     */
    getPower() {
        return this.atk + this.def + Math.floor(this.hp / 2);
    }

    /**
     * 移动到新位置
     */
    moveTo(row, col) {
        this.row = row;
        this.col = col;
    }

    /**
     * 检查是否在终点
     */
    isAtGoal(goalPos) {
        return this.row === goalPos.row && this.col === goalPos.col;
    }

    // ========== 背包系统方法 ==========

    /**
     * 添加物品到背包
     * @param {string} itemType - 物品类型: 'sword', 'shield', 'potion'
     * @returns {boolean} 是否添加成功
     */
    addToInventory(itemType) {
        if (this.inventory.items.length >= this.inventory.maxSize) {
            return false;
        }

        this.inventory.items.push({
            type: itemType,
            id: Date.now() + Math.random() // 唯一ID
        });

        return true;
    }

    /**
     * 从背包移除物品
     * @param {number} index - 物品索引
     * @returns {object|null} 移除的物品
     */
    removeFromInventory(index) {
        if (index < 0 || index >= this.inventory.items.length) {
            return null;
        }
        return this.inventory.items.splice(index, 1)[0];
    }

    /**
     * 使用血药
     * @returns {boolean} 是否使用成功
     */
    usePotion() {
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
    useSword() {
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
    useShield() {
        const shieldIndex = this.inventory.items.findIndex(item => item.type === 'shield');

        if (shieldIndex === -1) {
            return false;
        }

        this.inventory.items.splice(shieldIndex, 1);
        this.def++;
        return true;
    }

    /**
     * 获取背包物品列表
     */
    getInventory() {
        return this.inventory.items;
    }

    /**
     * 获取背包剩余空间
     */
    getInventorySpace() {
        return this.inventory.maxSize - this.inventory.items.length;
    }

    /**
     * 检查背包是否已满
     */
    isInventoryFull() {
        return this.inventory.items.length >= this.inventory.maxSize;
    }

    /**
     * 获取物品显示名称
     */
    getItemDisplayName(itemType) {
        const names = {
            'sword': '🗡️ 剑',
            'shield': '🛡️ 盾',
            'potion': '🧴 血药'
        };
        return names[itemType] || itemType;
    }
}
