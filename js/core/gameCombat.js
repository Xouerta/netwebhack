/**
 * 战斗处理模块
 * 处理玩家与怪物的战斗逻辑
 */

class GameCombat {
    constructor(gameState, logSystem, modalManager, inventoryUI) {
        this.state = gameState;
        this.logSystem = logSystem;
        this.modalManager = modalManager;
        this.inventoryUI = inventoryUI;
    }

    /**
     * 处理战斗
     */
    handleCombat(monster) {
        if (this.state.inCombat) return;
        this.state.inCombat = true;

        const monsterIdx = this.state.monsters.findIndex(m => m.id === monster.id);
        if (monsterIdx === -1) {
            this.state.inCombat = false;
            return;
        }

        const result = CombatSystem.fight(
            this.state.player,
            monster,
            this.state.monsters,
            monsterIdx,
            this.state.stats,
            {
                addLog: (msg, type) => this.logSystem.add(msg, type)
            }
        );

        if (result.bossDefeated) {
            this.state.stats.bossKilled = true;
            this.state.gameWin = true;
            const score = ScoreSystem.calculate(
                this.state.player, this.state.stats, this.state.currentLevel
            );
            this.modalManager.showGameOverModal(score, true);
        }

        if (result.playerDefeated) {
            this.state.gameOver = true;
            const score = ScoreSystem.calculate(
                this.state.player, this.state.stats, this.state.currentLevel
            );
            this.modalManager.showGameOverModal(score, false);
        }

        this.state.inCombat = false;

        this.state.updateUI();
        if (this.inventoryUI) {
            this.inventoryUI.updateInventory(this.state.player.getInventory());
        }
    }
}
