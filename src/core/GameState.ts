import {PlayerEntity} from "../entity/PlayerEntity.ts";
import type {Stats} from "./Stats.ts";
import type {Position} from "./Position.ts";
import type {Supplier} from "../types.ts";
import {getCell} from "../utils/math.ts";
import type {MobEntity} from "../entity/MobEntity.ts";

export class GameState {
    public static readonly SIZE = 40;
    public static readonly TOTAL_LEVELS = 5;
    public static readonly MAX_MOB_CAP = 10;
    public static readonly MIN_BIG_MOB_DISTANCE = 10;

    public currentLevel: number;
    public player: PlayerEntity;
    public maze: Uint8Array;
    public monsters: MobEntity[];
    public stairsPos: Position;

    public gameWin: boolean;
    public gameOver: boolean;
    public waitingForEvent: boolean;
    public inCombat: boolean;
    public currentItemCell: null | any;
    public stats: Stats;

    public constructor() {
        this.currentLevel = 1;
        this.player = new PlayerEntity();
        this.maze = new Uint8Array(0);
        this.monsters = [];
        this.stairsPos = {row: 38, col: 38};

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

    public reset() {
        this.currentLevel = 1;
        this.player = new PlayerEntity();
        this.maze = new Uint8Array(0);
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
    public updateUI() {
        document.getElementById('hpDisplay')!.innerText = this.player.getHealth() + '/' + this.player.getMaxHealth();
        document.getElementById('atkDisplay')!.innerText = this.player.atk.toString();
        document.getElementById('defDisplay')!.innerText = this.player.def.toString();
        document.getElementById('monsterCount')!.innerText = this.monsters.length.toString();
        document.getElementById('levelDisplay')!.innerText = this.currentLevel + '/' + GameState.TOTAL_LEVELS;
    }

    /**
     * 计算曼哈顿距离
     */
    public manhattanDistance(r1: number, c1: number, r2: number, c2: number) {
        return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    }

    /**
     * 获取可用于生成怪物的空闲格子
     */
    public getFreeCellsForMonsters() {
        let free = [];
        for (let r = 1; r < GameState.SIZE - 1; r++) {
            for (let c = 1; c < GameState.SIZE - 1; c++) {
                if (getCell(this.maze, GameState.SIZE, r, c) === 1 &&
                    !(r === 1 && c === 1) &&
                    !(r === this.stairsPos.row && c === this.stairsPos.col)) {
                    free.push([r, c]);
                }
            }
        }
        return free;
    }

    /**
     * 随机选择不重复索引
     */
    public selectRandomIndices(max: number, count: number, rng: Supplier<number>): number[] {
        if (count >= max) {
            return Array.from({length: max}, (_, i) => i);
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
    public getItemTypeFromCell(cell: number): string {
        const map: Record<number, string> = {
            2: 'sword',
            3: 'shield',
            4: 'potion'
        };
        return map[cell];
    }

    /**
     * 获取物品类型名称
     */
    public getItemTypeName(cell: number): string {
        const map: Record<number, string> = {
            2: '🗡️ 剑',
            3: '🛡️ 盾',
            4: '🧴 血药'
        };
        return map[cell];
    }
}
