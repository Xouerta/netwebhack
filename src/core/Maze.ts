export class Maze {
    private readonly map: Uint8Array<ArrayBuffer>;
    private readonly size: number;

    public constructor(size: number) {
        this.map = new Uint8Array(size * size);
        this.size = size;
    }

    public set(row: number, col: number, value: number) {
        this.map[row * this.size + col] = value;
    }

    public get(row: number, col: number) {
        return this.map[row * this.size + col];
    }

    public change(maze: Maze) {
        this.map.set(maze.map);
        if (maze.map.length < this.map.length) {
            this.map.fill(0, maze.map.length);
        }
    }

    public reset(): void {
        this.map.fill(0);
    }

    public getSize() {
        return this.size;
    }
}