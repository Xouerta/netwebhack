/**
 * 主入口文件
 * 初始化游戏并绑定UI事件
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化各个模块
    const renderer = new Renderer(document.getElementById('gameCanvas'), 25);
    const modalManager = new ModalManager();
    const logSystem = new LogSystem(document.getElementById('logContent'));
    const game = new Game();

    // 初始化背包UI
    const inventoryUI = new InventoryUI('inventoryContainer', game);

    // 注入依赖
    game.init(renderer, modalManager, logSystem, inventoryUI);

    // 绑定UI按钮事件
    document.getElementById('applySeed').addEventListener('click', () => {
        const seed = document.getElementById('seedInput').value.trim();
        game.loadWorld(seed);
    });

    document.getElementById('randomSeed').addEventListener('click', () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const p = () => chars[Math.floor(Math.random() * chars.length)];
        const seed = `${p()}${p()}${p()}${p()}-${p()}${p()}${p()}${p()}-${p()}${p()}${p()}${p()}`;
        document.getElementById('seedInput').value = seed;
        game.loadWorld(seed);
    });

    document.getElementById('resetGame').addEventListener('click', () => {
        game.resetPlayer();
    });

    // 全局关闭弹窗函数
    window.closeGameOverModal = () => {
        modalManager.closeGameOverModal();
    };

    // 加载默认世界
    game.loadWorld('BAG-5LVL-001');
});
