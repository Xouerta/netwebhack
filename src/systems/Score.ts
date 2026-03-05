/**
 * 分数计算系统模块
 * 计算游戏结束时的详细分数
 */
import type {PlayerEntity} from "../entity/PlayerEntity.ts";
import type {Stats} from "../core/Stats.ts";

export interface Score {
    baseScore: number;
    smallKillScore: number;
    bigKillScore: number;
    bossScore: number;
    atkScore: number;
    defScore: number;
    hpScore: number;
    itemScore: number;
    stepScore: number;
    eventScore: number;
    levelScore: number;
    total: number;
    details: ScoreDetails;
}

export interface ScoreDetails {
    smallKills: number;
    bigKills: number;
    bossKilled: boolean;
    atk: number;
    def: number;
    hp: number;
    items: number;
    steps: number;
    events: number;
    level: number;
}

export const ScoreSystem = {
    /**
     * 计算总分
     */
    calculate(player: PlayerEntity, stats: Stats, currentLevel: number): Score {
        const baseScore = 100;
        const smallKillScore = stats.smallKills * 10;
        const bigKillScore = stats.bigKills * 25;
        const bossScore = stats.bossKilled ? 500 : 0;
        const atkScore = player.atk * 5;
        const defScore = player.def * 5;
        const hpScore = Math.max(0, player.getHealth()) * 10;
        const itemScore = stats.itemsCollected * 20;
        const stepScore = Math.max(0, 300 - stats.steps);
        const eventScore = stats.eventsTriggered * 15;
        const levelScore = currentLevel * 100;

        const total = baseScore + smallKillScore + bigKillScore + bossScore +
            atkScore + defScore + hpScore + itemScore + stepScore +
            eventScore + levelScore;

        return {
            baseScore,
            smallKillScore,
            bigKillScore,
            bossScore,
            atkScore,
            defScore,
            hpScore,
            itemScore,
            stepScore,
            eventScore,
            levelScore,
            total,
            details: {
                smallKills: stats.smallKills,
                bigKills: stats.bigKills,
                bossKilled: stats.bossKilled,
                atk: player.atk,
                def: player.def,
                hp: player.getHealth(),
                items: stats.itemsCollected,
                steps: stats.steps,
                events: stats.eventsTriggered,
                level: currentLevel
            }
        };
    },

    /**
     * 更新结算弹窗显示
     */
    updateModal(score: Score, isVictory: boolean) {
        document.getElementById('resultTitle')!.innerText = isVictory ? '🏆 胜利！你击败了Boss！' : '💔 勇者倒下了';

        document.getElementById('baseScore')!.innerText = score.baseScore.toString();
        document.getElementById('smallKills')!.innerText = score.details.smallKills + ' ×10 = ' + score.smallKillScore;
        document.getElementById('bigKills')!.innerText = score.details.bigKills + ' ×25 = ' + score.bigKillScore;
        document.getElementById('bossKill')!.innerText = score.details.bossKilled ? '✓ +500' : '✗ 0';
        document.getElementById('atkScore')!.innerText = score.details.atk + ' ×5 = ' + score.atkScore;
        document.getElementById('defScore')!.innerText = score.details.def + ' ×5 = ' + score.defScore;
        document.getElementById('hpScore')!.innerText = score.details.hp + ' ×10 = ' + score.hpScore;
        document.getElementById('itemScore')!.innerText = score.details.items + ' ×20 = ' + score.itemScore;
        document.getElementById('stepScore')!.innerText = score.details.steps + ' (300-' + score.details.steps + '=' + score.stepScore + ')';
        document.getElementById('eventScore')!.innerText = score.details.events + ' ×15 = ' + score.eventScore;
        document.getElementById('levelScore')!.innerText = score.details.level + ' ×100 = ' + score.levelScore;
        document.getElementById('totalScore')!.innerText = '总分: ' + score.total;
    }
};
