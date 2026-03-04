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
}
