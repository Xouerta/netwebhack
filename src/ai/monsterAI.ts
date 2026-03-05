export class MonsterAI {
    constructor(gameState, logSystem) {
        this.state = gameState;
        this.logSystem = logSystem;
        this.dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    }

    /**
     * 移动所有怪物
     */
    moveAllMonsters() {
        if (this.state.gameWin || this.state.gameOver ||
            this.state.waitingForEvent || this.state.inCombat) return;

        const playerPower = this.state.player.getPower();
        const newMonsters = [];
        const playerRow = this.state.player.row;
        const playerCol = this.state.player.col;

        for (let m of this.state.monsters) {
            if (m.type === 'boss') {
                this._moveBoss(m, playerRow, playerCol, newMonsters);
            } else {
                this._moveNormalMonster(m, playerPower, playerRow, playerCol, newMonsters);
            }
        }

        this.state.monsters = newMonsters;

        return this._checkAdjacentMonsters();
    }

    /**
     * 检查是否有相邻怪物
     */
    _checkAdjacentMonsters() {
        const adjacentMonsters = this.state.monsters.filter(m =>
            Math.abs(m.row - this.state.player.row) +
            Math.abs(m.col - this.state.player.col) === 1
        );

        return adjacentMonsters.length > 0 ? adjacentMonsters[0] : null;
    }

    /**
     * 移动普通怪物
     */
    _moveNormalMonster(monster, playerPower, playerRow, playerCol, newMonsters) {
        const dist = Math.abs(monster.row - playerRow) + Math.abs(monster.col - playerCol);
        const monsterPower = monster.getPower();

        if (dist <= 2) {
            if (monsterPower > playerPower) {
                this._chasePlayer(monster, playerRow, playerCol, newMonsters);
            } else if (monsterPower < playerPower) {
                this._fleeFromPlayer(monster, playerRow, playerCol, newMonsters);
            } else {
                this._randomMove(monster, newMonsters);
            }
        } else {
            this._randomMove(monster, newMonsters);
        }
    }

    /**
     * 追逐玩家
     */
    _chasePlayer(monster, playerRow, playerCol, newMonsters) {
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
            this.logSystem.addAI(`👾 ${monster.getName()}觉得比你强，追过来了`);
        }

        newMonsters.push(monster);
    }

    /**
     * 逃离玩家
     */
    _fleeFromPlayer(monster, playerRow, playerCol, newMonsters) {
        let bestDir = null;
        let bestDist = -1;

        for (let [dr, dc] of this.dirs) {
            let nr = monster.row + dr;
            let nc = monster.col + dc;

            if (nr === playerRow && nc === playerCol) continue;

            if (this._canMoveTo(nr, nc, monster, newMonsters)) {
                let dist = Math.abs(nr - playerRow) + Math.abs(nc - playerCol);
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
    _randomMove(monster, newMonsters) {
        let moved = false;
        let tries = 0;

        while (!moved && tries < 8) {
            let [dr, dc] = this.dirs[Math.floor(Math.random() * this.dirs.length)];
            let nr = monster.row + dr;
            let nc = monster.col + dc;
            tries++;

            if (nr === this.state.player.row && nc === this.state.player.col) continue;

            if (this._canMoveTo(nr, nc, monster, newMonsters)) {
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
