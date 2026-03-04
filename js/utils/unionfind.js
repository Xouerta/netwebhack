/**
 * 并查集模块
 * 用于迷宫生成时的连通性判断
 */

class UnionFind {
    constructor() {
        this.parent = new Map();
    }

    /**
     * 查找根节点（路径压缩）
     */
    find(key) {
        if (!this.parent.has(key)) {
            this.parent.set(key, key);
        }
        if (this.parent.get(key) !== key) {
            this.parent.set(key, this.find(this.parent.get(key)));
        }
        return this.parent.get(key);
    }

    /**
     * 合并两个集合
     */
    union(a, b) {
        const ra = this.find(a);
        const rb = this.find(b);
        if (ra !== rb) {
            this.parent.set(ra, rb);
        }
    }

    /**
     * 检查两个节点是否连通
     */
    connected(a, b) {
        return this.find(a) === this.find(b);
    }
}
