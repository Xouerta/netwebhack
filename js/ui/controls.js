/**
 * 键盘控制模块
 * 处理玩家移动和键盘事件
 */

class Controls {
    constructor(game) {
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
    _handleKeyDown(e) {
        const key = e.key;

        // 方向键处理
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            e.preventDefault();

            if (this.game._cannotAct()) return;

            let dr = 0, dc = 0;
            if (key === 'ArrowUp') dr = -1;
            else if (key === 'ArrowDown') dr = 1;
            else if (key === 'ArrowLeft') dc = -1;
            else if (key === 'ArrowRight') dc = 1;

            this.game.movePlayer(dr, dc);
        }

        // 回车键拾取物品
        else if (key === 'Enter') {
            e.preventDefault();
            console.log('Enter key pressed'); // 调试用
            if (this.game._cannotAct()) {
                console.log('Cannot act'); // 调试用
                return;
            }
            const result = this.game.pickupCurrentItem();
            console.log('Pickup result:', result); // 调试用
        }

        // 数字键使用物品（1-3）
        else if (key >= '1' && key <= '3') {
            e.preventDefault();
            if (this.game._cannotAct()) return;

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
            if (this.game._cannotAct()) return;
            this.game.openDropItemModal();
        }
    }
}
