/**
 * 怪物类模块
 * 管理怪物属性和AI行为
 */
import {Entity} from "./Entity.ts";
import type {Supplier} from "../types.ts";

export class MobEntity extends Entity {
    public readonly id: string;
    public readonly type: string;

    public constructor(id: string, row: number, col: number, type: string, atk: number, def: number, hp: number) {
        super(row, col, hp, atk, def);
        this.id = id;
        this.type = type; // 'small', 'big', 'boss'
    }

    /**
     * 计算怪物战力
     */
    public getPower() {
        return this.atk + this.def + Math.floor(this.getHealth() / 2);
    }

    /**
     * 获取怪物名称
     */
    public getName() {
        const names: Record<string, string> = {
            'small': '小怪',
            'big': '大怪',
            'boss': 'Boss'
        };
        return names[this.type] || '怪物';
    }

    /**
     * 克隆怪物（用于保存状态）
     */
    public clone() {
        return new MobEntity(this.id, this.pos.row, this.pos.col, this.type, this.atk, this.def, this.getHealth());
    }
}

/**
 * 怪物生成器模块
 */
export const MonsterGenerator = {
    /**
     * 根据层数生成怪物属性
     */
    generateStats(level: number, type: string, rng: Supplier<number>) {
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
    spawn(level: number, type: string, row: number, col: number, id: string, rng: Supplier<number>) {
        const stats = this.generateStats(level, type, rng);
        return new MobEntity(id, row, col, type, stats.atk, stats.def, stats.hp);
    }
};
