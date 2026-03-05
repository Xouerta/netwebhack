/**
 * 种子处理模块
 * 负责种子的规范化、哈希和随机数流生成
 */
import {RNG} from "../utils/rng.ts";

export const Seed = {
    /**
     * 格式化种子为 XXXX-XXXX-XXXX 格式
     */
    format(p1: string, p2: string, p3: string) {
        return p1.toUpperCase().padEnd(4, 'A').slice(0, 4) + '-' +
            p2.toUpperCase().padEnd(4, 'A').slice(0, 4) + '-' +
            p3.toUpperCase().padEnd(4, 'A').slice(0, 4);
    },

    /**
     * 规范化用户输入的种子
     */
    normalize(raw: string) {
        let cleaned = raw.replace(/[^a-zA-Z0-9\-]/g, '').toUpperCase();
        let parts = cleaned.split('-').filter(p => p.length > 0);
        if (parts.length === 0) return "AI-GROW-5LVL";

        let segs = ["", "", ""];
        for (let i = 0; i < Math.min(parts.length, 3); i++) {
            segs[i] = parts[i];
        }

        return this.format(segs[0] || "A", segs[1] || "A", segs[2] || "A");
    },

    /**
     * 将种子字符串哈希为整数
     */
    hash(seedStr: string) {
        let h = 0;
        for (let i = 0; i < seedStr.length; i++) {
            h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
        }
        return Math.abs(h) + 1;
    },

    /**
     * 从种子创建多个独立的随机数生成器
     * 用于迷宫、物品、怪物、事件等不同系统
     */
    createRNGs(seedStr: string) {
        const baseHash = this.hash(seedStr);
        return {
            maze: RNG.create(baseHash),
            goal: RNG.create(baseHash + 11111),
            item: RNG.create(baseHash + 22222),
            monster: RNG.create(baseHash + 33333),
            event: RNG.create(baseHash + 44444)
        };
    }
};
