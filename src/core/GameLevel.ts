/**
 * 关卡管理模块
 * 负责加载新关卡、生成怪物
 */
import {GameState} from "./GameState.ts";
import type {Supplier} from "../types.ts";
import {MobEntity, MonsterGenerator} from "../entity/MobEntity.ts";
import {shuffleArray} from "../utils/math.ts";
import type {LogSystem} from "../systems/LogSystem.ts";
import {MazeGenerator} from "./MazeGenerator.ts";

export class GameLevel {
    private readonly state: GameState;
    public rngs: Record<string, Supplier<number>>;
    private readonly logSystem: LogSystem;

    public constructor(gameState: GameState, rngs: Record<string, Supplier<number>>, logSystem: LogSystem) {
        this.state = gameState;
        this.rngs = rngs;
        this.logSystem = logSystem;
    }

    /**
     * 加载指定层
     */
    public loadLevel(level: number) {
        // 生成迷宫
        const maze = MazeGenerator.generateLevel(this.state.size, level, this.rngs.maze);

        // 放置物品和事件
        MazeGenerator.placeItemsAndEvents(maze, level, this.rngs.item);

        // 放置楼梯
        const result = MazeGenerator.placeStairs(maze, this.rngs.item);
        this.state.maze.change(result.maze);
        this.state.stairsPos = result.stairsPos;

        // 生成怪物
        this.state.monsters = this.spawnMonsters(level);

        const {row, col} = this.state.player.pos;
        this.state.maze.set(row, col, 1);

        this.logSystem.addStairs(`🏰 进入第 ${level} 层`);
    }

    /**
     * 生成怪物
     */
    private spawnMonsters(level: number) {
        if (level === GameState.TOTAL_LEVELS) {
            return this.spawnBoss(level);
        }

        const mobs: MobEntity[] = [];
        const allFreeCells = this.state.getFreeCellsForMonsters();

        if (allFreeCells.length === 0) return [];

        const monsterCount = Math.min(
            5 + level * 2 + Math.floor(this.rngs.monster() * 4),
            GameState.MAX_MOB_CAP,
            allFreeCells.length
        );

        const bigMonsterCount = Math.floor(monsterCount * (0.2 + level * 0.1));

        // 分离近处和远处的格子
        const nearCells: number[][] = [];
        const farCells: number[][] = [];

        for (const cell of allFreeCells) {
            const dist = this.state.manhattanDistance(cell[0], cell[1], 1, 1);
            if (dist >= GameState.MIN_BIG_MOB_DISTANCE) {
                farCells.push(cell);
            } else {
                nearCells.push(cell);
            }
        }

        // 随机打乱
        shuffleArray(nearCells, this.rngs.monster);
        shuffleArray(farCells, this.rngs.monster);

        // 放置大怪
        let bigMonstersPlaced = 0;
        const bigMonsterIndices = this.state.selectRandomIndices(
            farCells.length, bigMonsterCount, this.rngs.monster
        );

        for (let i = 0; i < bigMonsterIndices.length; i++) {
            const idx = bigMonsterIndices[i];
            const [r, c] = farCells[idx];
            const monster = MonsterGenerator.spawn(level, 'big', r, c, this.rngs.monster);
            mobs.push(monster);
            bigMonstersPlaced++;
        }

        // 放置小怪
        const smallMonsterCount = monsterCount - bigMonstersPlaced;

        const usedFarIndices = new Set(bigMonsterIndices);
        const remainingCells: number[][] = [];

        for (let i = 0; i < farCells.length; i++) {
            if (!usedFarIndices.has(i)) {
                remainingCells.push(farCells[i]);
            }
        }

        remainingCells.push(...nearCells);

        shuffleArray(remainingCells, this.rngs.monster);
        for (let i = 0; i < smallMonsterCount && i < remainingCells.length; i++) {
            const [r, c] = remainingCells[i];
            const monster = MonsterGenerator.spawn(level, 'small', r, c, this.rngs.monster);
            mobs.push(monster);
        }

        return mobs;
    }

    /**
     * 生成Boss
     */
    private spawnBoss(level: number) {
        const freeCells = this.state.getFreeCellsForMonsters();
        if (freeCells.length === 0) return [];

        const farCells = freeCells.filter(([r, c]) =>
            this.state.manhattanDistance(r, c, 1, 1) >= GameState.MIN_BIG_MOB_DISTANCE
        );

        const candidates = farCells.length > 0 ? farCells : freeCells;
        const randomIndex = Math.floor(this.rngs.monster() * candidates.length);
        const cell = candidates[randomIndex];

        const boss = MonsterGenerator.spawn(level, 'boss', cell[0], cell[1], this.rngs.monster);
        return [boss];
    }

    /**
     * 移动到下一层
     */
    public nextLevel() {
        if (this.state.currentLevel < GameState.TOTAL_LEVELS) {
            this.state.currentLevel++;
            this.loadLevel(this.state.currentLevel);
            return true;
        }
        return false;
    }
}
