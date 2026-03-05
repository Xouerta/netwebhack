import {GameState} from "../core/GameState.ts";
import type {LogSystem} from "../systems/LogSystem.ts";
import type {MobEntity} from "../entity/MobEntity.ts";
import {getCell} from "../utils/math.ts";

export class MonsterAI {
    private readonly state: GameState;
    private readonly logSystem: LogSystem;
    private readonly dirs: number[][];

    public constructor(gameState: GameState, logSystem: LogSystem) {
        this.state = gameState;
        this.logSystem = logSystem;
        this.dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    }

    /**
     * 移动所有怪物
     */
    public moveAllMonsters() {
        if (this.state.gameWin || this.state.gameOver ||
            this.state.waitingForEvent || this.state.inCombat) return;

        const playerPower = this.state.player.getPower();
        const newMonsters: MobEntity[] = [];
        const playerRow = this.state.player.pos.row;
        const playerCol = this.state.player.pos.col;

        for (let m of this.state.monsters) {
            if (m.type === 'boss') {
            } else {
                this.moveNormalMonster(m, playerPower, playerRow, playerCol, newMonsters);
            }
        }

        this.state.monsters = newMonsters;

        return this.checkAdjacentMonsters();
    }

    /**
     * 检查是否有相邻怪物
     */
    private checkAdjacentMonsters() {
        const adjacentMonsters = this.state.monsters.filter(m =>
            Math.abs(m.row - this.state.player.pos.row) +
            Math.abs(m.col - this.state.player.pos.col) === 1
        );

        return adjacentMonsters.length > 0 ? adjacentMonsters[0] : null;
    }

    /**
     * 移动普通怪物
     */
    private moveNormalMonster(monster: MobEntity, playerPower: number, playerRow: number, playerCol: number, newMonsters: MobEntity[]) {
        const dist = Math.abs(monster.pos.row - playerRow) + Math.abs(monster.pos.col - playerCol);
        const monsterPower = monster.getPower();

        if (dist <= 2) {
            if (monsterPower > playerPower) {
                this.chasePlayer(monster, playerRow, playerCol, newMonsters);
            } else if (monsterPower < playerPower) {
                this.fleeFromPlayer(monster, playerRow, playerCol, newMonsters);
            } else {
                this.randomMove(monster, newMonsters);
            }
        } else {
            this.randomMove(monster, newMonsters);
        }
    }

    /**
     * 追逐玩家
     */
    private chasePlayer(monster: MobEntity, playerRow: number, playerCol: number, newMonsters: MobEntity[]) {
        let bestDir = null;
        let bestDist = 999;

        for (let [dr, dc] of this.dirs) {
            let nr = monster.pos.row + dr;
            let nc = monster.pos.col + dc;

            if (nr === playerRow && nc === playerCol) continue;

            if (this.canMoveTo(nr, nc, monster, newMonsters)) {
                let dist = Math.abs(nr - playerRow) + Math.abs(nc - playerCol);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = [dr, dc];
                }
            }
        }

        if (bestDir) {
            monster.pos.row += bestDir[0];
            monster.pos.col += bestDir[1];
            this.logSystem.addAI(`👾 ${monster.getName()}觉得比你强，追过来了`);
        }

        newMonsters.push(monster);
    }

    /**
     * 逃离玩家
     */
    private fleeFromPlayer(monster: MobEntity, playerRow: number, playerCol: number, newMonsters: MobEntity[]) {
        let bestDir = null;
        let bestDist = -1;

        for (let [dr, dc] of this.dirs) {
            let nr = monster.pos.row + dr;
            let nc = monster.pos.col + dc;

            if (nr === playerRow && nc === playerCol) continue;

            if (this.canMoveTo(nr, nc, monster, newMonsters)) {
                let dist = Math.abs(nr - playerRow) + Math.abs(nc - playerCol);
                if (dist > bestDist) {
                    bestDist = dist;
                    bestDir = [dr, dc];
                }
            }
        }

        if (bestDir) {
            monster.pos.row += bestDir[0];
            monster.pos.col += bestDir[1];
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
            let [dr, dc] = this.dirs[Math.floor(Math.random() * this.dirs.length)];
            let nr = monster.pos.row + dr;
            let nc = monster.pos.col + dc;
            tries++;

            if (nr === this.state.player.pos.row && nc === this.state.player.pos.col) continue;

            if (this.canMoveTo(nr, nc, monster, newMonsters)) {
                monster.pos.row = nr;
                monster.pos.col = nc;
                moved = true;
            }
        }

        newMonsters.push(monster);
    }

    /**
     * 检查是否可以移动到指定位置
     */
    private canMoveTo(row: number, col: number, currentMonster: MobEntity, newMonsters: MobEntity[]) {
        if (row < 1 || row >= GameState.SIZE - 1 ||
            col < 1 || col >= GameState.SIZE - 1) return false;
        if (getCell(this.state.maze, GameState.SIZE, row, col) !== 1) return false;
        if (row === this.state.player.pos.row && col === this.state.player.pos.col) return false;

        const occupiedByNew = newMonsters.some(m => m.pos.row === row && m.pos.col === col);
        if (occupiedByNew) return false;

        const occupiedByOld = this.state.monsters.some(
            m => m !== currentMonster && m.row === row && m.col === col
        );
        if (occupiedByOld) return false;

        if (row === this.state.stairsPos.row && col === this.state.stairsPos.col) return false;

        return true;
    }
}
