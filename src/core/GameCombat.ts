/**
 * 战斗处理模块
 * 处理玩家与怪物的战斗逻辑
 */
import type {LogSystem} from "../systems/log.ts";
import type {GameState} from "./GameState.ts";
import type {ModalManager} from "../ui/modal.ts";
import type {InventoryUI} from "../ui/inventory.ts";
import type {MobEntity} from "../entity/MobEntity.ts";
import {CombatSystem} from "../systems/combat.ts";
import {ScoreSystem} from "../systems/score.ts";

export class GameCombat {
    private readonly state: GameState;
    private readonly logSystem: LogSystem;
    private readonly modalManager: ModalManager;
    private readonly inventoryUI: InventoryUI;

    constructor(gameState: GameState, logSystem: LogSystem, modalManager: ModalManager, inventoryUI: InventoryUI) {
        this.state = gameState;
        this.logSystem = logSystem;
        this.modalManager = modalManager;
        this.inventoryUI = inventoryUI;
    }

    /**
     * 处理战斗
     */
    handleCombat(mob: MobEntity) {
        if (this.state.inCombat) return;
        this.state.inCombat = true;

        const monsterIdx = this.state.monsters.findIndex(m => m.id === mob.id);
        if (monsterIdx === -1) {
            this.state.inCombat = false;
            return;
        }

        const result = CombatSystem.fight(
            this.state.player,
            mob,
            this.state.monsters,
            monsterIdx,
            this.state.stats,
            {
                addLog: (msg: string, type: string) => this.logSystem.add(msg, type)
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
