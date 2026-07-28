/**
 * 战斗系统模块
 * 处理玩家与怪物的战斗逻辑
 */
import type {PlayerEntity} from "../entity/PlayerEntity.ts";
import type {MobEntity} from "../entity/MobEntity.ts";
import type {Stats} from "../core/Stats.ts";
import type {BiConsumer} from "../types/types.ts";
import {SoundSystem} from "./SoundSystem.ts";

export interface FightCallback {
    addLog: BiConsumer<string, string>;
}

export class CombatSystem {
    public static calculateDamage(attackerAtk: number, defenderDef: number) {
        let baseDamage = Math.max(1, attackerAtk - defenderDef);
        // 20%概率±1伤害浮动
        if (Math.random() < 0.2) {
            baseDamage += Math.random() < 0.5 ? 1 : -1;
        }
        return baseDamage >>> 0;
    }

    /**
     * 玩家攻击怪物
     */
    public static playerAttack(player: PlayerEntity, mob: MobEntity, gameCallbacks: FightCallback) {
        const damage = this.calculateDamage(player.atk, mob.def);
        const oldHp = mob.getHealth();
        mob.takeDamage(damage);

        gameCallbacks.addLog(`⚔️ 你对${mob.getName()}造成 ${damage} 点伤害 (${mob.getName()} HP: ${oldHp}→${mob.getHealth()})`, 'fight');
        SoundSystem.play('attack');
    }

    /**
     * 怪物反击
     */
    public static monsterAttack(mob: MobEntity, player: PlayerEntity, gameCallbacks: FightCallback) {
        const damage = this.calculateDamage(mob.atk, player.def);
        const oldHp = player.getHealth();
        player.takeDamage(damage);

        if (damage === 0) SoundSystem.play('block');
        gameCallbacks.addLog(`💥 ${mob.getName()}反击，对你造成 ${damage} 点伤害 (你的HP: ${oldHp}→${player.getHealth()})`, 'fight');
    }

    /**
     * 处理击败怪物后的奖励
     */
    public static handleDefeat(mob: MobEntity, player: PlayerEntity, stats: Stats, gameCallbacks: FightCallback) {
        // 统计杀敌
        if (mob.type === 'big') {
            stats.bigKills++;
        } else if (mob.type === 'small') {
            stats.smallKills++;
        }

        const baseChance = mob.type === 'big' ? 0.5 : 0.25;
        let actualChance = baseChance + stats.upgradeLuck;

        // 概率提升属性
        if (Math.random() < actualChance) {
            this.giveUpgrade(mob, player, gameCallbacks);
            stats.upgradeLuck = 0;
        } else {
            stats.upgradeLuck = stats.upgradeLuck + mob.type === 'big' ? 0.3 : 0.15;
            stats.upgradeLuck = Math.min(1.0, stats.upgradeLuck);
            if (stats.upgradeLuck >= 0.9) {
                gameCallbacks.addLog('💫 你感觉到命运正在眷顾你...', 'fight');
            }
        }
    }

    private static giveUpgrade(mob: MobEntity, player: PlayerEntity, gameCallbacks: FightCallback) {
        // TODO 用损失血量计算
        const hpRatio = player.getHealth() / player.getMaxHealth();
        const isBrutalFight = hpRatio < 0.3;

        let upgrades = 1;
        if (mob.type === 'big' && isBrutalFight) {
            upgrades = 2;
            gameCallbacks.addLog(`🔥 险胜强敌! 获得双倍成长！`, 'fight');
        }

        for (let i = 0; i < upgrades; i++) {
            const r = Math.random();
            if (r < 0.33) {
                player.atk++;
                gameCallbacks.addLog(`✨ ${mob.getName()}的战斗经验让你攻击 +1`, 'fight');
            } else if (r < 0.66) {
                player.def++;
                gameCallbacks.addLog(`✨ 从${mob.getName()}身上学会了防御技巧, 防御 +1`, 'fight');
            } else {
                player.increaseMaxHp(1);
                gameCallbacks.addLog(`✨ 战胜${mob.getName()}后, 你的生命力变得更顽强, 生命上限 +1`, 'fight');
            }
        }

        SoundSystem.play('levelup');
    }

    /**
     * 完整的战斗回合
     * @returns {number} 战斗结果
     */
    public static fight(
        player: PlayerEntity,
        mob: MobEntity,
        mobs: MobEntity[],
        index: number,
        stats: Stats,
        gameCallbacks: FightCallback): number {
        // 玩家攻击
        this.playerAttack(player, mob, gameCallbacks);
        if (mob.isDead()) {
            if (mob.type === 'boss') {
                return 3;
            }
            mobs.splice(index, 1);
            this.handleDefeat(mob, player, stats, gameCallbacks);
            return 2;
        }

        // 怪物反击
        this.monsterAttack(mob, player, gameCallbacks);
        if (player.isDead()) {
            return 1;
        }

        return 0;
    }
}
