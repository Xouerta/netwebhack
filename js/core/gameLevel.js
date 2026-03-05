/**
 * 关卡管理模块
 * 负责加载新关卡、生成怪物
 */

class GameLevel {
    constructor(gameState, rngs, logSystem) {
        this.state = gameState;
        this.rngs = rngs;
        this.logSystem = logSystem;
    }

    /**
     * 加载指定层
     */
    loadLevel(level) {
        // 生成迷宫
        this.state.maze = MazeGenerator.generateLevel(level, this.rngs.maze);

        // 放置物品和事件
        this.state.maze = MazeGenerator.placeItemsAndEvents(this.state.maze, level, this.rngs.item);

        // 放置楼梯
        const result = MazeGenerator.placeStairs(this.state.maze, this.rngs.item);
        this.state.maze = result.grid;
        this.state.stairsPos = result.stairsPos;

        // 生成怪物
        this.state.monsters = this._spawnMonsters(level);

        // 重置玩家位置
        this.state.player.row = 1;
        this.state.player.col = 1;
        this.state.maze[1][1] = 1;

        this.logSystem.addStairs(`🏰 进入第 ${level} 层`);
    }

    /**
     * 生成怪物
     */
    _spawnMonsters(level) {
        if (level === this.state.TOTAL_LEVELS) {
            return this._spawnBoss(level);
        }

        let mobs = [];
        let allFreeCells = this.state.getFreeCellsForMonsters();

        if (allFreeCells.length === 0) return [];

        const monsterCount = Math.min(
            5 + level * 2 + Math.floor(this.rngs.monster() * 4),
            this.state.MAX_MONSTERS,
            allFreeCells.length
        );

        const bigMonsterCount = Math.floor(monsterCount * (0.2 + level * 0.1));

        // 分离近处和远处的格子
        const nearCells = [];
        const farCells = [];

        for (let cell of allFreeCells) {
            const [r, c] = cell;
            const dist = this.state.manhattanDistance(r, c, 1, 1);
            if (dist >= this.state.MIN_BIG_MONSTER_DISTANCE) {
                farCells.push(cell);
            } else {
                nearCells.push(cell);
            }
        }

        // 随机打乱
        const shuffledNear = this.state.shuffleArray(nearCells, this.rngs.monster);
        const shuffledFar = this.state.shuffleArray(farCells, this.rngs.monster);

        // 放置大怪
        let bigMonstersPlaced = 0;
        const bigMonsterIndices = this.state.selectRandomIndices(
            shuffledFar.length, bigMonsterCount, this.rngs.monster
        );

        for (let i = 0; i < bigMonsterIndices.length; i++) {
            const idx = bigMonsterIndices[i];
            const [r, c] = shuffledFar[idx];
            const monster = MonsterGenerator.spawn(level, 'big', r, c, `big_${i}`, this.rngs.monster);
            mobs.push(monster);
            bigMonstersPlaced++;
        }

        // 放置小怪
        const smallMonsterCount = monsterCount - bigMonstersPlaced;

        const usedFarIndices = new Set(bigMonsterIndices);
        const remainingCells = [];

        for (let i = 0; i < shuffledFar.length; i++) {
            if (!usedFarIndices.has(i)) {
                remainingCells.push(shuffledFar[i]);
            }
        }

        remainingCells.push(...shuffledNear);

        const shuffledRemaining = this.state.shuffleArray(remainingCells, this.rngs.monster);

        for (let i = 0; i < smallMonsterCount && i < shuffledRemaining.length; i++) {
            const [r, c] = shuffledRemaining[i];
            const monster = MonsterGenerator.spawn(level, 'small', r, c, `small_${i}`, this.rngs.monster);
            mobs.push(monster);
        }

        return mobs;
    }

    /**
     * 生成Boss
     */
    _spawnBoss(level) {
        let freeCells = this.state.getFreeCellsForMonsters();

        if (freeCells.length === 0) return [];

        const farCells = freeCells.filter(([r, c]) =>
            this.state.manhattanDistance(r, c, 1, 1) >= this.state.MIN_BIG_MONSTER_DISTANCE
        );

        const candidates = farCells.length > 0 ? farCells : freeCells;
        const randomIndex = Math.floor(this.rngs.monster() * candidates.length);
        const [r, c] = candidates[randomIndex];

        const boss = MonsterGenerator.spawn(level, 'boss', r, c, 'boss', this.rngs.monster);
        return [boss];
    }

    /**
     * 移动到下一层
     */
    nextLevel(gameCallbacks) {
        if (this.state.currentLevel < this.state.TOTAL_LEVELS) {
            this.state.currentLevel++;
            this.loadLevel(this.state.currentLevel);
            return true;
        }
        return false;
    }
}
