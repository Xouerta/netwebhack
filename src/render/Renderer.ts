/**
 * 渲染器模块
 * 负责绘制迷宫、玩家、怪物等所有图形元素
 */
import type {PlayerEntity} from "../entity/PlayerEntity.ts";
import type {MobEntity} from "../entity/MobEntity.ts";
import type {Maze} from "../core/Maze.ts";
import {Items} from "../item/Items.ts";
import {PI2} from "../utils/math.ts";
import {LightRender} from "./LightRender.ts";

export class Renderer {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly cellSize: number;
    private readonly size: number
    private readonly lightRenderer: LightRender;

    public constructor(canvas: HTMLCanvasElement, size: number, cellSize = 25) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.cellSize = cellSize;
        this.size = size;
        this.lightRenderer = new LightRender(this.ctx);
    }

    public render(maze: Maze, player: PlayerEntity, monsters: MobEntity[], gameWin: boolean, gameOver: boolean) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.renderMaze(maze);
        this.lightRenderer.renderLightEffects();
        this.renderMonsters(monsters);
        this.renderPlayer(player);

        if (gameWin) {
            this.renderWinMessage();
        } else if (gameOver) {
            this.renderGameOverMessage();
        }
    }

    private renderMaze(maze: Maze) {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const x = c * this.cellSize;
                const y = r * this.cellSize;
                const cell = maze.get(r, c);

                this.renderCell(x, y, cell);
                this.renderGridLine(x, y);
            }
        }
    }

    /**
     * 绘制单个格子
     */
    private renderCell(x: number, y: number, cell: number) {
        if (cell === 0x00) {
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

            this.renderItem(x, y, cell);
        }
    }

    private renderItem(x: number, y: number, cell: number) {
        this.ctx.font = 'bold 16px "Segoe UI", "Courier New", monospace';
        this.ctx.fillStyle = '#000000';
        this.ctx.shadowBlur = 8;

        if (cell === Items.SWORD.type) {
            this.ctx.shadowColor = 'white';
            this.ctx.fillText('🗡️', x + 5, y + 18);
        } else if (cell === Items.SHIELD.type) {
            this.ctx.shadowColor = '#ccc';
            this.ctx.fillText('🛡️', x + 5, y + 18);
        } else if (cell === Items.POTION.type) {
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
    private renderGridLine(x: number, y: number) {
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
    }

    /**
     * 绘制怪物
     */
    private renderMonsters(mobs: MobEntity[]) {
        for (const mob of mobs) {
            const x = mob.col * this.cellSize;
            const y = mob.row * this.cellSize;

            const type = mob.type;
            if (type === 'boss') {
                this.ctx.fillStyle = '#8b0000';
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = 'red';
            } else {
                this.ctx.fillStyle = mob.type === 'big' ? '#b04545' : '#a1652c';
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = 'darkred';
            }

            this.drawMonsterShape(type, x, y);
            this.drawMonsterHealth(x, y, mob.getHealth());
            this.renderHealthBar(x, y, mob.getHealth() / mob.getMaxHealth());
        }
    }

    /**
     * 绘制怪物形状（六边形）
     */
    private drawMonsterShape(type: string, x: number, y: number) {
        if (type === 'boss') {
            // 绘制六边形
            this.ctx.beginPath();
            this.ctx.moveTo(x + 5, y + 2);
            this.ctx.lineTo(x + 20, y + 2);
            this.ctx.lineTo(x + 23, y + 12);
            this.ctx.lineTo(x + 20, y + 22);
            this.ctx.lineTo(x + 5, y + 22);
            this.ctx.lineTo(x + 2, y + 12);
            this.ctx.closePath();
            this.ctx.fill();
        } else if (type === 'big') {
            this.ctx.fillRect(x + 5, y + 5, 15, 15);
        } else {
            this.ctx.beginPath();
            this.ctx.arc(x + 12, y + 12, 10, 0, PI2);
            this.ctx.fill();
        }

        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = '';
    }

    private drawMonsterHealth(x: number, y: number, health: number) {
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.fillText('❤️' + health, x + 3, y + 16)
    }

    private renderHealthBar(x: number, y: number, percent: number) {
        const barWidth = 20;
        const barHeight = 3;

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x + 2, y - 5, barWidth, barHeight);

        this.ctx.fillStyle = percent > 0.6 ? '#2ecc71' : percent > 0.3 ? '#f39c12' : '#e74c3c';
        this.ctx.fillRect(x + 2, y - 5, barWidth * percent, barHeight);
    }

    private renderPlayer(player: PlayerEntity) {
        const x = player.col * this.cellSize;
        const y = player.row * this.cellSize;

        this.ctx.fillStyle = '#1f8a9c';
        this.ctx.beginPath();
        this.ctx.arc(x + 12, y + 12, 12, 0, PI2);
        this.ctx.fill();

        this.ctx.fillStyle = '#3bc0db';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#1f8a9c';
        this.ctx.beginPath();
        this.ctx.arc(x + 12, y + 12, 10, 0, PI2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText('⚔️', x + 5, y + 18);
    }

    /**
     * 绘制胜利信息
     */
    private renderWinMessage() {
        this.ctx.fillStyle = '#ffffffcc';
        this.ctx.font = 'bold 30px sans-serif';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('🏆 胜利', 350, 500);
    }

    /**
     * 绘制游戏结束信息
     */
    private renderGameOverMessage() {
        this.ctx.fillStyle = '#000000cc';
        this.ctx.font = 'bold 30px sans-serif';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('💔 勇者倒下了', 300, 500);
    }
}
