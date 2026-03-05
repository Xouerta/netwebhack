/**
 * 键盘控制模块
 * 处理玩家移动和键盘事件
 */
import type {Game} from "../core/Game.ts";

export class Controls {
    private readonly game: Game;

    constructor(game: Game) {
        this.game = game;
        this._setupKeyboard();
    }

    /**
     * 设置键盘监听
     */
    _setupKeyboard() {
        window.addEventListener('keydown', (e) => this._handleKeyDown(e));
    }

    /**
     * 处理键盘事件
     */
    _handleKeyDown(e: KeyboardEvent) {
        const key = e.code;

        // 方向键处理
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyD', 'KeyA'].includes(key)) {
            e.preventDefault();

            if (this.game.cannotAct()) return;

            let dr = 0, dc = 0;
            if (key === 'ArrowUp' || key === 'KeyW') dr = -1;
            else if (key === 'ArrowDown' || key === 'KeyS') dr = 1;
            else if (key === 'ArrowLeft' || key === 'KeyA') dc = -1;
            else if (key === 'ArrowRight' || key === 'KeyD') dc = 1;

            this.game.movePlayer(dr, dc);
        }

        // 回车键拾取物品
        else if (key === 'Enter' || key === 'NumpadEnter') {
            e.preventDefault();
            console.log('Enter key pressed'); // 调试用
            if (this.game.cannotAct()) {
                console.log('Cannot act'); // 调试用
                return;
            }
            const result = this.game.pickupCurrentItem();
            console.log('Pickup result:', result); // 调试用
        }

        // 数字键使用物品（1-3）
        else if (key >= '1' && key <= '3') {
            e.preventDefault();
            if (this.game.cannotAct()) return;

            const num = parseInt(key);
            // 1: 血药, 2: 剑, 3: 盾
            if (num === 1) {
                this.game.usePotion();
            } else if (num === 2) {
                this.game.useSword();
            } else if (num === 3) {
                this.game.useShield();
            }
        }

        // D键打开丢弃物品界面
        else if (key === 'd' || key === 'D') {
            e.preventDefault();
            if (this.game.cannotAct()) return;
            this.game.openDropItemModal();
        }
    }
}
