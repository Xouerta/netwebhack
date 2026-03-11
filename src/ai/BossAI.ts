import {GameState} from "../core/GameState.ts";
import type {LogSystem} from "../systems/LogSystem.ts";
import type {MobEntity} from "../entity/MobEntity.ts";
import type {Position} from "../core/Position.ts";

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
    public moveBoss(mob: MobEntity, playerPos: Position, newMonsters: MobEntity[]) {
        let bestDir = null;
        let bestDist = 999;

        for (let [dr, dc] of this.dirs) {
            let nr = mob.row + dr;
            let nc = mob.col + dc;

            if (nr === playerPos.row && nc === playerPos.col) continue;

            if (this.canMoveTo(nr, nc, mob, newMonsters)) {
                let dist = Math.abs(nr - playerPos.row) + Math.abs(nc - playerPos.col);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = [dr, dc];
                }
            }
        }

        if (bestDir) {
            mob.move(bestDir[0], bestDir[1]);
            this.logSystem.addAI('👑 Boss向你靠近');
        }

        newMonsters.push(mob);
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
