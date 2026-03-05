/**
 * 迷宫生成模块
 * 使用Kruskal算法生成连通迷宫，并添加小房间
 */
import type {Supplier} from "../types.ts";
import {shuffleArray} from "../utils/math.ts";
import {UnionFind} from "../utils/UnionFind.ts";
import {Maze} from "./Maze.ts";

export class MazeGenerator {
    /**
     * 生成一层地牢
     */
    public static generateLevel(size: number, level: number, rng: Supplier<number>) {
        const maze = this.generateBaseMaze(size, rng);
        this.addSmallRooms(maze, rng);

        if (level === 5) {
            this.createBossHall(maze);
        }

        this.setBoundaryWalls(maze);
        return maze;
    }

    /**
     * Kruskal算法生成基础迷宫
     */
    private static generateBaseMaze(size: number, rng: Supplier<number>) {
        const maze = new Maze(size);

        // 初始化所有奇行奇列为路
        for (let r = 1; r < size - 1; r += 2) {
            for (let c = 1; c < size - 1; c += 2) {
                maze.set(r, c, 1);
            }
        }

        // 收集所有墙
        const edges = [];
        for (let r = 1; r < size - 1; r += 2) {
            for (let c = 1; c < size - 3; c += 2) {
                edges.push({wallRow: r, wallCol: c + 1, a: [r, c], b: [r, c + 2]});
            }
        }
        for (let r = 1; r < size - 3; r += 2) {
            for (let c = 1; c < size - 1; c += 2) {
                edges.push({wallRow: r + 1, wallCol: c, a: [r, c], b: [r + 2, c]});
            }
        }

        // 随机打乱
        shuffleArray(edges, rng);

        const uf = new UnionFind();

        // Kruskal算法打通墙
        for (let e of edges) {
            const ka = e.a[0] + ',' + e.a[1];
            const kb = e.b[0] + ',' + e.b[1];
            if (uf.find(ka) !== uf.find(kb)) {
                maze.set(e.wallRow, e.wallCol, 1);
                uf.union(ka, kb);
            }
        }

        return maze;
    }

    /**
     * 添加小房间
     */
    private static addSmallRooms(maze: Maze, rng: Supplier<number>) {
        const size = maze.getSize();
        const numSmallRooms = 6 + Math.floor(rng() * 8);

        for (let i = 0; i < numSmallRooms; i++) {
            let w = 3 + Math.floor(rng() * 4);
            let h = 3 + Math.floor(rng() * 4);
            let x = 2 + Math.floor(rng() * (size - w - 4));
            let y = 2 + Math.floor(rng() * (size - h - 4));

            // 挖空房间区域
            for (let ry = y; ry < y + h; ry++) {
                for (let rx = x; rx < x + w; rx++) {
                    if (ry > 0 && ry < size - 1 && rx > 0 && rx < size - 1) {
                        maze.set(ry, rx, 1);
                    }
                }
            }

            // 随机打通几个出口
            for (let tries = 0; tries < 4; tries++) {
                let doorX = x + Math.floor(rng() * w);
                let doorY = y + Math.floor(rng() * h);
                let dir = Math.floor(rng() * 4);

                if (dir === 0 && doorY > 2) {
                    maze.set(doorY - 1, doorX, 1);
                }
                if (dir === 1 && doorY < size - 2) {
                    maze.set(doorY + 1, doorX, 1);
                }
                if (dir === 2 && doorX > 2) {
                    maze.set(doorY, doorX - 1, 1);
                }
                if (dir === 3 && doorX < size - 2) {
                    maze.set(doorY, doorX + 1, 1);
                }
            }
        }

        return maze;
    }

    /**
     * 创建Boss大厅（第5层）
     */
    private static createBossHall(maze: Maze) {
        const size = maze.getSize();

        // 清空中央区域
        for (let y = 8; y < size - 8; y++) {
            for (let x = 8; x < size - 8; x++) {
                maze.set(y, x, 1);
            }
        }

        // 添加两排柱子
        for (let y = 12; y < size - 12; y += 5) {
            for (let x = 12; x < size - 12; x += 5) {
                if (Math.abs(y - x) < 8 || Math.abs(y + x - size) < 8) {
                    maze.set(y, x, 0); // 柱子
                    if (y + 1 < size - 1) {
                        maze.set(y + 1, x, 0);
                    }
                    if (x + 1 < size - 1) {
                        maze.set(y, x + 1, 0);
                    }
                }
            }
        }

        return maze;
    }

    /**
     * 设置边界墙
     */
    private static setBoundaryWalls(maze: Maze) {
        const size = maze.getSize();
        for (let i = 0; i < size; i++) {
            maze.set(0, i, 0);
            maze.set(size - 1, i, 0);
            maze.set(i, 0, 0);
            maze.set(i, size - 1, 0);
        }
    }

    /**
     * 放置物品、事件和楼梯
     */
    public static placeItemsAndEvents(maze: Maze, level: number, rng: Supplier<number>) {
        const free = this.getFreeCells(maze);
        shuffleArray(free, rng);

        // 放置道具（剑、盾、血药）
        const itemCount = 3 + level + Math.floor(rng() * 4);
        for (let i = 0; i < itemCount && i < free.length; i++) {
            const type = Math.floor(rng() * 3) + 2; // 2,3,4
            maze.set(free[i][0], free[i][1], type);
        }

        // 放置随机事件
        const eventCount = 2 + Math.floor(rng() * 4);
        for (let i = 0; i < eventCount && i + itemCount < free.length; i++) {
            const [r, c] = free[i + itemCount];
            maze.set(r, c, 6);
        }

        return maze;
    }

    /**
     * 放置楼梯
     */
    public static placeStairs(maze: Maze, rng: Supplier<number>) {
        let free = this.getFreeCells(maze);
        free = free.filter(([r, c]) => !(r === 1 && c === 1));
        shuffleArray(free, rng);

        if (free.length > 0) {
            const [r, c] = free[0];
            maze.set(r, c, 7); // 楼梯
            return {maze, stairsPos: {row: r, col: c}};
        }

        return {maze, stairsPos: {row: 38, col: 38}};
    }

    /**
     * 获取所有可走的路
     */
    private static getFreeCells(maze: Maze) {
        const size = maze.getSize();
        const free = [];

        for (let r = 1; r < size - 1; r++) {
            for (let c = 1; c < size - 1; c++) {
                if (maze.get(r, c) === 1) {
                    free.push([r, c]);
                }
            }
        }
        return free;
    }
}
