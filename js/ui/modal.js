/**
 * 弹窗管理器模块
 * 管理所有弹窗的显示和交互
 */

class ModalManager {
    constructor() {
        this.eventModal = document.getElementById('eventModal');
        this.confirmModal = document.getElementById('confirmModal');
        this.gameOverModal = document.getElementById('gameOverModal');

        this.modalTitle = document.getElementById('eventTitle');
        this.modalDesc = document.getElementById('eventDesc');
        this.modalButtons = document.getElementById('eventButtons');
        this.confirmMessage = document.getElementById('confirmMessage');

        this.confirmYes = document.getElementById('confirmYes');
        this.confirmNo = document.getElementById('confirmNo');

        this._setupEventListeners();
    }

    /**
     * 设置弹窗事件监听
     */
    _setupEventListeners() {
        window.onclick = (e) => {
            if (e.target === this.eventModal) {
                this.eventModal.style.display = 'none';
                if (this.eventCallback) {
                    this.eventCallback('continue');
                }
            }
            if (e.target === this.confirmModal) {
                this.confirmModal.style.display = 'none';
                if (this.confirmCallback) {
                    this.confirmCallback(false);
                }
            }
        };
    }

    /**
     * 显示事件弹窗
     */
    showEventModal(title, desc, options) {
        this.modalTitle.innerText = title;
        this.modalDesc.innerText = desc;

        this.modalButtons.innerHTML = '';
        options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'modal-btn' + (idx === 0 ? '' : ' negative');
            btn.innerText = opt.text;
            btn.onclick = () => {
                opt.onClick();
                this.eventModal.style.display = 'none';
            };
            this.modalButtons.appendChild(btn);
        });

        this.eventModal.style.display = 'flex';
    }

    /**
     * 显示确认弹窗
     */
    showConfirmModal(message, callback) {
        this.confirmMessage.innerText = message;
        this.confirmCallback = callback;

        this.confirmYes.onclick = () => {
            this.confirmModal.style.display = 'none';
            callback(true);
        };

        this.confirmNo.onclick = () => {
            this.confirmModal.style.display = 'none';
            callback(false);
        };

        this.confirmModal.style.display = 'flex';
    }

    /**
     * 显示游戏结束弹窗
     */
    showGameOverModal(score, isVictory) {
        ScoreSystem.updateModal(score, isVictory);
        this.gameOverModal.style.display = 'flex';
    }

    /**
     * 关闭游戏结束弹窗
     */
    closeGameOverModal() {
        this.gameOverModal.style.display = 'none';
    }

    /**
     * 隐藏所有弹窗
     */
    hideAll() {
        this.eventModal.style.display = 'none';
        this.confirmModal.style.display = 'none';
        this.gameOverModal.style.display = 'none';
    }
}
