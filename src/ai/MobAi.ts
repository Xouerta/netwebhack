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

    public moveAllMobs() {
        if (this.game.cannotAct()) return;

        const playerPower = this.state.player.getPower();
        const newMonsters: MobEntity[] = [];
        const playerRow = this.state.player.row;
        const playerCol = this.state.player.col;

        for (let m of this.state.monsters) {
            if (m.type !== 'boss') {
                this.moveMob(m, playerPower, playerRow, playerCol, newMonsters);
            }
        }

        this.state.monsters = newMonsters;

        return this.checkAdjacentMonsters();
    }

    private moveMob(monster: MobEntity, playerPower: number, playerRow: number, playerCol: number, newMonsters: MobEntity[]) {
        const dist = Math.abs(monster.row - playerRow) + Math.abs(monster.col - playerCol);
        if (dist > 6) {
            this.randomMove(monster, newMonsters);
            return;
        }

        const monsterPower = monster.getPower();

        let shouldChase = false;
        let shouldFlee = false;

        if (dist <= 2) {
            if (monsterPower > playerPower) shouldChase = true;
            else if (monsterPower < playerPower) shouldFlee = true;
        } else if (dist <= 6 && this.checkLineOfSight(monster.row, monster.col, playerRow, playerCol)) {
            if (monsterPower > playerPower) shouldChase = true;
        }

        if (shouldChase) {
            this.chasePlayer(monster, playerRow, playerCol, newMonsters);
            return;
        }

        if (shouldFlee) {
            this.fleeFromPlayer(monster, playerRow, playerCol, newMonsters);
            return;
        }

        this.randomMove(monster, newMonsters);
    }

    private checkLineOfSight(r1: number, c1: number, r2: number, c2: number): boolean {
        // 水平方向
        if (r1 === r2) {
            const start = Math.min(c1, c2) + 1;
            const end = Math.max(c1, c2);
            for (let c = start; c < end; c++) {
                if (this.state.maze.get(r1, c) === 0) return false;
            }
            return true;
        }

        // 垂直方向
        if (c1 === c2) {
            const start = Math.min(r1, r2) + 1;
            const end = Math.max(r1, r2);
            for (let r = start; r < end; r++) {
                if (this.state.maze.get(r, c1) === 0) return false;
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
     * 追逐玩家
     */
    private chasePlayer(mob: MobEntity, playerRow: number, playerCol: number, newMonsters: MobEntity[]) {
        let bestDir = null;
        let bestDist = Infinity;
        let currentDist = Math.abs(mob.row - playerRow) + Math.abs(mob.col - playerCol);

        for (const [dr, dc] of MobAi.DIRS) {
            const nr = mob.row + dr;
            const nc = mob.col + dc;

            if (nr === playerRow && nc === playerCol) continue;

            if (this.canMoveTo(nr, nc, mob, newMonsters)) {
                const dist = Math.abs(nr - playerRow) + Math.abs(nc - playerCol);

                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = [dr, dc];
                }
            }
        }

        if (bestDir && bestDist < currentDist) {
            mob.move(bestDir[0], bestDir[1]);
            this.logSystem.addAI(`👾 ${mob.getName()} 觉得比你强，追过来了`);
        }
        newMonsters.push(mob);
    }

    /**
     * 逃离玩家
     */
    private fleeFromPlayer(mob: MobEntity, playerRow: number, playerCol: number, newMonsters: MobEntity[]) {
        let bestDir = null;
        let bestDist = -1;

        for (const [dr, dc] of MobAi.DIRS) {
            const nr = mob.row + dr;
            const nc = mob.col + dc;

            if (nr === playerRow && nc === playerCol) continue;

            if (this.canMoveTo(nr, nc, mob, newMonsters)) {
                const dist = Math.abs(nr - playerRow) + Math.abs(nc - playerCol);
                if (dist > bestDist) {
                    bestDist = dist;
                    bestDir = [dr, dc];
                }
            }
        }

        if (bestDir) {
            mob.move(bestDir[0], bestDir[1]);
            this.logSystem.addAI(`🏃 ${mob.getName()} 觉得打不过你，逃跑了`);
        }

        newMonsters.push(mob);
    }

    /**
     * 随机移动
     */
    private randomMove(mob: MobEntity, newMonsters: MobEntity[]) {
        let moved = false;
        let tries = 0;

        while (!moved && tries < 8) {
            const [dr, dc] = MobAi.DIRS[Math.floor(Math.random() * MobAi.DIRS.length)];
            const nr = mob.row + dr;
            const nc = mob.col + dc;
            tries++;

            if (nr === this.state.player.row && nc === this.state.player.col) continue;

            if (this.canMoveTo(nr, nc, mob, newMonsters)) {
                mob.setPos(nr, nc);
                moved = true;
            }
        }

        newMonsters.push(mob);
    }

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
