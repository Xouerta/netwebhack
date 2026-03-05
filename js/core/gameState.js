/**
 * 游戏状态管理模块
 * 管理游戏的核心状态、玩家属性、统计信息
 */

class GameState {
    constructor() {
        this.SIZE = 40;
        this.TOTAL_LEVELS = 5;
        this.MAX_MONSTERS = 15;
        this.MIN_BIG_MONSTER_DISTANCE = 10;

        this.currentLevel = 1;
        this.player = new Player();
        this.maze = [];
        this.monsters = [];
        this.stairsPos = { row: 38, col: 38 };

        this.gameWin = false;
        this.gameOver = false;
        this.waitingForEvent = false;
        this.inCombat = false;
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
    }

    /**
     * 重置状态（新游戏）
     */
    reset(seed) {
        this.currentLevel = 1;
        this.player = new Player();
        this.maze = [];
        this.monsters = [];
        this.gameWin = false;
        this.gameOver = false;
        this.waitingForEvent = false;
        this.inCombat = false;
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
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        document.getElementById('hpDisplay').innerText = this.player.hp + '/' + this.player.maxHp;
        document.getElementById('atkDisplay').innerText = this.player.atk;
        document.getElementById('defDisplay').innerText = this.player.def;
        document.getElementById('monsterCount').innerText = this.monsters.length;
        document.getElementById('levelDisplay').innerText = this.currentLevel + '/' + this.TOTAL_LEVELS;
    }

    /**
     * 计算曼哈顿距离
     */
    manhattanDistance(r1, c1, r2, c2) {
        return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    }

    /**
     * 获取可用于生成怪物的空闲格子
     */
    getFreeCellsForMonsters() {
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
     * 随机打乱数组
     */
    shuffleArray(array, rng) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    /**
     * 随机选择不重复索引
     */
    selectRandomIndices(max, count, rng) {
        if (count >= max) {
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
     * 从格子类型获取物品类型
     */
    getItemTypeFromCell(cell) {
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
    getItemTypeName(cell) {
        const map = {
            2: '🗡️ 剑',
            3: '🛡️ 盾',
            4: '🧴 血药'
        };
        return map[cell];
    }
}
