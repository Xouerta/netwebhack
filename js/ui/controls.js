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
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

        e.preventDefault();

        if (this.game.gameWin || this.game.gameOver || this.game.waitingForEvent) return;

        let dr = 0, dc = 0;
        if (key === 'ArrowUp') dr = -1;
        else if (key === 'ArrowDown') dr = 1;
        else if (key === 'ArrowLeft') dc = -1;
        else if (key === 'ArrowRight') dc = 1;

        this.game.movePlayer(dr, dc);
    }

    /**
     * 禁用键盘控制
     */
    disable() {
        // 可以通过移除监听来实现，但为了简单，我们在game中通过条件判断
    }

    /**
     * 启用键盘控制
     */
    enable() {
        // 启用
    }
}
