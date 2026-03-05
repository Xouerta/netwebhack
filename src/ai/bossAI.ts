export class BossAI {
   public constructor(gameState, logSystem) {
        this.state = gameState;
        this.logSystem = logSystem;
        this.dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    }

    /**
     * 移动Boss
     */
    moveBoss(monster, playerRow, playerCol, newMonsters) {
        let bestDir = null;
        let bestDist = 999;

        for (let [dr, dc] of this.dirs) {
            let nr = monster.row + dr;
            let nc = monster.col + dc;

            if (nr === playerRow && nc === playerCol) continue;

            if (this._canMoveTo(nr, nc, monster, newMonsters)) {
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
     * 检查是否可以移动到指定位置
     */
    _canMoveTo(row, col, currentMonster, newMonsters) {
        if (row < 1 || row >= this.state.SIZE - 1 ||
            col < 1 || col >= this.state.SIZE - 1) return false;
        if (this.state.maze[row][col] !== 1) return false;
        if (row === this.state.player.row && col === this.state.player.col) return false;

        const occupiedByNew = newMonsters.some(m => m.row === row && m.col === col);
        if (occupiedByNew) return false;

        const occupiedByOld = this.state.monsters.some(
            m => m !== currentMonster && m.row === row && m.col === col
        );
        if (occupiedByOld) return false;

        if (row === this.state.stairsPos.row && col === this.state.stairsPos.col) return false;

        return true;
    }
}
