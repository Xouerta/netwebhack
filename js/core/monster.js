/**
 * 怪物类模块
 * 管理怪物属性和AI行为
 */

class Monster {
    constructor(id, row, col, type, atk, def, hp) {
        this.id = id;
        this.row = row;
        this.col = col;
        this.type = type; // 'small', 'big', 'boss'
        this.atk = atk;
        this.def = def;
        this.hp = hp;
        this.maxHp = hp;
    }

    /**
     * 计算怪物战力
     */
    getPower() {
        return this.atk + this.def + Math.floor(this.hp / 2);
    }

    /**
     * 受到伤害
     */
    takeDamage(damage) {
        this.hp -= damage;
        return this.hp <= 0;
    }

    /**
     * 获取怪物名称
     */
    getName() {
        const names = {
            'small': '小怪',
            'big': '大怪',
            'boss': 'Boss'
        };
        return names[this.type] || '怪物';
    }

    /**
     * 克隆怪物（用于保存状态）
     */
    clone() {
        return new Monster(this.id, this.row, this.col, this.type, this.atk, this.def, this.hp);
    }
}

/**
 * 怪物生成器模块
 */
const MonsterGenerator = {
    /**
     * 根据层数生成怪物属性
     */
    generateStats(level, type, rng) {
        const isBig = type === 'big';
        const isBoss = type === 'boss';

        if (isBoss) {
            return {
                atk: Math.min(10 + level * 2 + Math.floor(rng() * 4), 25),
                def: Math.min(8 + level * 2 + Math.floor(rng() * 3), 20),
                hp: Math.min(40 + level * 8 + Math.floor(rng() * 15), 80)
            };
        } else if (isBig) {
            return {
                atk: Math.min(2 + level + Math.floor(rng() * 3), 14),
                def: Math.min(3 + level + Math.floor(rng() * 2), 14),
                hp: Math.min(5 + level * 2 + Math.floor(rng() * 4), 15)
            };
        } else {
            return {
                atk: Math.min(1 + Math.floor(level * 0.8) + Math.floor(rng() * 2), 9),
                def: Math.min(1 + Math.floor(level * 0.8) + Math.floor(rng() * 2), 9),
                hp: Math.min(2 + level + Math.floor(rng() * 3), 10)
            };
        }
    },

    /**
     * 生成怪物
     */
    spawn(level, type, row, col, id, rng) {
        const stats = this.generateStats(level, type, rng);
        return new Monster(id, row, col, type, stats.atk, stats.def, stats.hp);
    }
};
