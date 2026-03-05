/**
 * 战斗系统模块
 * 处理玩家与怪物的战斗逻辑
 */
import type {PlayerEntity} from "../entity/PlayerEntity.ts";
import type {MobEntity} from "../entity/MobEntity.ts";
import type {Stats} from "../core/Stats.ts";
import type {BiConsumer} from "../types.ts";
import {SoundSystem} from "./SoundSystem.ts";

export interface FightCallback {
    addLog: BiConsumer<string, string>;
}

export class CombatSystem {
    /**
     * 计算伤害
     */
    public static calculateDamage(attackerAtk: number, defenderDef: number) {
        let baseDamage = Math.max(1, attackerAtk - defenderDef);
        // 20%概率±1伤害浮动
        if (Math.random() < 0.2) {
            baseDamage += Math.random() < 0.5 ? 1 : -1;
        }
        return Math.max(1, baseDamage);
    }

    /**
     * 玩家攻击怪物
     */
    public static playerAttack(player: PlayerEntity, mob: MobEntity, gameCallbacks: FightCallback) {
        const damage = this.calculateDamage(player.atk, mob.def);
        const oldHp = mob.getHealth();
        mob.takeDamage(damage);
        const died = mob.isDead();

        gameCallbacks.addLog(`⚔️ 你对${mob.getName()}造成 ${damage} 点伤害 (${mob.getName()} HP: ${oldHp}→${mob.getHealth()})`, 'fight');
        SoundSystem.play('/sound/attack.ogg');
        return {damage, died};
    }

    /**
     * 怪物反击
     */
    public static monsterAttack(mob: MobEntity, player: PlayerEntity, gameCallbacks: FightCallback) {
        const damage = this.calculateDamage(mob.atk, player.def);
        const oldHp = player.getHealth();
        player.takeDamage(damage)
        const died = player.isDead();

        gameCallbacks.addLog(`💥 ${mob.getName()}反击，对你造成 ${damage} 点伤害 (你的HP: ${oldHp}→${player.getHealth()})`, 'fight');

        return {damage, died};
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

        // 概率提升属性
        const upgradeChance = mob.type === 'big' ? 0.5 : 0.25;
        if (Math.random() < upgradeChance) {
            const r = Math.random();
            if (r < 0.33) {
                player.atk++;
                gameCallbacks.addLog(`✨ 击败${mob.getName()}，攻击+1`, 'fight');
            } else if (r < 0.66) {
                player.def++;
                gameCallbacks.addLog(`✨ 击败${mob.getName()}，防御+1`, 'fight');
            } else {
                player.increaseMaxHp(1);
                gameCallbacks.addLog(`✨ 击败${mob.getName()}，生命上限+1`, 'fight');
            }
        }
    }

    /**
     * 完整的战斗回合
     * @returns {Object} 战斗结果
     */
    public static fight(
        player: PlayerEntity,
        mob: MobEntity,
        mobs: MobEntity[],
        index: number,
        stats: Stats,
        gameCallbacks: FightCallback) {
        // 玩家攻击
        const attackResult = this.playerAttack(player, mob, gameCallbacks);

        if (attackResult.died) {
            if (mob.type === 'boss') {
                return {bossDefeated: true};
            }
            mobs.splice(index, 1);
            this.handleDefeat(mob, player, stats, gameCallbacks);
            return {monsterDefeated: true};
        }

        // 怪物反击
        const counterResult = this.monsterAttack(mob, player, gameCallbacks);

        if (counterResult.died) {
            return {playerDefeated: true};
        }

        return {fightOngoing: true};
    }
}
