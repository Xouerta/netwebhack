/**
 * 游戏核心类（精简版）
 * 整合各个模块，提供对外接口
 */
import {GameState} from "./GameState.ts";
import type {Renderer} from "../render/Renderer.ts";
import type {ModalManager} from "../render/Modal.ts";
import type {LogSystem} from "../systems/LogSystem.ts";
import {GameLevel} from "./GameLevel.ts";
import {MobAi} from "../ai/MobAi.ts";
import {BossAI} from "../ai/BossAI.ts";
import {GameCombat} from "./GameCombat.ts";
import {Seed} from "./Seed.ts";
import {EventSystem} from "../systems/EventSystem.ts";
import {Controls} from "../render/Controls.ts";
import type {InventoryUI} from "../render/InventoryUi.ts";
import {ScoreSystem} from "../systems/score/ScoreSystem.ts";
import {SoundSystem} from "../systems/SoundSystem.ts";
import {Items} from "../item/Items.ts";
import {GameRng} from "../types/GameRng.ts";

export class Game {
    public readonly state: GameState;
    private currentSeed!: string;
    private rngs!: GameRng;
    private renderer!: Renderer;
    private modalManager!: ModalManager;
    private logSystem!: LogSystem;
    public controls!: Controls;
    private inventoryUI!: InventoryUI;
    private levelManager!: GameLevel;
    private monsterAI!: MobAi;
    public bossAI!: BossAI;
    private combatSystem!: GameCombat;

    public constructor() {
        this.state = new GameState();
    }

    public init(renderer: Renderer, modalManager: ModalManager, logSystem: LogSystem, inventoryUI: InventoryUI) {
        this.renderer = renderer;
        this.modalManager = modalManager;
        this.logSystem = logSystem;
        this.inventoryUI = inventoryUI;

        // 初始化子模块
        this.levelManager = new GameLevel(this.state, this.rngs, this.logSystem);
        this.monsterAI = new MobAi(this, this.state, this.logSystem);
        this.bossAI = new BossAI(this.state, this.logSystem);
        this.combatSystem = new GameCombat(
            this.state, this.logSystem, this.modalManager, this.inventoryUI
        );

        this.controls = new Controls(this);
    }

    public loadWorld(seedStr: string) {
        if (!Seed.isValid(seedStr)) {
            throw new Error('Invalid Seed');
        }

        this.currentSeed = seedStr;

        const seed = new Seed(seedStr);
        this.rngs = new GameRng(seed);

        this.state.reset();
        this.levelManager.rngs = this.rngs;

        this.logSystem.clear();
        this.levelManager.loadLevel(1);

        this.render();
    }

    public movePlayer(dr: number, dc: number) {
        if (this.cannotAct()) return;

        const nr = this.state.player.row + dr;
        const nc = this.state.player.col + dc;

        if (!this.isValidMove(nr, nc)) return;

        // 检查怪物
        const monsterAtTarget = this.state.monsters.find(
            m => m.row === nr && m.col === nc
        );
        if (monsterAtTarget) {
            this.combatSystem.handleCombat(monsterAtTarget);
            this.render();
            return;
        }

        this.state.stats.steps++;
        this.state.currentItemCell = null;
        this.state.player.setPos(nr, nc);

        // 处理格子内容
        this.handleCellContent(nr, nc);
        this.updateAndRender();

        // 怪物移动
        if (!this.state.waitingForEvent && !this.state.gameWin && !this.state.gameOver) {
            this.moveMonsters();
        }
    }

    /**
     * 移动所有怪物
     */
    private moveMonsters() {
        const adjacentMonster = this.monsterAI.moveAllMobs();

        if (adjacentMonster && !this.state.inCombat &&
            !this.state.gameWin && !this.state.gameOver) {
            this.combatSystem.handleCombat(adjacentMonster);
        }

        this.render();
    }

    /**
     * 拾取物品
     */
    public pickupCurrentItem() {
        if (this.cannotAct()) return false;
        if (!this.state.currentItemCell) {
            this.logSystem.addItem('⏎ 没有物品可拾取');
            return false;
        }

        const {row, col, type} = this.state.currentItemCell;
        const item = Items.getItem(type);
        if (!item) {
            this.logSystem.addItem('未知物品, 无法拾取');
            return false;
        }

        const inventory = this.state.player.getInventory();
        if (inventory.isFull()) {
            this.logSystem.addItem('❌ 背包已满，无法拾取');
            return false;
        }

        const added = inventory.addItem(item);
        if (added) {
            // 从地图上移除物品
            this.state.maze.set(row, col, 1);
            this.state.stats.itemsCollected++;

            this.logSystem.addItem(`📦 拾取 ${item.displayName} 放入背包`);
            this.state.currentItemCell = null;

            // 更新UI
            this.inventoryUI.updateInventory(inventory);
            this.state.updateUI();
            this.render();
            return true;
        }

        return false;
    }

    /**
     * 使用血药
     */
    public usePotion() {
        if (this.cannotAct()) return false;

        const used = this.state.player.usePotion();
        if (used === 1) {
            this.logSystem.addItem('🧴 使用血药，生命+1');
            SoundSystem.play('potion');
            this.updateAndRender();
            return true;
        } else if (used === 0) {
            this.logSystem.addItem('❌ 背包中没有血药');
            return false;
        } else if (used === 2) {
            this.logSystem.addItem('❌ 血量已满');
            return false;
        }
    }

    /**
     * 使用剑
     */
    public useSword() {
        if (this.cannotAct()) return false;

        const used = this.state.player.useSword();
        if (used) {
            this.logSystem.addItem('🗡️ 使用剑，攻击+1');
            SoundSystem.play('sword');
            this.updateAndRender();
            return true;
        } else {
            this.logSystem.addItem('❌ 背包中没有剑');
            return false;
        }
    }

    /**
     * 使用盾
     */
    public useShield() {
        if (this.cannotAct()) return false;

        const used = this.state.player.useShield();
        if (used) {
            this.logSystem.addItem('🛡️ 使用盾，防御+1');
            SoundSystem.play('armor');
            this.updateAndRender();
            return true;
        } else {
            this.logSystem.addItem('❌ 背包中没有盾');
            return false;
        }
    }

    /**
     * 打开丢弃物品界面
     */
    public openDropItemModal() {
        if (this.cannotAct()) return;

        const inventory = this.state.player.getInventory();
        this.modalManager.showDropItemModal(inventory, index => {
            const inventory = this.state.player.getInventory()
            const dropped = inventory.removeIndex(index);
            if (dropped) {
                this.logSystem.addItem(
                    `🗑️ 丢弃 ${dropped.displayName}`
                );
                this.inventoryUI.updateInventory(this.state.player.getInventory());
                this.render();
            }
        });
    }

    /**
     * 尝试下楼
     */
    public tryGoDown() {
        if (this.state.currentLevel === GameState.TOTAL_LEVELS) {
            this.logSystem.addStairs("⚠️ 最后一层，无法下楼！必须击败Boss！");
            return;
        }

        if (this.state.monsters.some(m => m.type === 'boss')) {
            this.logSystem.addStairs("⚠️ Boss还在，无法下楼！");
            return;
        }

        this.modalManager.showConfirmModal(
            `确定要前往第 ${this.state.currentLevel + 1} 层吗？`,
            (confirmed: boolean) => {
                if (confirmed) {
                    const success = this.levelManager.nextLevel();
                    if (success) this.updateAndRender();
                    return
                }
                this.logSystem.addStairs("🚫 取消下楼");
            }
        );
    }

    /**
     * 重置玩家位置
     */
    public resetPlayer() {
        if (this.state.gameOver || this.state.gameWin) {
            this.loadWorld(this.currentSeed);
            return
        }
        this.state.player.reset();
        this.logSystem.addStairs("🔄 重置到起点");
        this.inventoryUI.updateInventory(this.state.player.getInventory());
        this.render();
    }

    public cannotAct() {
        return this.state.gameWin || this.state.gameOver ||
            this.state.waitingForEvent || this.state.inCombat;
    }

    private isValidMove(row: number, col: number) {
        if (row < 0 || row >= this.state.size ||
            col < 0 || col >= this.state.size) return false;
        return this.state.maze.get(row, col) !== 0;
    }

    /**
     * 处理格子内容
     */
    private handleCellContent(row: number, col: number) {
        const cell = this.state.maze.get(row, col);
        if (cell >= 0x10 && cell <= 0x20) {
            // 物品 - 设置当前物品，等待回车拾取
            this.state.currentItemCell = {row, col, type: cell};
            const item = Items.getItem(cell);
            const name = item ? `${item.icon} ${item.displayName}` : `物品`;
            this.logSystem.addItem(`⏎ 按下回车键拾取 ${name}`);
            return;
        }
        if (cell === 6) {
            // 随机事件
            this.state.maze.set(row, col, 1);
            this.triggerRandomEvent();
            return;
        }
        if (cell === 7) {
            // 楼梯
            this.tryGoDown();
        }
    }

    private triggerRandomEvent() {
        this.state.waitingForEvent = true;

        EventSystem.triggerEvent(
            this.modalManager,
            this.state.player,
            this.state.monsters,
            this.state.stats,
            (msg: string, type: string) => this.logSystem.add(msg, type),
            action => {
                if (action === 'gameOver') {
                    this.state.gameOver = true;
                    const score = ScoreSystem.calculate(
                        this.state.player, this.state.stats, this.state.currentLevel
                    );
                    this.modalManager.showGameOverModal(score, false);
                }
                this.state.waitingForEvent = false;
                this.updateAndRender();
            }
        );
    }

    private updateAndRender() {
        this.state.updateUI();
        this.inventoryUI.updateInventory(this.state.player.getInventory());
        this.render();
    }

    private render() {
        this.renderer.render(
            this.state.maze,
            this.state.player,
            this.state.monsters,
            this.state.gameWin,
            this.state.gameOver
        )
    }
}
