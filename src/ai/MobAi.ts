import {GameState} from "../core/GameState.ts";
import type {LogSystem} from "../systems/LogSystem.ts";
import type {MobEntity} from "../entity/MobEntity.ts";
import type {Game} from "../core/Game.ts";

export class MobAi {
    private static readonly DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    private readonly game: Game;
    private readonly state: GameState;
    private readonly logSystem: LogSystem;

    public constructor(game: Game, gameState: GameState, logSystem: LogSystem) {
        this.game = game;
        this.state = gameState;
        this.logSystem = logSystem;
    }

    /**
     * 移动所有怪物
     */
    public moveAllMonsters() {
        if (this.game.cannotAct()) return;

        const playerPower = this.state.player.getPower();
        const newMonsters: MobEntity[] = [];
        const playerRow = this.state.player.row;
        const playerCol = this.state.player.col;

        for (let m of this.state.monsters) {
            if (m.type !== 'boss') {
                this.moveNormalMonster(m, playerPower, playerRow, playerCol, newMonsters);
            }
        }

        this.state.monsters = newMonsters;

        return this.checkAdjacentMonsters();
    }

    private checkLineOfSight(r1: number, c1: number, r2: number, c2: number): boolean {
        // 如果在同一行
        if (r1 === r2) {
            const minC = Math.min(c1, c2);
            const maxC = Math.max(c1, c2);
            for (let c = minC + 1; c < maxC; c++) {
                if (this.state.maze.get(r1, c) !== 1) return false; // 有墙
            }
            return true;
        }

        // 如果在同一列
        if (c1 === c2) {
            const minR = Math.min(r1, r2);
            const maxR = Math.max(r1, r2);
            for (let r = minR + 1; r < maxR; r++) {
                if (this.state.maze.get(r, c1) !== 1) return false; // 有墙
            }
            return true;
        }
        return false;
    }

    /**
     * 检查是否有相邻怪物
     */
    private checkAdjacentMonsters() {
        const adjacentMonsters = this.state.monsters.filter(m =>
            Math.abs(m.row - this.state.player.row) +
            Math.abs(m.col - this.state.player.col) === 1
        );

        return adjacentMonsters.length > 0 ? adjacentMonsters[0] : null;
    }

    /**
     * 移动普通怪物
     */
    private moveNormalMonster(monster: MobEntity, playerPower: number, playerRow: number, playerCol: number, newMonsters: MobEntity[]) {
        const dist = Math.abs(monster.row - playerRow) + Math.abs(monster.col - playerCol);
        const monsterPower = monster.getPower();

        const hasLineOfSight = this.checkLineOfSight(monster.row, monster.col, playerRow, playerCol);

        let shouldChase = false;
        let shouldFlee = false;

        if (dist <= 6 && hasLineOfSight) {
            if (monsterPower > playerPower) shouldChase = true;
            else if (monsterPower < playerPower) shouldFlee = true;
        }

        if (dist <= 2) {
            if (monsterPower > playerPower) shouldChase = true;
            else if (monsterPower < playerPower) shouldFlee = true;
        }

        if (shouldChase) {
            if (Math.random() > 0.9) {
                this.chasePlayer(monster, playerRow, playerCol, newMonsters);
            } else {
                this.randomMove(monster, newMonsters);
            }
            return;
        }

        if (shouldFlee) {
            this.fleeFromPlayer(monster, playerRow, playerCol, newMonsters);
            return;
        }

        // 默认随机移动
        this.randomMove(monster, newMonsters);
    }

    /**
     * 追逐玩家
     */
    private chasePlayer(monster: MobEntity, playerRow: number, playerCol: number, newMonsters: MobEntity[]) {
        let bestDir = null;
        let bestDist = Infinity;
        let currentDist = Math.abs(monster.row - playerRow) + Math.abs(monster.col - playerCol);

        for (const [dr, dc] of MobAi.DIRS) {
            const nr = monster.row + dr;
            const nc = monster.col + dc;

            if (nr === playerRow && nc === playerCol) continue;

            if (this.canMoveTo(nr, nc, monster, newMonsters)) {
                const dist = Math.abs(nr - playerRow) + Math.abs(nc - playerCol);

                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = [dr, dc];
                }
            }
        }

        if (bestDir && bestDist < currentDist) {
            monster.row += bestDir[0];
            monster.col += bestDir[1];
            this.logSystem.addAI(`👾 ${monster.getName()} 觉得比你强，追过来了`);
        } else {
            this.randomMove(monster, newMonsters);
            return;
        }

        newMonsters.push(monster);
    }

    /**
     * 逃离玩家
     */
    private fleeFromPlayer(monster: MobEntity, playerRow: number, playerCol: number, newMonsters: MobEntity[]) {
        let bestDir = null;
        let bestDist = -1;

        for (const [dr, dc] of MobAi.DIRS) {
            const nr = monster.row + dr;
            const nc = monster.col + dc;

            if (nr === playerRow && nc === playerCol) continue;

            if (this.canMoveTo(nr, nc, monster, newMonsters)) {
                const dist = Math.abs(nr - playerRow) + Math.abs(nc - playerCol);
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
    private randomMove(monster: MobEntity, newMonsters: MobEntity[]) {
        let moved = false;
        let tries = 0;

        while (!moved && tries < 8) {
            const [dr, dc] = MobAi.DIRS[Math.floor(Math.random() * MobAi.DIRS.length)];
            const nr = monster.row + dr;
            const nc = monster.col + dc;
            tries++;

            if (nr === this.state.player.row && nc === this.state.player.col) continue;

            if (this.canMoveTo(nr, nc, monster, newMonsters)) {
                monster.row = nr;
                monster.col = nc;
                moved = true;
            }
        }

        newMonsters.push(monster);
    }

    /**
     * 检查是否可以移动到指定位置
     */
    private canMoveTo(row: number, col: number, currentMonster: MobEntity, newMonsters: MobEntity[]) {
        if (row < 1 || row >= this.state.size - 1 ||
            col < 1 || col >= this.state.size - 1) return false;

        if (this.state.maze.get(row, col) !== 1) return false;
        if (row === this.state.player.row && col === this.state.player.col) return false;

        const occupiedByNew = newMonsters.some(m => m.row === row && m.col === col);
        if (occupiedByNew) return false;

        const occupiedByOld = this.state.monsters.some(
            m => m !== currentMonster && m.row === row && m.col === col
        );
        if (occupiedByOld) return false;

        return !(row === this.state.stairsPos.row && col === this.state.stairsPos.col);
    }
}
