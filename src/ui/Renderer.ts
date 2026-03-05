/**
 * 渲染器模块
 * 负责绘制迷宫、玩家、怪物等所有图形元素
 */
import type {PlayerEntity} from "../entity/PlayerEntity.ts";
import type {MobEntity} from "../entity/MobEntity.ts";
import type {Position} from "../core/Position.ts";
import {MazeGenerator} from "../core/Maze.ts";
import {getCell} from "../utils/math.ts";

export class Renderer {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly cellSize: number;
    private readonly size: number


    constructor(canvas: HTMLCanvasElement, cellSize = 25) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.cellSize = cellSize;
        this.size = MazeGenerator.SIZE;
    }

    /**
     * 绘制整个游戏画面
     */
    render(maze: Uint8Array, player: PlayerEntity, monsters: MobEntity[], _stairsPos: Position, gameWin: boolean, gameOver: boolean) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this._renderMaze(maze);
        this._renderMonsters(monsters);
        this._renderPlayer(player);

        if (gameWin) {
            this._renderWinMessage();
        }
        if (gameOver) {
            this._renderGameOverMessage();
        }
    }

    /**
     * 绘制迷宫底层
     */
    _renderMaze(maze: Uint8Array) {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const x = c * this.cellSize;
                const y = r * this.cellSize;
                const cell = getCell(maze, this.size, r, c);

                this._renderCell(x, y, cell);
                this._renderGridLine(x, y);
            }
        }
    }

    /**
     * 绘制单个格子
     */
    _renderCell(x: number, y: number, cell: number) {
        if (cell === 0) {
            // 墙
            this.ctx.fillStyle = '#1d4f5a';
            this.ctx.fillRect(x, y, this.cellSize - 1, this.cellSize - 1);
            this.ctx.fillStyle = '#0d3640';
            this.ctx.fillRect(x + 2, y + 2, this.cellSize - 5, this.cellSize - 5);
        } else {
            // 路
            this.ctx.fillStyle = '#b7ab99';
            this.ctx.fillRect(x, y, this.cellSize - 1, this.cellSize - 1);
            this.ctx.fillStyle = '#9a8b76';
            this.ctx.fillRect(x + 2, y + 2, this.cellSize - 5, this.cellSize - 5);

            this._renderItem(x, y, cell);
        }
    }

    /**
     * 绘制道具
     */
    _renderItem(x: number, y: number, cell: number) {
        this.ctx.font = 'bold 16px "Segoe UI", "Courier New", monospace';
        this.ctx.fillStyle = '#000000';
        this.ctx.shadowBlur = 8;

        if (cell === 2) {
            this.ctx.shadowColor = 'white';
            this.ctx.fillText('🗡️', x + 5, y + 18);
        } else if (cell === 3) {
            this.ctx.shadowColor = '#ccc';
            this.ctx.fillText('🛡️', x + 5, y + 18);
        } else if (cell === 4) {
            this.ctx.shadowColor = 'red';
            this.ctx.fillText('🧴', x + 5, y + 18);
        } else if (cell === 6) {
            this.ctx.shadowColor = '#c77dff';
            this.ctx.fillStyle = '#9b59b6';
            this.ctx.fillText('❓', x + 5, y + 18);
        } else if (cell === 7) {
            this.ctx.shadowColor = 'gold';
            this.ctx.fillStyle = 'gold';
            this.ctx.fillRect(x + 5, y + 5, 15, 15);
        }

        this.ctx.shadowBlur = 0;
    }

    /**
     * 绘制网格线
     */
    _renderGridLine(x: number, y: number) {
        this.ctx.strokeStyle = '#1f6d7a';
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
    }

    /**
     * 绘制怪物
     */
    _renderMonsters(monsters: MobEntity[]) {
        monsters.forEach(m => {
            const x = m.pos.col * this.cellSize;
            const y = m.pos.row * this.cellSize;

            if (m.type === 'boss') {
                this.ctx.fillStyle = '#8b0000';
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = 'red';
            } else {
                this.ctx.fillStyle = m.type === 'big' ? '#b04545' : '#a1652c';
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = 'darkred';
            }

            this._drawMonsterShape(x, y);
            this._drawMonsterHealth(x, y, m.getHealth());
        });
    }

    /**
     * 绘制怪物形状（六边形）
     */
    _drawMonsterShape(x: number, y: number) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + 5, y + 2);
        this.ctx.lineTo(x + 20, y + 2);
        this.ctx.lineTo(x + 23, y + 12);
        this.ctx.lineTo(x + 20, y + 22);
        this.ctx.lineTo(x + 5, y + 22);
        this.ctx.lineTo(x + 2, y + 12);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 绘制怪物血量
     */
    _drawMonsterHealth(x: number, y: number, hp: number) {
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText('❤️' + hp, x + 3, y + 16);
    }

    /**
     * 绘制玩家
     */
    _renderPlayer(player: PlayerEntity) {
        const x = player.pos.col * this.cellSize;
        const y = player.pos.row * this.cellSize;

        this.ctx.fillStyle = '#3bc0db';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#1f8a9c';
        this.ctx.beginPath();
        this.ctx.arc(x + 12, y + 12, 10, 0, 2 * Math.PI);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText('⚔️', x + 5, y + 18);
    }

    /**
     * 绘制胜利信息
     */
    _renderWinMessage() {
        this.ctx.fillStyle = '#ffffffcc';
        this.ctx.font = 'bold 30px sans-serif';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('🏆 胜利', 350, 500);
    }

    /**
     * 绘制游戏结束信息
     */
    _renderGameOverMessage() {
        this.ctx.fillStyle = '#000000cc';
        this.ctx.font = 'bold 30px sans-serif';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('💔 勇者倒下了', 300, 500);
    }
}
