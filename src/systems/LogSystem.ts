/**
 * 日志系统模块
 * 管理游戏日志的添加和显示
 */

export class LogSystem {
    private readonly logElement: HTMLElement;
    private readonly maxEntries: number;

    public constructor(logElement: HTMLElement) {
        this.logElement = logElement;
        this.maxEntries = 50;
    }

    /**
     * 添加日志条目
     */
    public add(message: string, type = 'normal') {
        const entry = document.createElement('div');
        entry.className = 'log-entry ' + type;
        entry.textContent = message;

        this.logElement.appendChild(entry);
        this.logElement.scrollTop = this.logElement.scrollHeight;

        // 限制日志条数
        while (this.logElement.children.length > this.maxEntries) {
            this.logElement.removeChild(this.logElement.children[0]);
        }
    }

    /**
     * 清空日志
     */
    public clear() {
        this.logElement.innerHTML = '<div class="log-entry">🎮 游戏开始</div>';
    }

    /**
     * 添加战斗日志
     */
    public addFight(message: string) {
        this.add(message, 'fight');
    }

    /**
     * 添加道具日志
     */
    public addItem(message: string) {
        this.add(message, 'item');
    }

    /**
     * 添加事件日志
     */
    public addEvent(message: string) {
        this.add(message, 'event');
    }

    /**
     * 添加楼梯日志
     */
    public addStairs(message: string) {
        this.add(message, 'stairs');
    }

    /**
     * 添加AI日志
     */
    public addAI(message: string) {
        this.add(message, 'ai');
    }
}
