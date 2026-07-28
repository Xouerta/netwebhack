import type {Game} from "../core/Game.ts";

export class Controls {
    private readonly game: Game;
    private readonly moveKeys = new Set<string>(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyD', 'KeyA']);

    public constructor(game: Game) {
        this.game = game;
        this.setupKeyboard();
    }

    /**
     * 设置键盘监听
     */
    private setupKeyboard() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * 处理键盘事件
     */
    private handleKeyDown(event: KeyboardEvent) {
        const key = event.code;

        // 方向键处理
        if (this.moveKeys.has(key)) {
            event.preventDefault();

            if (this.game.cannotAct()) return;

            let dr = 0, dc = 0;
            if (key === 'ArrowUp' || key === 'KeyW') dr = -1;
            else if (key === 'ArrowDown' || key === 'KeyS') dr = 1;
            else if (key === 'ArrowLeft' || key === 'KeyA') dc = -1;
            else if (key === 'ArrowRight' || key === 'KeyD') dc = 1;

            this.game.movePlayer(dr, dc);
            return;
        }

        // 回车键拾取物品
        if (key === 'Enter' || key === 'NumpadEnter') {
            event.preventDefault();
            if (this.game.cannotAct()) return;
            this.game.pickupCurrentItem();
            return;
        }

        // 数字键使用物品（1-3）
        if (event.key >= '1' && event.key <= '3') {
            event.preventDefault();
            if (this.game.cannotAct()) return;

            // 1: 血药, 2: 剑, 3: 盾
            if (event.key === '1') {
                this.game.usePotion();
            } else if (event.key === '2') {
                this.game.useSword();
            } else if (event.key === '3') {
                this.game.useShield();
            }
            return;
        }

        // D键打开丢弃物品界面
        if (key === 'KeyQ') {
            event.preventDefault();
            if (this.game.cannotAct()) return;
            this.game.openDropItemModal();
            return;
        }
    }
}
