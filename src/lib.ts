import {SoundSystem} from "./systems/SoundSystem.ts";
import {Game} from "./core/Game.ts";
import {Renderer} from "./render/Renderer.ts";
import {ModalManager} from "./render/Modal.ts";
import {LogSystem} from "./systems/LogSystem.ts";
import {InventoryUI} from "./render/InventoryUi.ts";
import {Seed} from "./core/Seed.ts";

export async function run() {
    await SoundSystem.init();

    const game = new Game();
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const renderer = new Renderer(canvas, game.state.size, 25);
    const modalManager = new ModalManager();
    const logSystem = new LogSystem(document.getElementById('logContent')!);

    // 初始化背包UI
    const inventoryUI = new InventoryUI('inventoryContainer', game);

    // 注入依赖
    game.init(renderer, modalManager, logSystem, inventoryUI);

    // 绑定UI按钮事件
    document.getElementById('applySeed')!.addEventListener('click', () => {
        const input = document.getElementById('seedInput') as HTMLInputElement;
        const seed = input.value.trim();
        game.loadWorld(seed);
    });

    document.getElementById('randomSeed')!.addEventListener('click', () => {
        game.loadWorld(genSeed());
    });

    document.getElementById('resetGame')!.addEventListener('click', () => {
        game.resetPlayer();
    });

    // 全局关闭弹窗函数
    document.getElementById('close-game-overlay')!.addEventListener('click', () => {
        modalManager.closeGameOverModal();
    });

    // 加载默认世界
    game.loadWorld(genSeed());
}

function genSeed() {
    const seed = Seed.generate();
    const input = document.getElementById('seedInput') as HTMLInputElement;
    input.value = seed;
    return seed;
}