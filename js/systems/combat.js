/**
 * 战斗系统模块
 * 处理玩家与怪物的战斗逻辑
 */

const CombatSystem = {
    /**
     * 计算伤害
     */
    calculateDamage(attackerAtk, defenderDef) {
        let baseDamage = Math.max(1, attackerAtk - defenderDef);
        // 20%概率±1伤害浮动
        if (Math.random() < 0.2) {
            baseDamage += Math.random() < 0.5 ? 1 : -1;
        }
        return Math.max(1, baseDamage);
    },

    /**
     * 玩家攻击怪物
     */
    playerAttack(player, monster, gameCallbacks) {
        const damage = this.calculateDamage(player.atk, monster.def);
        const oldHp = monster.hp;
        const died = monster.takeDamage(damage);

        gameCallbacks.addLog(`⚔️ 你对${monster.getName()}造成 ${damage} 点伤害 (${monster.getName()} HP: ${oldHp}→${monster.hp})`, 'fight');

        return { damage, died };
    },

    /**
     * 怪物反击
     */
    monsterAttack(monster, player, gameCallbacks) {
        const damage = this.calculateDamage(monster.atk, player.def);
        const oldHp = player.hp;
        const died = player.takeDamage(damage);

        gameCallbacks.addLog(`💥 ${monster.getName()}反击，对你造成 ${damage} 点伤害 (你的HP: ${oldHp}→${player.hp})`, 'fight');

        return { damage, died };
    },

    /**
     * 处理击败怪物后的奖励
     */
    handleDefeat(monster, player, stats, gameCallbacks) {
        // 统计杀敌
        if (monster.type === 'big') {
            stats.bigKills++;
        } else if (monster.type === 'small') {
            stats.smallKills++;
        }

        // 概率提升属性
        const upgradeChance = monster.type === 'big' ? 0.5 : 0.25;
        if (Math.random() < upgradeChance) {
            const r = Math.random();
            if (r < 0.33) {
                player.atk++;
                gameCallbacks.addLog(`✨ 击败${monster.getName()}，攻击+1`, 'fight');
            } else if (r < 0.66) {
                player.def++;
                gameCallbacks.addLog(`✨ 击败${monster.getName()}，防御+1`, 'fight');
            } else {
                player.increaseMaxHp(1);
                gameCallbacks.addLog(`✨ 击败${monster.getName()}，生命上限+1`, 'fight');
            }
        }
    },

    /**
     * 完整的战斗回合
     * @returns {Object} 战斗结果
     */
    fight(player, monster, monsters, index, stats, gameCallbacks) {
        // 玩家攻击
        const attackResult = this.playerAttack(player, monster, gameCallbacks);

        if (attackResult.died) {
            if (monster.type === 'boss') {
                return { bossDefeated: true };
            }
            monsters.splice(index, 1);
            this.handleDefeat(monster, player, stats, gameCallbacks);
            return { monsterDefeated: true };
        }

        // 怪物反击
        const counterResult = this.monsterAttack(monster, player, gameCallbacks);

        if (counterResult.died) {
            return { playerDefeated: true };
        }

        return { fightOngoing: true };
    }
};
