import {LogSystem} from "./systems/LogSystem.ts";
import {Game} from "./core/Game.ts";
import {Renderer} from "./ui/Renderer.ts";
import {ModalManager} from "./ui/Modal.ts";
import {InventoryUI} from "./ui/InventoryUi.ts";

document.addEventListener('DOMContentLoaded', () => {
    // 初始化各个模块
    const renderer = new Renderer(document.getElementById('gameCanvas') as HTMLCanvasElement, 25);
    const modalManager = new ModalManager();
    const logSystem = new LogSystem(document.getElementById('logContent')!);
    const game = new Game();

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
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const p = () => chars[Math.floor(Math.random() * chars.length)];
        const seed = `${p()}${p()}${p()}${p()}-${p()}${p()}${p()}${p()}-${p()}${p()}${p()}${p()}`;

        const input = document.getElementById('seedInput') as HTMLInputElement;
        input.value = seed;
        game.loadWorld(seed);
    });

    document.getElementById('resetGame')!.addEventListener('click', () => {
        game.resetPlayer();
    });

    // 全局关闭弹窗函数
    window.onclose = () => {
        modalManager.closeGameOverModal();
    };

    // 加载默认世界
    game.loadWorld('BAG-5LVL-001');
}, {once: true});
