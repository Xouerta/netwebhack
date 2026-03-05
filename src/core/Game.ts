/**
 * 游戏核心类（精简版）
 * 整合各个模块，提供对外接口
 */
import {GameState} from "./GameState.ts";
import type {Supplier} from "../types.ts";

export class Game {
    private state: GameState;
    private currentSeed: string;
    private rngs: Supplier<number> | null;

    public constructor() {
        // 状态管理
        this.state = new GameState();

        // 种子相关
        this.currentSeed = "BAG-5LVL-001";
        this.rngs = null;

        // 外部依赖
        this.renderer = null;
        this.modalManager = null;
        this.logSystem = null;
        this.controls = null;
        this.inventoryUI = null;

        // 子模块
        this.levelManager = null;
        this.monsterAI = null;
        this.bossAI = null;
        this.combatSystem = null;
    }

    /**
     * 初始化游戏
     */
    init(renderer, modalManager, logSystem, inventoryUI) {
        this.renderer = renderer;
        this.modalManager = modalManager;
        this.logSystem = logSystem;
        this.inventoryUI = inventoryUI;

        // 初始化子模块
        this.levelManager = new GameLevel(this.state, this.rngs, this.logSystem);
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
    loadWorld(seedStr) {
        this.currentSeed = Seed.normalize(seedStr);
        this.rngs = Seed.createRNGs(this.currentSeed);

        this.state.reset();

        // 更新子模块的rngs
        this.levelManager.rngs = this.rngs;

        this.logSystem.clear();
        this.levelManager.loadLevel(1);

        this._render();
    }

    /**
     * 移动玩家
     */
    movePlayer(dr, dc) {
        if (this._cannotAct()) return;

        let nr = this.state.player.row + dr;
        let nc = this.state.player.col + dc;

        if (!this._isValidMove(nr, nc)) return;

        // 检查怪物
        const monsterAtTarget = this.state.monsters.find(
            m => m.row === nr && m.col === nc
        );
        if (monsterAtTarget) {
            this.combatSystem.handleCombat(monsterAtTarget);
            this._render();
            return;
        }

        this.state.stats.steps++;
        this.state.currentItemCell = null;
        this.state.player.moveTo(nr, nc);

        // 处理格子内容
        this._handleCellContent(nr, nc);

        this._updateAndRender();

        // 怪物移动
        if (!this.state.waitingForEvent && !this.state.gameWin && !this.state.gameOver) {
            this._moveMonsters();
        }
    }

    /**
     * 移动所有怪物
     */
    _moveMonsters() {
        const adjacentMonster = this.monsterAI.moveAllMonsters();

        if (adjacentMonster && !this.state.inCombat &&
            !this.state.gameWin && !this.state.gameOver) {
            this.combatSystem.handleCombat(adjacentMonster);
        }

        this._render();
    }

    /**
     * 拾取物品
     */
    pickupCurrentItem() {
        if (this._cannotAct()) return false;
        if (!this.state.currentItemCell) {
            this.logSystem.addItem('⏎ 没有物品可拾取', 'item');
            return false;
        }

        const {row, col, type} = this.state.currentItemCell;
        const itemType = this.state.getItemTypeFromCell(type);

        if (this.state.player.isInventoryFull()) {
            this.logSystem.addItem('❌ 背包已满，无法拾取', 'item');
            return false;
        }

        const added = this.state.player.addToInventory(itemType);

        if (added) {
            // 从地图上移除物品
            this.state.maze[row][col] = 1;
            this.state.stats.itemsCollected++;
            this.logSystem.addItem(
                `📦 拾取 ${this.state.player.getItemDisplayName(itemType)} 放入背包`,
                'item'
            );
            this.state.currentItemCell = null;

            // 更新UI
            this.inventoryUI.updateInventory(this.state.player.getInventory());
            this.state.updateUI();
            this._render();
            return true;
        }

        return false;
    }

    /**
     * 使用血药
     */
    usePotion() {
        if (this._cannotAct()) return false;

        const used = this.state.player.usePotion();
        if (used) {
            this.logSystem.addItem('🧴 使用血药，生命+1', 'item');
            this._updateAndRender();
            return true;
        } else {
            this.logSystem.addItem('❌ 背包中没有血药', 'item');
            return false;
        }
    }

    /**
     * 使用剑
     */
    useSword() {
        if (this._cannotAct()) return false;

        const used = this.state.player.useSword();
        if (used) {
            this.logSystem.addItem('🗡️ 使用剑，攻击+1', 'item');
            this._updateAndRender();
            return true;
        } else {
            this.logSystem.addItem('❌ 背包中没有剑', 'item');
            return false;
        }
    }

    /**
     * 使用盾
     */
    useShield() {
        if (this._cannotAct()) return false;

        const used = this.state.player.useShield();
        if (used) {
            this.logSystem.addItem('🛡️ 使用盾，防御+1', 'item');
            this._updateAndRender();
            return true;
        } else {
            this.logSystem.addItem('❌ 背包中没有盾', 'item');
            return false;
        }
    }

    /**
     * 打开丢弃物品界面
     */
    openDropItemModal() {
        if (this._cannotAct()) return;

        const inventory = this.state.player.getInventory();
        this.modalManager.showDropItemModal(inventory, (index) => {
            const dropped = this.state.player.removeFromInventory(index);
            if (dropped) {
                this.logSystem.addItem(
                    `🗑️ 丢弃 ${this.state.player.getItemDisplayName(dropped.type)}`,
                    'item'
                );
                this.inventoryUI.updateInventory(this.state.player.getInventory());
                this._render();
            }
        });
    }

    /**
     * 尝试下楼
     */
    tryGoDown() {
        if (this.state.currentLevel === this.state.TOTAL_LEVELS) {
            this.logSystem.addStairs("⚠️ 最后一层，无法下楼！必须击败Boss！");
            return;
        }

        if (this.state.monsters.some(m => m.type === 'boss')) {
            this.logSystem.addStairs("⚠️ Boss还在，无法下楼！");
            return;
        }

        this.modalManager.showConfirmModal(
            `确定要前往第 ${this.state.currentLevel + 1} 层吗？`,
            (confirmed) => {
                if (confirmed) {
                    const success = this.levelManager.nextLevel({
                        addLog: (msg) => this.logSystem.addStairs(msg)
                    });
                    if (success) {
                        this._updateAndRender();
                    }
                } else {
                    this.logSystem.addStairs("🚫 取消下楼");
                }
            }
        );
    }

    /**
     * 重置玩家位置
     */
    resetPlayer() {
        if (this.state.gameOver || this.state.gameWin) {
            this.loadWorld(this.currentSeed);
        } else {
            this.state.player.reset();
            this.logSystem.addStairs("🔄 重置到起点");
            this.inventoryUI.updateInventory(this.state.player.getInventory());
            this._render();
        }
    }

    // ========== 私有辅助方法 ==========

    _cannotAct() {
        return this.state.gameWin || this.state.gameOver ||
            this.state.waitingForEvent || this.state.inCombat;
    }

    _isValidMove(row, col) {
        if (row < 0 || row >= this.state.SIZE ||
            col < 0 || col >= this.state.SIZE) return false;
        return this.state.maze[row][col] !== 0;
    }

    /**
     * 处理格子内容
     */
    _handleCellContent(row, col) {
        const cell = this.state.maze[row][col];

        if (cell >= 2 && cell <= 4) {
            // 物品 - 设置当前物品，等待回车拾取
            this.state.currentItemCell = {row, col, type: cell};
            this.logSystem.addItem(
                `⏎ 按下回车键拾取 ${this.state.getItemTypeName(cell)}`,
                'item'
            );
            console.log('Item found at', row, col, 'type:', cell); // 调试用
        } else if (cell === 6) {
            // 随机事件
            this.state.maze[row][col] = 1;
            this._triggerRandomEvent();
        } else if (cell === 7) {
            // 楼梯
            this.tryGoDown();
        }
    }

    _triggerRandomEvent() {
        this.state.waitingForEvent = true;

        EventSystem.triggerEvent(
            this.modalManager,
            this.state.player,
            this.state.monsters,
            this.state.stats,
            (msg, type) => this.logSystem.add(msg, type),
            (action) => {
                if (action === 'gameOver') {
                    this.state.gameOver = true;
                    const score = ScoreSystem.calculate(
                        this.state.player, this.state.stats, this.state.currentLevel
                    );
                    this.modalManager.showGameOverModal(score, false);
                }
                this.state.waitingForEvent = false;
                this._updateAndRender();
            }
        );
    }

    _updateAndRender() {
        this.state.updateUI();
        this.inventoryUI.updateInventory(this.state.player.getInventory());
        this._render();
    }

    _render() {
        this.renderer.render(
            this.state.maze,
            this.state.player,
            this.state.monsters,
            this.state.stairsPos,
            this.state.gameWin,
            this.state.gameOver
        );
    }
}
