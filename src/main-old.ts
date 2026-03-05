// ---------- 配置 ----------
import {createRNG, normalizeSeed, seedHash} from "./utils/math.ts";
import {UnionFind} from "./utils/UnionFind.ts";
import {NbtCompound} from "./nbt/element/NbtCompound.ts";
import {DataBase} from "./database/DataBase.ts";
import {NbtUnserialization} from "./nbt/NbtUnserialization.ts";
import {NbtTypes} from "./nbt/NbtTypes.ts";

const SIZE = 50;
const CELL_SIZE = 20;  // 1000/50 = 20
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const sound = new Audio();
sound.src = '/sound/hurt.ogg';
const seedInput = document.getElementById('seedInput') as HTMLInputElement;
const hpSpan = document.getElementById('hpDisplay')!;
const atkSpan = document.getElementById('atkDisplay')!;
const defSpan = document.getElementById('defDisplay')!;
const monsterCountSpan = document.getElementById('monsterCount')!;

interface Pos {
    row: number;
    col: number;
}

interface Entity {
    row: number;
    col: number;
    hp: number;
    atk: number;
    def: number;
}

interface PlayerEntity extends Entity {
    maxHp: number;
}

interface MobEntity extends Entity {
    type: 'big' | 'small';
    id: number;
}

// 地形定义: 0墙, 1路, 2剑, 3盾, 4血药, 5终点, 10+ 怪物(小), 20+ 怪物(大) (存储时用对象数组单独管理)
let maze: Uint8Array;

// 玩家属性
let mainPlayer: PlayerEntity = {
    row: 1, col: 1,
    hp: 5, maxHp: 5,
    atk: 1,
    def: 1
};

// 终点位置 (随机但保证可达)
let goalPos: Pos = {row: SIZE - 2, col: SIZE - 2};

// 怪物数组
let monsters: MobEntity[] = [];
const MAX_MONSTERS = 8;

// 已拾取物品
const collectedItems: number[] = [];

// 种子相关
let currentSeed = "K18-M7B-X9Z";

// 防止重复移动标记
let gameOver = false;
let gameWin = false;
let loading = false;

// ---------- 工具函数 ----------
function getCell(array: Uint8Array, row: number, col: number): number {
    return array[row * SIZE + col];
}

function setCell(array: Uint8Array, row: number, col: number, value: number): void {
    array[row * SIZE + col] = value;
}

// ---------- 迷宫生成 (保证从(1,1)到所有内部节点连通) ----------
function generateConnectedMaze(rngFunc: () => number) {
    const grid = new Uint8Array(SIZE * SIZE);
    // 所有奇行奇列初始为路
    for (let r = 1; r < SIZE - 1; r += 2) {
        for (let c = 1; c < SIZE - 1; c += 2) {
            setCell(grid, r, c, 1);
        }
    }
    // 收集墙
    const edges = [];
    // 水平
    for (let r = 1; r < SIZE - 1; r += 2) {
        for (let c = 1; c < SIZE - 3; c += 2) {
            edges.push({wallRow: r, wallCol: c + 1, a: [r, c], b: [r, c + 2]});
        }
    }
    // 垂直
    for (let r = 1; r < SIZE - 3; r += 2) {
        for (let c = 1; c < SIZE - 1; c += 2) {
            edges.push({wallRow: r + 1, wallCol: c, a: [r, c], b: [r + 2, c]});
        }
    }

    // 随机打乱
    for (let i = edges.length - 1; i > 0; i--) {
        const j = Math.floor(rngFunc() * (i + 1));
        [edges[i], edges[j]] = [edges[j], edges[i]];
    }

    const uf = new UnionFind<string>();
    for (let e of edges) {
        let ka = e.a[0] + ',' + e.a[1], kb = e.b[0] + ',' + e.b[1];
        if (uf.find(ka) !== uf.find(kb)) {
            setCell(grid, e.wallRow, e.wallCol, 1);
            uf.union(ka, kb);
        }
    }
    return {grid, uf};
}

// 选择与起点连通的终点 (随机)
function pickGoal(uf: UnionFind<string>, rngFunc: () => number): Pos {
    const candidates = [];
    for (let r = 1; r < SIZE - 1; r += 2) {
        for (let c = 1; c < SIZE - 1; c += 2) {
            if (!(r === 1 && c === 1)) candidates.push([r, c]);
        }
    }
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(rngFunc() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const startKey = '1,1';
    for (let [r, c] of candidates) {
        if (uf.connected(startKey, r + ',' + c)) return {row: r, col: c};
    }

    return {row: SIZE - 2, col: SIZE - 2}; // fallback
}

// 放置道具 (剑盾血) 确保放在路上且不占终点/起点
function placeItems(grid: Uint8Array, rngFunc: () => number, goal: Pos): Uint8Array {
    const free: number[][] = [];

    for (let r = 1; r < SIZE - 1; r++) {
        for (let c = 1; c < SIZE - 1; c++) {
            if (getCell(grid, r, c) === 1 &&
                !(r === 1 && c === 1) &&
                !(r === goal.row && c === goal.col)) {
                free.push([r, c]);
            }
        }
    }
    for (let i = free.length - 1; i > 0; i--) {
        const j = Math.floor(rngFunc() * (i + 1));
        [free[i], free[j]] = [free[j], free[i]];
    }
    // 放置剑、盾、血药各1个 (可根据种子增加)
    if (free.length >= 3) {
        setCell(grid, free[0][0], free[0][1], 2);
        setCell(grid, free[1][0], free[1][1], 3);
        setCell(grid, free[2][0], free[2][1], 4);
    }
    return grid;
}

// 生成怪物 (确保在道路上, 不重叠道具/终点/起点)
function spawnMobs(baseGrid: Uint8Array, goal: Pos, rngFunc: () => number): MobEntity[] {
    const mobs: MobEntity[] = [];
    const freeCells: number[][] = [];
    for (let r = 1; r < SIZE - 1; r++) {
        for (let c = 1; c < SIZE - 1; c++) {
            if (getCell(baseGrid, r, c) === 1 &&
                !(r === 1 && c === 1) &&
                !(r === goal.row && c === goal.col)) {
                freeCells.push([r, c]);
            }
        }
    }
    // 打乱
    for (let i = freeCells.length - 1; i > 0; i--) {
        const j = Math.floor(rngFunc() * (i + 1));
        [freeCells[i], freeCells[j]] = [freeCells[j], freeCells[i]];
    }

    const monsterCount = Math.floor(rngFunc() * 5) + 4; // 4~8只
    for (let i = 0; i < monsterCount && i < freeCells.length; i++) {
        let [r, c] = freeCells[i];
        let isBig = rngFunc() < 0.3; // 30%概率大怪
        mobs.push({
            row: r, col: c,
            type: isBig ? 'big' : 'small',
            atk: isBig ? 1 + Math.floor(rngFunc() * 3) : 1 + Math.floor(rngFunc() * 2),     // 1-3 / 1-2
            def: isBig ? 2 + Math.floor(rngFunc() * 3) : 1 + Math.floor(rngFunc() * 2),     // 2-4 / 1-2
            hp: isBig ? 4 + Math.floor(rngFunc() * 3) : 2 + Math.floor(rngFunc() * 2),      // 大4-6 小2-3
            id: i
        });
    }
    return mobs;
}

// 初始化世界 (基于种子)
function loadWorld(seedStr: string) {
    const norm = normalizeSeed(seedStr);
    currentSeed = norm;
    seedInput.value = norm;

    const mainRng = createRNG(seedHash(norm));
    const {grid, uf} = generateConnectedMaze(mainRng);

    // 选择终点 (连通)
    const goalRng = createRNG(seedHash(norm) + 11111);
    goalPos = pickGoal(uf, goalRng);

    // 放置道具
    const itemRng = createRNG(seedHash(norm) + 22222);
    const finalGrid = placeItems(grid, itemRng, goalPos);

    // 标记终点
    setCell(finalGrid, goalPos.row, goalPos.col, 5);

    // 生成怪物
    const monsterRng = createRNG(seedHash(norm) + 33333);
    monsters = spawnMobs(finalGrid, goalPos, monsterRng);

    // 更新迷宫 (将怪物占用的格子标记为路，但绘制时特殊处理)
    maze = finalGrid;

    // 重置玩家
    mainPlayer = {row: 1, col: 1, hp: 5, maxHp: 5, atk: 1, def: 1};
    gameWin = false;
    gameOver = false;

    // 重置已获取
    collectedItems.length = 0;

    // 确保起点可走
    setCell(maze, 1, 1, 1);

    updateUIStats();
    draw();
}

// 更新显示属性
function updateUIStats() {
    hpSpan.innerText = mainPlayer.hp + '/' + mainPlayer.maxHp;
    atkSpan.innerText = mainPlayer.atk.toString();
    defSpan.innerText = mainPlayer.def.toString();
    monsterCountSpan.innerText = monsters.length + '/' + MAX_MONSTERS;
}

// 战斗逻辑 (玩家攻击怪物)
function fightMob(monsterIdx: number) {
    const m = monsters[monsterIdx];
    // 玩家攻击怪物
    const playerDamage = Math.max(1, mainPlayer.atk - m.def + (Math.random() < 0.2 ? 1 : 0)); // 浮动
    m.hp -= playerDamage;

    if (m.hp <= 0) {
        // 击败奖励
        let upgradeChance = m.type === 'big' ? 0.5 : 0.25;
        if (Math.random() < upgradeChance) {
            // 随机提升一项属性
            let r = Math.random();
            if (r < 0.33) mainPlayer.atk++;
            else if (r < 0.66) mainPlayer.def++;
            else {
                mainPlayer.maxHp++;
                mainPlayer.hp++;
            }
        }
        // 移除怪物
        monsters.splice(monsterIdx, 1);
        return true; // 怪物死亡
    }

    // 怪物反击
    const monsterDamage = Math.max(1, m.atk - mainPlayer.def + (Math.random() < 0.2 ? 1 : 0));
    mainPlayer.hp -= monsterDamage;
    if (mainPlayer.hp <= 0) {
        mainPlayer.hp = 0;
        gameOver = true;
    }

    sound.play().then();
    return false; // 怪物未死
}

// 玩家移动
function movePlayer(dr: number, dc: number) {
    if (gameWin || gameOver || loading) return;

    let nr = mainPlayer.row + dr;
    let nc = mainPlayer.col + dc;
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) return;
    if (getCell(maze, nr, nc) === 0) return; // 墙

    // 检查是否有怪物在此格子
    let monsterHere = monsters.findIndex(m => m.row === nr && m.col === nc);
    if (monsterHere !== -1) {
        // 进入战斗
        fightMob(monsterHere);
        updateUIStats();
        draw();
        if (gameOver) {
            alert('💔 勇者倒下了... 点击重置位置重新开始');
        }
        return; // 战斗后不移动 (留在原地)
    }

    // 移动玩家
    mainPlayer.row = nr;
    mainPlayer.col = nc;

    // 拾取物品
    const cell = getCell(maze, nr, nc);
    if (cell === 2) { // 剑
        mainPlayer.atk++;
        setCell(maze, nr, nc, 1);
        collectedItems.push(nr * SIZE + nc);
    } else if (cell === 3) { // 盾
        mainPlayer.def++;
        setCell(maze, nr, nc, 1);
        collectedItems.push(nr * SIZE + nc);
    } else if (cell === 4) { // 血药
        mainPlayer.hp = Math.min(mainPlayer.maxHp, mainPlayer.hp + 1);
        setCell(maze, nr, nc, 1);
        collectedItems.push(nr * SIZE + nc);
    } else if (cell === 5) { // 终点
        if (mainPlayer.row === goalPos.row && mainPlayer.col === goalPos.col) {
            gameWin = true;
            draw();
            alert('🎉 你到达了终点！英勇的冒险者！');
            return;
        }
    }

    // 检查胜利
    if (mainPlayer.row === goalPos.row && mainPlayer.col === goalPos.col) {
        gameWin = true;
    }

    updateUIStats();
    draw();
}

// 怪物随机移动 (每个怪物尝试向相邻路移动)
function moveMobs() {
    if (gameWin || gameOver || loading) return;

    // 方向: 上下左右
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let newMonsters = [];

    for (let m of monsters) {
        // 随机尝试移动一次
        let moved = false;
        let tries = 0;
        while (!moved && tries < 8) {
            let [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
            let nr = m.row + dr, nc = m.col + dc;
            tries++;
            // 检查是否可走 (不是墙，且没有其他怪物，且不是玩家，不是终点)
            if (nr < 1 || nr >= SIZE - 1 || nc < 1 || nc >= SIZE - 1) continue;
            if (getCell(maze, nr, nc) !== 1) continue; // 只能走路
            // 检查是否与其他怪物重叠 (原地不动则允许重叠？但我们希望不重叠)
            let occupied = monsters.some(mm => mm.row === nr && mm.col === nc) ||
                (mainPlayer.row === nr && mainPlayer.col === nc);
            if (occupied) continue;
            // 检查不是终点
            if (nr === goalPos.row && nc === goalPos.col) continue;

            m.row = nr;
            m.col = nc;
            moved = true;
        }
        // 未移动则留在原地
        newMonsters.push(m);
    }
    monsters = newMonsters;
}

// 每帧移动 (玩家移动后触发怪物移动)
function entitiesMove(dr: number, dc: number) {
    if (gameWin || gameOver || loading) return;
    movePlayer(dr, dc);
    // 玩家行动后怪物移动
    moveMobs();
    draw(); // 重绘
    // 再次检查玩家是否被怪物撞上 (移动后怪物可能走到玩家格子)
    // 简单处理：如果玩家格子有怪物，触发战斗
    let monsterIdx = monsters.findIndex(m => m.row === mainPlayer.row && m.col === mainPlayer.col);
    if (monsterIdx !== -1) {
        fightMob(monsterIdx);
        updateUIStats();
        draw();
    }
}

// 绘制
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const x = c * CELL_SIZE, y = r * CELL_SIZE;
            const cell = getCell(maze, r, c);

            // 基础地板
            if (cell === 0) { // 墙
                ctx.fillStyle = '#1d4f5a';
                ctx.fillRect(x, y, CELL_SIZE - 1, CELL_SIZE - 1);
                ctx.fillStyle = '#0d3640';
                ctx.fillRect(x + 2, y + 2, CELL_SIZE - 5, CELL_SIZE - 5);
            } else {
                ctx.fillStyle = '#b7ab99';
                ctx.fillRect(x, y, CELL_SIZE - 1, CELL_SIZE - 1);
                ctx.fillStyle = '#9a8b76';
                ctx.fillRect(x + 2, y + 2, CELL_SIZE - 5, CELL_SIZE - 5);

                // 物品绘制
                if (cell === 2) { // 剑
                    ctx.fillStyle = '#d4dbe0';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'white';
                    ctx.fillRect(x + 5, y + 5, 10, 10);
                    ctx.shadowBlur = 0;
                } else if (cell === 3) { // 盾
                    ctx.fillStyle = '#a9a9a9';
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = '#ccc';
                    ctx.beginPath();
                    ctx.arc(x + 10, y + 10, 7, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else if (cell === 4) { // 血药
                    ctx.fillStyle = '#ff6b6b';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'red';
                    ctx.beginPath();
                    ctx.arc(x + 10, y + 10, 6, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else if (cell === 5) { // 终点
                    ctx.fillStyle = 'gold';
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = 'goldenrod';
                    ctx.fillRect(x + 3, y + 3, 14, 14);
                    ctx.shadowBlur = 0;
                }
            }
            // 网格线
            ctx.strokeStyle = '#1f6d7a';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }

    // 绘制怪物
    monsters.forEach(m => {
        const x = m.col * CELL_SIZE, y = m.row * CELL_SIZE;
        ctx.fillStyle = m.type === 'big' ? '#b04545' : '#a1652c';
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'darkred';
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 2);
        ctx.lineTo(x + 15, y + 2);
        ctx.lineTo(x + 18, y + 10);
        ctx.lineTo(x + 15, y + 18);
        ctx.lineTo(x + 5, y + 18);
        ctx.lineTo(x + 2, y + 10);
        ctx.closePath();
        ctx.fill();
        // 显示血量数字
        ctx.fillStyle = 'white';
        ctx.font = 'bold 9px monospace';
        ctx.shadowBlur = 0;
        ctx.fillText('❤️' + m.hp, x + 3, y + 13);
    });

    // 绘制玩家
    const px = mainPlayer.col * CELL_SIZE, py = mainPlayer.row * CELL_SIZE;
    ctx.fillStyle = '#3bc0db';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#1f8a9c';
    ctx.beginPath();
    ctx.arc(px + 10, py + 10, 9, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillText('⚔️', px + 4, py + 15);

    // 绘制起点标记
    ctx.fillStyle = '#79c9ff66';
    ctx.beginPath();
    ctx.arc(10, 10, 4, 0, 2 * Math.PI);
    ctx.fill();

    if (gameWin) {
        ctx.fillStyle = '#ffffffcc';
        ctx.font = 'bold 30px sans-serif';
        ctx.shadowBlur = 20;
        ctx.fillText('🏆 胜利', 350, 500);
    }
    if (gameOver) {
        ctx.fillStyle = '#000000cc';
        ctx.font = 'bold 30px sans-serif';
        ctx.shadowBlur = 20;
        ctx.fillText('💔 勇者倒下了', 300, 500);
    }
}

// 重置到起点 (保留世界)
function resetPlayer() {
    if (gameOver || gameWin) {
        // 重新加载相同种子
        loadWorld(currentSeed);
    } else {
        mainPlayer.row = 1;
        mainPlayer.col = 1;
        mainPlayer.hp = mainPlayer.maxHp;
        draw();
    }
    gameOver = false;
    gameWin = false;
    updateUIStats();
}

function saveAll() {
    const root = new NbtCompound();

    root.putString('seed', currentSeed);

    root.putBoolean('gameOver', gameOver);
    root.putBoolean('gameWin', gameWin);

    root.putInt16Array('goalPos', goalPos.row, goalPos.col);

    const player = new NbtCompound();
    saveEntity(player, mainPlayer);
    player.putInt8('maxHp', mainPlayer.maxHp);
    root.putCompound('player', player);

    const mobs: NbtCompound[] = [];
    for (const mob of monsters) {
        const compound = new NbtCompound();
        saveEntity(compound, mob);
        compound.putInt8('id', mob.id);
        compound.putBoolean('type', mob.type === 'big'); // isBig ? 'big' : 'small'
        mobs.push(compound);
    }
    root.putCompoundArray('mobs', mobs);

    root.putInt16Array('collected_items', ...collectedItems);
    saveToDB(root).then();
}

function loadSave(root: NbtCompound) {
    const seed = root.getString('seed');
    loadWorld(seed);

    gameOver = root.getBoolean('gameOver');
    gameWin = root.getBoolean('gameWin');
    const [goalRow, goalCol] = root.getInt16Array('goalPos');
    goalPos = {row: goalRow, col: goalCol};

    // 恢复玩家数据
    const playerData = root.getCompound('player');
    const pPos = playerData.getInt16Array('pos');
    mainPlayer = {
        row: pPos[0],
        col: pPos[1],
        hp: playerData.getInt8('hp'),
        maxHp: playerData.getInt8('maxHp'),
        atk: playerData.getInt8('atk'),
        def: playerData.getInt8('def')
    };

    // 恢复怪物数据
    const mobsData = root.getCompoundArray('mobs');
    monsters = mobsData.map((mobData) => {
        const pos = mobData.getInt16Array('pos');
        const isBig = mobData.getBoolean('isBig');
        return {
            row: pos[0], col: pos[1],
            hp: mobData.getInt8('hp'),
            atk: mobData.getInt8('atk'),
            def: mobData.getInt8('def'),
            type: isBig ? 'big' : 'small',
            id: mobData.getInt8('id')
        };
    });

    const items = root.getInt16Array('collected_items');
    for (const index of items) {
        collectedItems.push(index);
        maze[index] = 1;
    }

    updateUIStats();
    draw();
}

async function saveToDB(compound: NbtCompound) {
    const result = await DataBase.saveGame(compound);
    result
        .map(() => alert('存档完成'))
        .mapErr(err => {
            alert('存档失败');
            console.error(err);
        })
}

async function loadFromDB() {
    const result = await DataBase.loadGame();
    result.map(data => {
        const nbt = NbtUnserialization.fromCompactBinary(data.data);
        loadSave(nbt);
    })
        .mapErr(err => {
            alert('读取失败');
            console.error(err);
        })

    loading = false;
}

function saveEntity(compound: NbtCompound, entity: Entity) {
    compound.putInt16Array('pos', entity.row, entity.col);
    compound.putInt8('hp', entity.hp);
    compound.putInt8('atl', entity.atk);
    compound.putInt8('def', entity.def);
    return compound;
}

// 键盘控制
const allowKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyP']);

let inputting = false;

function onKey(e: KeyboardEvent) {
    const key = e.code;
    if (inputting || !allowKeys.has(key)) return;

    e.preventDefault();
    if (gameWin || gameOver) return;

    if (e.ctrlKey) {
        if (key === 'KeyS') saveAll();
        else if (key === 'KeyP') {
            loading = true;
            loadFromDB().then();
        }
        return;
    }

    if (key === 'ArrowUp' || key === 'KeyW') entitiesMove(-1, 0);
    else if (key === 'ArrowDown' || key === 'KeyS') entitiesMove(1, 0);
    else if (key === 'ArrowLeft' || key === 'KeyA') entitiesMove(0, -1);
    else if (key === 'ArrowRight' || key === 'KeyD') entitiesMove(0, 1);
}

window.addEventListener('keydown', onKey);

seedInput.addEventListener('focus', () => inputting = true);
seedInput.addEventListener('blur', () => inputting = false);

// 按钮绑定
document.getElementById('applySeed')!.addEventListener('click', () => {
    loadWorld(seedInput.value.trim());
});
document.getElementById('randomSeed')!.addEventListener('click', () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let p = () => chars[Math.floor(Math.random() * chars.length)];
    let seed = `${p()}${p()}${p()}-${p()}${p()}${p()}-${p()}${p()}${p()}`;
    loadWorld(seed);
});
document.getElementById('resetGame')!.addEventListener('click', resetPlayer);

// 初始化
NbtTypes.init();
loadWorld('K18-M7B-X9Z');

