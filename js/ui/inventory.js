/**
 * 背包UI组件
 * 管理左侧背包栏的显示和交互
 */

class InventoryUI {
    constructor(containerId, game) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }

        this.game = game;
        this.slots = [];

        this._createInventoryUI();
    }

    /**
     * 创建背包UI
     */
    _createInventoryUI() {
        this.container.innerHTML = '';
        this.container.className = 'inventory-panel';

        // 标题
        const title = document.createElement('div');
        title.className = 'inventory-title';
        title.innerHTML = '🎒 背包 <span id="inventorySpace">0/10</span>';
        this.container.appendChild(title);

        // 物品列表
        const itemList = document.createElement('div');
        itemList.className = 'inventory-items';
        itemList.id = 'inventoryItems';
        this.container.appendChild(itemList);

        // 快捷栏提示
        const shortcutHint = document.createElement('div');
        shortcutHint.className = 'inventory-hint';
        shortcutHint.innerHTML = '1:血药 2:剑 3:盾 D:丢弃';
        this.container.appendChild(shortcutHint);

        // 使用按钮区域
        const buttonArea = document.createElement('div');
        buttonArea.className = 'inventory-buttons';

        const usePotionBtn = document.createElement('button');
        usePotionBtn.className = 'inventory-btn';
        usePotionBtn.innerHTML = '🧴 喝药 (1)';
        usePotionBtn.onclick = () => this.game.usePotion();

        const useSwordBtn = document.createElement('button');
        useSwordBtn.className = 'inventory-btn';
        useSwordBtn.innerHTML = '🗡️ 用剑 (2)';
        useSwordBtn.onclick = () => this.game.useSword();

        const useShieldBtn = document.createElement('button');
        useShieldBtn.className = 'inventory-btn';
        useShieldBtn.innerHTML = '🛡️ 用盾 (3)';
        useShieldBtn.onclick = () => this.game.useShield();

        const dropBtn = document.createElement('button');
        dropBtn.className = 'inventory-btn drop';
        dropBtn.innerHTML = '🗑️ 丢弃 (D)';
        dropBtn.onclick = () => this.game.openDropItemModal();

        buttonArea.appendChild(usePotionBtn);
        buttonArea.appendChild(useSwordBtn);
        buttonArea.appendChild(useShieldBtn);
        buttonArea.appendChild(dropBtn);

        this.container.appendChild(buttonArea);

        // 保存引用
        this.itemList = itemList;
        this.spaceSpan = document.getElementById('inventorySpace');
    }

    /**
     * 更新背包显示
     */
    updateInventory(inventory) {
        if (!this.itemList || !this.spaceSpan) return;

        this.itemList.innerHTML = '';

        const space = this.game.state.player.getInventorySpace();
        this.spaceSpan.innerText = inventory.length + '/10';

        if (inventory.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'inventory-empty';
            emptyMsg.textContent = '空空如也';
            this.itemList.appendChild(emptyMsg);
            return;
        }

        inventory.forEach((item) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';

            const icon = this._getItemIcon(item.type);
            const name = this._getItemName(item.type);

            itemDiv.innerHTML = `${icon} ${name}`;
            this.itemList.appendChild(itemDiv);
        });
    }

    /**
     * 获取物品图标
     */
    _getItemIcon(type) {
        const icons = {
            'sword': '🗡️',
            'shield': '🛡️',
            'potion': '🧴'
        };
        return icons[type] || '📦';
    }

    /**
     * 获取物品名称
     */
    _getItemName(type) {
        const names = {
            'sword': '剑',
            'shield': '盾',
            'potion': '血药'
        };
        return names[type] || type;
    }
}
