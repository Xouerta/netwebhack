import {GameState} from "../core/GameState.ts";
import type {LogSystem} from "../systems/LogSystem.ts";
import type {MobEntity} from "../entity/MobEntity.ts";
import type {Position} from "../core/Position.ts";
import {getCell} from "../utils/math.ts";

export class BossAI {
    private readonly state: GameState;
    private readonly logSystem: LogSystem;
    private readonly dirs: number[][];

    public constructor(gameState: GameState, logSystem: LogSystem) {
        this.state = gameState;
        this.logSystem = logSystem;
        this.dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    }

    /**
     * 移动Boss
     */
    moveBoss(monster: MobEntity, playerPos: Position, newMonsters: MobEntity[]) {
        let bestDir = null;
        let bestDist = 999;

        for (let [dr, dc] of this.dirs) {
            let nr = monster.pos.row + dr;
            let nc = monster.pos.col + dc;

            if (nr === playerPos.row && nc === playerPos.col) continue;

            if (this.canMoveTo(nr, nc, monster, newMonsters)) {
                let dist = Math.abs(nr - playerPos.row) + Math.abs(nc - playerPos.col);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = [dr, dc];
                }
            }
        }

        if (bestDir) {
            monster.pos.row += bestDir[0];
            monster.pos.col += bestDir[1];
            this.logSystem.addAI('👑 Boss向你靠近');
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
            m => m !== currentMonster && m.pos.row === row && m.pos.col === col
        );
        if (occupiedByOld) return false;

        if (row === this.state.stairsPos.row && col === this.state.stairsPos.col) return false;

        return true;
    }
}
