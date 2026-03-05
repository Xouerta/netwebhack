/**
 * 弹窗管理器模块
 * 管理所有弹窗的显示和交互
 */

class ModalManager {
    constructor() {
        this.eventModal = document.getElementById('eventModal');
        this.confirmModal = document.getElementById('confirmModal');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.dropItemModal = document.getElementById('dropItemModal');

        this.modalTitle = document.getElementById('eventTitle');
        this.modalDesc = document.getElementById('eventDesc');
        this.modalButtons = document.getElementById('eventButtons');
        this.confirmMessage = document.getElementById('confirmMessage');

        this.confirmYes = document.getElementById('confirmYes');
        this.confirmNo = document.getElementById('confirmNo');

        this.dropItemList = document.getElementById('dropItemList');
        this.dropItemConfirm = document.getElementById('dropItemConfirm');
        this.dropItemCancel = document.getElementById('dropItemCancel');

        this.eventCallback = null;
        this.confirmCallback = null;

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
                    this.eventCallback = null;
                }
            }
            if (e.target === this.confirmModal) {
                this.confirmModal.style.display = 'none';
                if (this.confirmCallback) {
                    this.confirmCallback(false);
                    this.confirmCallback = null;
                }
            }
            if (e.target === this.dropItemModal) {
                this.dropItemModal.style.display = 'none';
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
                if (this.eventCallback) {
                    this.eventCallback('continue');
                    this.eventCallback = null;
                }
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
            if (this.confirmCallback) {
                this.confirmCallback(true);
                this.confirmCallback = null;
            }
        };

        this.confirmNo.onclick = () => {
            this.confirmModal.style.display = 'none';
            if (this.confirmCallback) {
                this.confirmCallback(false);
                this.confirmCallback = null;
            }
        };

        this.confirmModal.style.display = 'flex';
    }

    /**
     * 显示丢弃物品弹窗
     * @param {Array} inventory - 背包物品数组
     * @param {Function} onDrop - 丢弃回调函数，接收物品索引
     */
    showDropItemModal(inventory, onDrop) {
        if (!this.dropItemModal) {
            console.error('丢弃物品弹窗元素不存在');
            return;
        }

        this.dropItemList.innerHTML = '';

        if (inventory.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'drop-item-empty';
            emptyMsg.textContent = '背包空空如也';
            this.dropItemList.appendChild(emptyMsg);
        } else {
            inventory.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'drop-item';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = this._getItemDisplayName(item.type);

                const dropBtn = document.createElement('button');
                dropBtn.className = 'drop-btn';
                dropBtn.textContent = '丢弃';
                dropBtn.onclick = () => {
                    onDrop(index);
                    this.dropItemModal.style.display = 'none';
                };

                itemDiv.appendChild(nameSpan);
                itemDiv.appendChild(dropBtn);
                this.dropItemList.appendChild(itemDiv);
            });
        }

        // 设置取消按钮
        this.dropItemCancel.onclick = () => {
            this.dropItemModal.style.display = 'none';
        };

        // 设置确认按钮（可选，可以直接点击物品旁边的丢弃按钮）
        if (this.dropItemConfirm) {
            this.dropItemConfirm.onclick = () => {
                this.dropItemModal.style.display = 'none';
            };
        }

        this.dropItemModal.style.display = 'flex';
    }

    /**
     * 显示拾取确认弹窗
     * @param {string} itemType - 物品类型
     * @param {Function} onConfirm - 确认回调
     * @param {Function} onCancel - 取消回调
     */
    showPickupConfirmModal(itemType, onConfirm, onCancel) {
        const itemName = this._getItemDisplayName(itemType);
        this.showConfirmModal(
            `是否拾取 ${itemName}？\n(按回车确认，按ESC取消)`,
            (confirmed) => {
                if (confirmed) {
                    onConfirm();
                } else {
                    onCancel();
                }
            }
        );
    }

    /**
     * 获取物品显示名称
     */
    _getItemDisplayName(itemType) {
        const names = {
            'sword': '🗡️ 剑',
            'shield': '🛡️ 盾',
            'potion': '🧴 血药',
            'big': '👾 大怪',
            'small': '👾 小怪',
            'boss': '👑 Boss'
        };
        return names[itemType] || itemType;
    }

    /**
     * 显示游戏结束弹窗
     */
    showGameOverModal(score, isVictory) {
        // 假设 ScoreSystem 是全局可用的
        if (window.ScoreSystem) {
            ScoreSystem.updateModal(score, isVictory);
        } else {
            console.error('ScoreSystem not found');
        }
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
        if (this.dropItemModal) {
            this.dropItemModal.style.display = 'none';
        }
    }
}

// 确保 ScoreSystem 可用
if (typeof ScoreSystem === 'undefined') {
    console.warn('ScoreSystem not loaded yet');
}
