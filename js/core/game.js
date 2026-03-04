/**
 * 游戏核心类
 * 管理游戏状态、层数、怪物列表和主要游戏逻辑
 */

class Game {
    constructor() {
        this.SIZE = 40;
        this.TOTAL_LEVELS = 5;
        this.MAX_MONSTERS = 15;
        this.MIN_BIG_MONSTER_DISTANCE = 10; // 大怪最小距离

        this.currentLevel = 1;
        this.maze = [];
        this.player = new Player();
        this.monsters = [];
        this.stairsPos = { row: 38, col: 38 };

        this.currentSeed = "BAG-5LVL-001";
        this.rngs = null;

        this.gameWin = false;
        this.gameOver = false;
        this.waitingForEvent = false;
        this.pendingStairs = false;

        // 战斗冷却标记，防止同一回合内多次战斗
        this.inCombat = false;

        // 当前站立的物品格子（用于回车拾取）
        this.currentItemCell = null;

        this.stats = {
            smallKills: 0,
            bigKills: 0,
            bossKilled: false,
            itemsCollected: 0,
            eventsTriggered: 0,
            steps: 0,
            startTime: Date.now()
        };

        // 外部依赖，会在初始化时注入
        this.renderer = null;
        this.modalManager = null;
        this.logSystem = null;
        this.controls = null;
        this.inventoryUI = null;
    }

    /**
     * 初始化游戏（注入依赖）
     */
    init(renderer, modalManager, logSystem, inventoryUI) {
        this.renderer = renderer;
        this.modalManager = modalManager;
        this.logSystem = logSystem;
        this.inventoryUI = inventoryUI;
        this.controls = new Controls(this);
    }

    /**
     * 加载世界（基于种子）
     */
    loadWorld(seedStr) {
        this.currentSeed = Seed.normalize(seedStr);
        this.rngs = Seed.createRNGs(this.currentSeed);

        this.currentLevel = 1;
        this.player = new Player();

        this.stats = {
            smallKills: 0,
            bigKills: 0,
            bossKilled: false,
            itemsCollected: 0,
            eventsTriggered: 0,
            steps: 0,
            startTime: Date.now()
        };

        this.gameWin = false;
        this.gameOver = false;
        this.waitingForEvent = false;
        this.inCombat = false;
        this.currentItemCell = null;

        this.logSystem.clear();
        this._loadLevel(1);
    }

    /**
     * 加载指定层
     */
    _loadLevel(level) {
        // 生成迷宫
        this.maze = MazeGenerator.generateLevel(level, this.rngs.maze);

        // 放置物品和事件
        this.maze = MazeGenerator.placeItemsAndEvents(this.maze, level, this.rngs.item);

        // 放置楼梯
        const result = MazeGenerator.placeStairs(this.maze, this.rngs.item);
        this.maze = result.grid;
        this.stairsPos = result.stairsPos;

        // 生成怪物（优化排布 - 修复版）
        this.monsters = this._spawnMonsters(level);

        // 重置玩家位置
        this.player.row = 1;
        this.player.col = 1;
        this.maze[1][1] = 1;

        this._updateUI();
        if (this.inventoryUI) {
            this.inventoryUI.updateInventory(this.player.getInventory());
        }
        this.renderer.render(this.maze, this.player, this.monsters, this.stairsPos, this.gameWin, this.gameOver);
        this.logSystem.addStairs(`🏰 进入第 ${level} 层`);
    }

    /**
     * 生成怪物（优化排布 - 修复版）
     * 修复：怪物不再全部集中于右下角，而是随机分布但保证大怪在远处
     */
    _spawnMonsters(level) {
        if (level === this.TOTAL_LEVELS) {
            // 第5层只生成Boss
            return this._spawnBoss(level);
        }

        let mobs = [];

        // 获取所有可用的格子
        let allFreeCells = this._getFreeCellsForMonsters();

        if (allFreeCells.length === 0) return [];

        // 计算怪物总数
        const monsterCount = Math.min(
            5 + level * 2 + Math.floor(this.rngs.monster() * 4),
            this.MAX_MONSTERS,
            allFreeCells.length
        );

        // 计算大怪数量
        const bigMonsterCount = Math.floor(monsterCount * (0.2 + level * 0.1));

        // 分离近处和远处的格子
        const nearCells = [];
        const farCells = [];

        for (let cell of allFreeCells) {
            const [r, c] = cell;
            const dist = this._manhattanDistance(r, c, 1, 1);
            if (dist >= this.MIN_BIG_MONSTER_DISTANCE) {
                farCells.push(cell);
            } else {
                nearCells.push(cell);
            }
        }

        // 随机打乱远近格子数组
        const shuffledNear = this._shuffleArray(nearCells, this.rngs.monster);
        const shuffledFar = this._shuffleArray(farCells, this.rngs.monster);

        // 先放置大怪（从远处格子中随机选择）
        let bigMonstersPlaced = 0;
        const bigMonsterIndices = this._selectRandomIndices(shuffledFar.length, bigMonsterCount, this.rngs.monster);

        for (let i = 0; i < bigMonsterIndices.length; i++) {
            const idx = bigMonsterIndices[i];
            const [r, c] = shuffledFar[idx];
            const monster = MonsterGenerator.spawn(level, 'big', r, c, `big_${i}`, this.rngs.monster);
            mobs.push(monster);
            bigMonstersPlaced++;
        }

        // 计算剩余小怪数量
        const smallMonsterCount = monsterCount - bigMonstersPlaced;

        // 合并剩余可用格子（远处未使用的 + 所有近处）
        const usedFarIndices = new Set(bigMonsterIndices);
        const remainingCells = [];

        // 添加未使用的远处格子
        for (let i = 0; i < shuffledFar.length; i++) {
            if (!usedFarIndices.has(i)) {
                remainingCells.push(shuffledFar[i]);
            }
        }

        // 添加所有近处格子
        remainingCells.push(...shuffledNear);

        // 随机打乱剩余格子
        const shuffledRemaining = this._shuffleArray(remainingCells, this.rngs.monster);

        // 放置小怪
        for (let i = 0; i < smallMonsterCount && i < shuffledRemaining.length; i++) {
            const [r, c] = shuffledRemaining[i];
            const monster = MonsterGenerator.spawn(level, 'small', r, c, `small_${i}`, this.rngs.monster);
            mobs.push(monster);
        }

        // 记录怪物分布日志（调试用）
        this.logSystem.add(`👾 生成怪物: ${mobs.length}只 (大怪:${bigMonstersPlaced}, 小怪:${mobs.length - bigMonstersPlaced})`, 'ai');

        return mobs;
    }

    /**
     * 随机打乱数组（使用指定的随机数生成器）
     */
    _shuffleArray(array, rng) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    /**
     * 随机选择指定数量的不重复索引
     */
    _selectRandomIndices(max, count, rng) {
        if (count >= max) {
            // 如果需要数量超过最大值，返回所有索引
            return Array.from({ length: max }, (_, i) => i);
        }

        const indices = [];
        const selected = new Set();

        while (indices.length < count && indices.length < max) {
            const idx = Math.floor(rng() * max);
            if (!selected.has(idx)) {
                selected.add(idx);
                indices.push(idx);
            }
        }

        return indices;
    }

    /**
     * 生成Boss（第5层）- 修复版
     */
    _spawnBoss(level) {
        let freeCells = this._getFreeCellsForMonsters();

        if (freeCells.length === 0) return [];

        // 找出所有距离足够远的格子
        const farCells = freeCells.filter(([r, c]) =>
            this._manhattanDistance(r, c, 1, 1) >= this.MIN_BIG_MONSTER_DISTANCE
        );

        // 如果有远处格子，从中随机选择一个；否则从所有格子中随机选择
        const candidates = farCells.length > 0 ? farCells : freeCells;
        const randomIndex = Math.floor(this.rngs.monster() * candidates.length);
        const [r, c] = candidates[randomIndex];

        const boss = MonsterGenerator.spawn(level, 'boss', r, c, 'boss', this.rngs.monster);
        this.logSystem.add(`👑 Boss生成在 (${r}, ${c})`, 'ai');
        return [boss];
    }

    /**
     * 计算曼哈顿距离
     */
    _manhattanDistance(r1, c1, r2, c2) {
        return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    }

    /**
     * 获取可用于生成怪物的空闲格子
     */
    _getFreeCellsForMonsters() {
        let free = [];
        for (let r = 1; r < this.SIZE - 1; r++) {
            for (let c = 1; c < this.SIZE - 1; c++) {
                if (this.maze[r][c] === 1 &&
                    !(r === 1 && c === 1) &&
                    !(r === this.stairsPos.row && c === this.stairsPos.col)) {
                    free.push([r, c]);
                }
            }
        }
        return free;
    }

    /**
     * 移动到下一层
     */
    nextLevel() {
        if (this.currentLevel < this.TOTAL_LEVELS) {
            this.currentLevel++;
            this._loadLevel(this.currentLevel);
        } else {
            this.gameWin = true;
            const score = ScoreSystem.calculate(this.player, this.stats, this.currentLevel);
            this.modalManager.showGameOverModal(score, true);
        }
    }

    /**
     * 尝试下楼（需要确认）
     */
    tryGoDown() {
        if (this.currentLevel === this.TOTAL_LEVELS) {
            this.logSystem.addStairs("⚠️ 最后一层，无法下楼！必须击败Boss！");
            return;
        }

        if (this.monsters.some(m => m.type === 'boss')) {
            this.logSystem.addStairs("⚠️ Boss还在，无法下楼！");
            return;
        }

        this.modalManager.showConfirmModal(
            `确定要前往第 ${this.currentLevel + 1} 层吗？`,
            (confirmed) => {
                if (confirmed) {
                    this.nextLevel();
                } else {
                    this.logSystem.addStairs("🚫 取消下楼");
                }
            }
        );
    }

    /**
     * 移动玩家
     */
    movePlayer(dr, dc) {
        if (this.gameWin || this.gameOver || this.waitingForEvent || this.inCombat) return;

        let nr = this.player.row + dr;
        let nc = this.player.col + dc;

        if (nr < 0 || nr >= this.SIZE || nc < 0 || nc >= this.SIZE) return;
        if (this.maze[nr][nc] === 0) return;

        this.stats.steps++;

        // 检查怪物
        const monsterIdx = this.monsters.findIndex(m => m.row === nr && m.col === nc);
        if (monsterIdx !== -1) {
            this._handleCombat(monsterIdx);
            return;
        }

        // 离开当前格子时，清除当前物品标记
        this.currentItemCell = null;

        // 移动玩家
        this.player.moveTo(nr, nc);

        // 检查新位置是否有物品
        const cell = this.maze[nr][nc];
        if (cell >= 2 && cell <= 4) {
            // 记录当前物品，等待回车拾取
            this.currentItemCell = { row: nr, col: nc, type: cell };
            this.logSystem.addItem(`⏎ 按下回车键拾取 ${this._getItemTypeName(cell)}`);
        } else {
            // 处理事件和楼梯
            this._handleCellContent(nr, nc);
        }

        this._updateUI();
        if (this.inventoryUI) {
            this.inventoryUI.updateInventory(this.player.getInventory());
        }
        this.renderer.render(this.maze, this.player, this.monsters, this.stairsPos, this.gameWin, this.gameOver);

        // 怪物移动
        if (!this.waitingForEvent && !this.gameWin && !this.gameOver && !this.inCombat) {
            this._moveMonsters();
        }
    }

    /**
     * 拾取当前物品（回车键调用）
     */
    pickupCurrentItem() {
        if (!this.currentItemCell) return false;

        const { row, col, type } = this.currentItemCell;
        const itemType = this._getItemTypeFromCell(type);

        // 检查背包空间
        if (this.player.isInventoryFull()) {
            this.logSystem.addItem('❌ 背包已满，无法拾取', 'item');
            return false;
        }

        // 添加到背包
        const added = this.player.addToInventory(itemType);

        if (added) {
            // 从地图上移除物品
            this.maze[row][col] = 1;
            this.stats.itemsCollected++;
            this.logSystem.addItem(`📦 拾取 ${this.player.getItemDisplayName(itemType)} 放入背包`, 'item');
            this.currentItemCell = null;

            if (this.inventoryUI) {
                this.inventoryUI.updateInventory(this.player.getInventory());
            }
            return true;
        }

        return false;
    }

    /**
     * 从格子类型获取物品类型
     */
    _getItemTypeFromCell(cell) {
        const map = {
            2: 'sword',
            3: 'shield',
            4: 'potion'
        };
        return map[cell];
    }

    /**
     * 获取物品类型名称
     */
    _getItemTypeName(cell) {
        const map = {
            2: '🗡️ 剑',
            3: '🛡️ 盾',
            4: '🧴 血药'
        };
        return map[cell];
    }

    /**
     * 使用血药
     */
    usePotion() {
        if (this.gameWin || this.gameOver || this.waitingForEvent) return false;

        const used = this.player.usePotion();
        if (used) {
            this.logSystem.addItem('🧴 使用血药，生命+1', 'item');
            this._updateUI();
            if (this.inventoryUI) {
                this.inventoryUI.updateInventory(this.player.getInventory());
            }
            this.renderer.render(this.maze, this.player, this.monsters, this.stairsPos, this.gameWin, this.gameOver);
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
        if (this.gameWin || this.gameOver || this.waitingForEvent) return false;

        const used = this.player.useSword();
        if (used) {
            this.logSystem.addItem('🗡️ 使用剑，攻击+1', 'item');
            this._updateUI();
            if (this.inventoryUI) {
                this.inventoryUI.updateInventory(this.player.getInventory());
            }
            this.renderer.render(this.maze, this.player, this.monsters, this.stairsPos, this.gameWin, this.gameOver);
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
        if (this.gameWin || this.gameOver || this.waitingForEvent) return false;

        const used = this.player.useShield();
        if (used) {
            this.logSystem.addItem('🛡️ 使用盾，防御+1', 'item');
            this._updateUI();
            if (this.inventoryUI) {
                this.inventoryUI.updateInventory(this.player.getInventory());
            }
            this.renderer.render(this.maze, this.player, this.monsters, this.stairsPos, this.gameWin, this.gameOver);
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
        if (this.gameWin || this.gameOver || this.waitingForEvent) return;

        const inventory = this.player.getInventory();
        this.modalManager.showDropItemModal(inventory, (index) => {
            const dropped = this.player.removeFromInventory(index);
            if (dropped) {
                this.logSystem.addItem(`🗑️ 丢弃 ${this.player.getItemDisplayName(dropped.type)}`, 'item');
                if (this.inventoryUI) {
                    this.inventoryUI.updateInventory(this.player.getInventory());
                }
                this.renderer.render(this.maze, this.player, this.monsters, this.stairsPos, this.gameWin, this.gameOver);
            }
        });
    }

    /**
     * 处理战斗
     */
    _handleCombat(monsterIdx) {
        // 设置战斗标记，防止重复进入战斗
        if (this.inCombat) return;
        this.inCombat = true;

        const monster = this.monsters[monsterIdx];

        const result = CombatSystem.fight(
            this.player,
            monster,
            this.monsters,
            monsterIdx,
            this.stats,
            {
                addLog: (msg, type) => this.logSystem.add(msg, type)
            }
        );

        if (result.bossDefeated) {
            this.stats.bossKilled = true;
            this.gameWin = true;
            const score = ScoreSystem.calculate(this.player, this.stats, this.currentLevel);
            this.modalManager.showGameOverModal(score, true);
        }

        if (result.playerDefeated) {
            this.gameOver = true;
            const score = ScoreSystem.calculate(this.player, this.stats, this.currentLevel);
            this.modalManager.showGameOverModal(score, false);
        }

        // 战斗结束后清除战斗标记
        this.inCombat = false;

        this._updateUI();
        if (this.inventoryUI) {
            this.inventoryUI.updateInventory(this.player.getInventory());
        }
        this.renderer.render(this.maze, this.player, this.monsters, this.stairsPos, this.gameWin, this.gameOver);
    }

    /**
     * 处理格子内容（道具、事件、楼梯）
     */
    _handleCellContent(row, col) {
        const cell = this.maze[row][col];

        if (cell === 6) {
            // 随机事件
            this.maze[row][col] = 1;
            this._triggerRandomEvent();

        } else if (cell === 7) {
            // 楼梯
            this.tryGoDown();
        }
    }

    /**
     * 触发随机事件
     */
    _triggerRandomEvent() {
        this.waitingForEvent = true;

        EventSystem.triggerEvent(
            this.modalManager,
            this.player,
            this.monsters,
            this.stats,
            (msg, type) => this.logSystem.add(msg, type),
            (action) => {
                if (action === 'gameOver') {
                    this.gameOver = true;
                    const score = ScoreSystem.calculate(this.player, this.stats, this.currentLevel);
                    this.modalManager.showGameOverModal(score, false);
                }
                this.waitingForEvent = false;
                this._updateUI();
                if (this.inventoryUI) {
                    this.inventoryUI.updateInventory(this.player.getInventory());
                }
                this.renderer.render(this.maze, this.player, this.monsters, this.stairsPos, this.gameWin, this.gameOver);
            }
        );
    }

    /**
     * 移动所有怪物（AI）
     */
    _moveMonsters() {
        if (this.gameWin || this.gameOver || this.waitingForEvent || this.inCombat) return;

        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const playerPower = this.player.getPower();
        const newMonsters = [];

        // 先记录玩家当前位置，防止怪物移动过程中玩家位置变化
        const playerRow = this.player.row;
        const playerCol = this.player.col;

        for (let m of this.monsters) {
            if (m.type === 'boss') {
                // Boss始终追逐玩家
                this._moveBoss(m, dirs, playerRow, playerCol, newMonsters);
            } else {
                // 普通怪物根据实力决定行为
                this._moveNormalMonster(m, dirs, playerPower, playerRow, playerCol, newMonsters);
            }
        }

        this.monsters = newMonsters;

        // 检查怪物是否撞上玩家（避免同一回合内多次战斗）
        const monsterAtPlayer = this.monsters.find(m => m.row === this.player.row && m.col === this.player.col);
        if (monsterAtPlayer && !this.inCombat && !this.gameWin && !this.gameOver) {
            const monsterIdx = this.monsters.findIndex(m => m.row === this.player.row && m.col === this.player.col);
            if (monsterIdx !== -1) {
                this._handleCombat(monsterIdx);
            }
        }

        this.renderer.render(this.maze, this.player, this.monsters, this.stairsPos, this.gameWin, this.gameOver);
    }

    /**
     * 移动Boss（始终追逐）
     */
    _moveBoss(monster, dirs, playerRow, playerCol, newMonsters) {
        let bestDir = null;
        let bestDist = 999;

        for (let [dr, dc] of dirs) {
            let nr = monster.row + dr;
            let nc = monster.col + dc;
            if (this._canMonsterMoveTo(nr, nc, monster, newMonsters)) {
                let dist = Math.abs(nr - playerRow) + Math.abs(nc - playerCol);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = [dr, dc];
                }
            }
        }

        if (bestDir) {
            monster.row += bestDir[0];
            monster.col += bestDir[1];
            this.logSystem.addAI('👑 Boss向你靠近');
        }

        newMonsters.push(monster);
    }

    /**
     * 移动普通怪物（根据实力对比）
     */
    _moveNormalMonster(monster, dirs, playerPower, playerRow, playerCol, newMonsters) {
        const dist = Math.abs(monster.row - playerRow) + Math.abs(monster.col - playerCol);
        const monsterPower = monster.getPower();

        if (dist <= 2) {
            // 两格内，根据实力决定行为
            if (monsterPower > playerPower) {
                // 怪物更强，追逐
                this._chasePlayer(monster, dirs, playerRow, playerCol, newMonsters);
            } else if (monsterPower < playerPower) {
                // 玩家更强，逃跑
                this._fleeFromPlayer(monster, dirs, playerRow, playerCol, newMonsters);
            } else {
                // 势均力敌，随机移动
                this._randomMove(monster, dirs, newMonsters);
            }
        } else {
            // 两格外，随机移动
            this._randomMove(monster, dirs, newMonsters);
        }
    }

    /**
     * 追逐玩家
     */
    _chasePlayer(monster, dirs, playerRow, playerCol, newMonsters) {
        let bestDir = null;
        let bestDist = 999;

        for (let [dr, dc] of dirs) {
            let nr = monster.row + dr;
            let nc = monster.col + dc;
            if (this._canMonsterMoveTo(nr, nc, monster, newMonsters)) {
                let dist = Math.abs(nr - playerRow) + Math.abs(nc - playerCol);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = [dr, dc];
                }
            }
        }

        if (bestDir) {
            monster.row += bestDir[0];
            monster.col += bestDir[1];
            this.logSystem.addAI(`👾 ${monster.getName()}觉得比你强，追过来了`);
        }

        newMonsters.push(monster);
    }

    /**
     * 逃离玩家
     */
    _fleeFromPlayer(monster, dirs, playerRow, playerCol, newMonsters) {
        let bestDir = null;
        let bestDist = -1;

        for (let [dr, dc] of dirs) {
            let nr = monster.row + dr;
            let nc = monster.col + dc;
            if (this._canMonsterMoveTo(nr, nc, monster, newMonsters)) {
                let dist = Math.abs(nr - playerRow) + Math.abs(nc - playerCol);
                if (dist > bestDist) {
                    bestDist = dist;
                    bestDir = [dr, dc];
                }
            }
        }

        if (bestDir) {
            monster.row += bestDir[0];
            monster.col += bestDir[1];
            this.logSystem.addAI(`🏃 ${monster.getName()}觉得打不过你，逃跑了`);
        }

        newMonsters.push(monster);
    }

    /**
     * 随机移动
     */
    _randomMove(monster, dirs, newMonsters) {
        let moved = false;
        let tries = 0;

        while (!moved && tries < 8) {
            let [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
            let nr = monster.row + dr;
            let nc = monster.col + dc;
            tries++;

            if (this._canMonsterMoveTo(nr, nc, monster, newMonsters)) {
                monster.row = nr;
                monster.col = nc;
                moved = true;
            }
        }

        newMonsters.push(monster);
    }

    /**
     * 检查怪物是否可以移动到指定位置
     * @param {number} row - 目标行
     * @param {number} col - 目标列
     * @param {Object} currentMonster - 当前移动的怪物
     * @param {Array} newMonsters - 已经移动过的怪物列表（用于检查重叠）
     */
    _canMonsterMoveTo(row, col, currentMonster, newMonsters = []) {
        if (row < 1 || row >= this.SIZE - 1 || col < 1 || col >= this.SIZE - 1) return false;
        if (this.maze[row][col] !== 1) return false;

        // 检查是否与已经移动过的怪物重叠
        const occupiedByNew = newMonsters.some(m => m.row === row && m.col === col);
        if (occupiedByNew) return false;

        // 检查是否与尚未移动的怪物重叠（排除自己）
        const occupiedByOld = this.monsters.some(m => m !== currentMonster && m.row === row && m.col === col);
        if (occupiedByOld) return false;

        // 检查是否与玩家重叠（允许重叠，但会在后续触发战斗）
        // 这里允许重叠，因为战斗逻辑会在移动后统一处理

        // 不能走到楼梯
        if (row === this.stairsPos.row && col === this.stairsPos.col) return false;

        return true;
    }

    /**
     * 重置玩家位置
     */
    resetPlayer() {
        if (this.gameOver || this.gameWin) {
            this.loadWorld(this.currentSeed);
        } else {
            this.player.reset();
            this.logSystem.addStairs("🔄 重置到起点");
            if (this.inventoryUI) {
                this.inventoryUI.updateInventory(this.player.getInventory());
            }
            this.renderer.render(this.maze, this.player, this.monsters, this.stairsPos, this.gameWin, this.gameOver);
        }
    }

    /**
     * 更新UI显示
     */
    _updateUI() {
        document.getElementById('hpDisplay').innerText = this.player.hp + '/' + this.player.maxHp;
        document.getElementById('atkDisplay').innerText = this.player.atk;
        document.getElementById('defDisplay').innerText = this.player.def;
        document.getElementById('monsterCount').innerText = this.monsters.length;
        document.getElementById('levelDisplay').innerText = this.currentLevel + '/' + this.TOTAL_LEVELS;
    }
}
