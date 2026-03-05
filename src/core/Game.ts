/**
 * 游戏核心类（精简版）
 * 整合各个模块，提供对外接口
 */
import {GameState} from "./GameState.ts";
import type {Supplier} from "../types.ts";
import type {Renderer} from "../ui/Renderer.ts";
import type {ModalManager} from "../ui/Modal.ts";
import type {LogSystem} from "../systems/LogSystem.ts";
import {GameLevel} from "./GameLevel.ts";
import {MonsterAI} from "../ai/monsterAI.ts";
import {BossAI} from "../ai/bossAI.ts";
import {GameCombat} from "./GameCombat.ts";
import {Seed} from "./Seed.ts";
import {EventSystem} from "../systems/EventSystem.ts";
import {Controls} from "../ui/Controls.ts";
import type {InventoryUI} from "../ui/InventoryUi.ts";
import {ScoreSystem} from "../systems/score/ScoreSystem.ts";
import {SoundSystem} from "../systems/SoundSystem.ts";

export class Game {
    public readonly state: GameState;
    private currentSeed: string;
    private rngs: Record<string, Supplier<number>> | null;
    private renderer!: Renderer;
    private modalManager!: ModalManager;
    private logSystem!: LogSystem;
    public controls!: Controls;
    private inventoryUI!: InventoryUI;
    private levelManager!: GameLevel;
    private monsterAI!: MonsterAI;
    public bossAI!: BossAI;
    private combatSystem!: GameCombat;

    public constructor() {
        // 状态管理
        this.state = new GameState();

        // 种子相关
        this.currentSeed = "BAG-5LVL-001";
        this.rngs = null;
    }

    /**
     * 初始化游戏
     */
    public init(renderer: Renderer, modalManager: ModalManager, logSystem: LogSystem, inventoryUI: InventoryUI) {
        this.renderer = renderer;
        this.modalManager = modalManager;
        this.logSystem = logSystem;
        this.inventoryUI = inventoryUI;

        // 初始化子模块
        this.levelManager = new GameLevel(this.state, this.rngs!, this.logSystem);
        this.monsterAI = new MonsterAI(this.state, this.logSystem);
        this.bossAI = new BossAI(this.state, this.logSystem);
        this.combatSystem = new GameCombat(
            this.state, this.logSystem, this.modalManager, this.inventoryUI
        );

        this.controls = new Controls(this);
    }

    /**
     * 加载世界
     */
    public loadWorld(seedStr: string) {
        this.currentSeed = Seed.normalize(seedStr);
        this.rngs = Seed.createRNGs(this.currentSeed);

        this.state.reset();

        // 更新子模块的rngs
        this.levelManager.rngs = this.rngs;

        this.logSystem.clear();
        this.levelManager.loadLevel(1);

        this.render();
    }

    /**
     * 移动玩家
     */
    public movePlayer(dr: number, dc: number) {
        if (this.cannotAct()) return;

        const nr = this.state.player.pos.row + dr;
        const nc = this.state.player.pos.col + dc;

        if (!this.isValidMove(nr, nc)) return;

        // 检查怪物
        const monsterAtTarget = this.state.monsters.find(
            m => m.pos.row === nr && m.pos.col === nc
        );
        if (monsterAtTarget) {
            this.combatSystem.handleCombat(monsterAtTarget);
            this.render();
            return;
        }

        this.state.stats.steps++;
        this.state.currentItemCell = null;
        this.state.player.moveTo(nr, nc);

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
        const adjacentMonster = this.monsterAI.moveAllMonsters();

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
        const itemType = this.state.getItemTypeFromCell(type);

        if (this.state.player.isInventoryFull()) {
            this.logSystem.addItem('❌ 背包已满，无法拾取');
            return false;
        }

        // @ts-ignore
        const added = this.state.player.addToInventory(itemType);

        if (added) {
            // 从地图上移除物品
            this.state.maze.set(row, col, 1);
            this.state.stats.itemsCollected++;

            this.logSystem.addItem(
                // @ts-ignore
                `📦 拾取 ${this.state.player.getItemDisplayName(itemType)} 放入背包`
            );
            this.state.currentItemCell = null;

            // 更新UI
            this.inventoryUI.updateInventory(this.state.player.getInventory());
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
        if (used) {
            this.logSystem.addItem('🧴 使用血药，生命+1');
            SoundSystem.play('/sound/bottle_empty.ogg');
            this.updateAndRender();
            return true;
        } else {
            this.logSystem.addItem('❌ 背包中没有血药');
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
        this.modalManager.showDropItemModal(inventory, (index: number) => {
            const dropped = this.state.player.removeFromInventory(index);
            if (dropped) {
                this.logSystem.addItem(
                    `🗑️ 丢弃 ${this.state.player.getItemDisplayName(dropped.type)}`
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

        if (cell >= 2 && cell <= 4) {
            // 物品 - 设置当前物品，等待回车拾取
            this.state.currentItemCell = {row, col, type: cell};
            this.logSystem.addItem(
                `⏎ 按下回车键拾取 ${this.state.getItemTypeName(cell)}`
            );
        } else if (cell === 6) {
            // 随机事件
            this.state.maze.set(row, col, 1);
            this.triggerRandomEvent();
        } else if (cell === 7) {
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
            (action: string) => {
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
