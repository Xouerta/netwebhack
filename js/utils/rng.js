/**
 * 随机数生成器模块
 * 线性同余生成器 (LCG)
 */

const RNG = {
    /**
     * 创建随机数生成器
     * @param {number} seedInt - 种子整数
     * @returns {function} 返回0-1之间的随机数生成函数
     */
    create(seedInt) {
        let state = seedInt % 2147483647;
        if (state <= 0) state = 1;

        return function() {
            state = (state * 1103515245 + 12345) % 2147483647;
            return (state & 0x7fffffff) / 2147483647;
        };
    },

    /**
     * 生成随机整数 [min, max]
     */
    randInt(rng, min, max) {
        return Math.floor(rng() * (max - min + 1)) + min;
    },

    /**
     * 随机打乱数组
     */
    shuffle(rng, array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};
