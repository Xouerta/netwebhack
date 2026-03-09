/**
 * 背包UI组件
 * 管理左侧背包栏的显示和交互
 */
import type {Game} from "../core/Game.ts";
import type {Inventory} from "../inventory/Inventory.ts";

export class InventoryUI {
    private readonly container: HTMLElement;
    public game: Game;
    public slots: string[];

    private itemList: HTMLElement | null = null;
    private spaceSpan: HTMLElement | null = null;

    public constructor(containerId: string, game: Game) {
        this.container = document.getElementById(containerId)!;
        if (!this.container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }

        this.game = game;
        this.slots = [];

        this.createInventoryUI();
    }

    /**
     * 创建背包UI
     */
    private createInventoryUI() {
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
        shortcutHint.innerHTML = '1:血药 2:剑 3:盾 Q:丢弃';
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
        dropBtn.innerHTML = '🗑️ 丢弃 (Q)';
        dropBtn.onclick = () => this.game.openDropItemModal();

        buttonArea.appendChild(usePotionBtn);
        buttonArea.appendChild(useSwordBtn);
        buttonArea.appendChild(useShieldBtn);
        buttonArea.appendChild(dropBtn);

        this.container.appendChild(buttonArea);

        // 保存引用
        this.itemList = itemList;
        this.spaceSpan = document.getElementById('inventorySpace')!;
    }

    /**
     * 更新背包显示
     */
    public updateInventory(inventory: Inventory) {
        if (!this.itemList || !this.spaceSpan) return;

        const items = inventory.getItems();
        this.itemList.innerHTML = '';
        this.spaceSpan.innerText = items.length + '/10';

        if (items.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'inventory-empty';
            emptyMsg.textContent = '空空如也';
            this.itemList.appendChild(emptyMsg);
            return;
        }

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `${item.icon} ${item.displayName}`;
            this.itemList?.appendChild(itemDiv);
        });
    }
}
