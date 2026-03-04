/**
 * 日志系统模块
 * 管理游戏日志的添加和显示
 */

class LogSystem {
    constructor(logElement) {
        this.logElement = logElement;
        this.maxEntries = 50;
    }

    /**
     * 添加日志条目
     */
    add(message, type = 'normal') {
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
    clear() {
        this.logElement.innerHTML = '<div class="log-entry">🎮 游戏开始</div>';
    }

    /**
     * 添加战斗日志
     */
    addFight(message) {
        this.add(message, 'fight');
    }

    /**
     * 添加道具日志
     */
    addItem(message) {
        this.add(message, 'item');
    }

    /**
     * 添加事件日志
     */
    addEvent(message) {
        this.add(message, 'event');
    }

    /**
     * 添加楼梯日志
     */
    addStairs(message) {
        this.add(message, 'stairs');
    }

    /**
     * 添加AI日志
     */
    addAI(message) {
        this.add(message, 'ai');
    }
}
