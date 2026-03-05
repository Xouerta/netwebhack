/**
 * 随机事件系统模块
 * 定义所有随机事件和触发逻辑
 */
import type {PlayerEntity} from "../entity/PlayerEntity.ts";
import type {MobEntity} from "../entity/MobEntity.ts";

export const EventSystem = {
    /**
     * 事件库
     */
    events: [
        {
            title: "💀 幽灵的考验",
            desc: "一个幽灵挡住了去路，它说：'回答我，你选择力量还是生命？'",
            options: [
                {
                    text: "⚔️ 接受力量 (-1生命, +2攻击)",
                    effect: (p: PlayerEntity, m: MobEntity, log) => {
                        p.hp -= 1;
                        p.atk += 2;
                        log("💀 接受了力量，生命-1，攻击+2", 'event');
                    }
                },
                {
                    text: "🛡️ 祈求守护 (-1生命, +2防御)",
                    effect: (p, m, log) => {
                        p.hp -= 1;
                        p.def += 2;
                        log("💀 祈求守护，生命-1，防御+2", 'event');
                    }
                },
                {
                    text: "🍎 献上食物 (恢复2生命)",
                    effect: (p, m, log) => {
                        p.hp = Math.min(p.maxHp, p.hp + 2);
                        log("🍎 献上食物，生命+2", 'event');
                    }
                }
            ]
        },
        {
            title: "🕳️ 陷阱房间",
            desc: "你踩到了机关！周围怪物被惊动了...",
            options: [
                {
                    text: "🏃 快速逃离 (不改变)",
                    effect: (p, m, log) => {
                        log("🏃 快速逃离，什么都没发生", 'event');
                    }
                },
                {
                    text: "💪 摧毁陷阱 (+1攻, 但召唤1只大怪)",
                    effect: (p, m, log) => {
                        p.atk++;
                        // 召唤大怪
                        const newMonster = new Monster(
                            Date.now(), p.row, p.col, 'big', 3, 3, 5
                        );
                        m.push(newMonster);
                        log("💪 摧毁陷阱，攻击+1，但召唤了一只大怪", 'event');
                    }
                },
                {
                    text: "🔮 封印陷阱 (+1防, 随机清除一只小怪)",
                    effect: (p, m, log) => {
                        p.def++;
                        const smallMonsters = m.filter(mon => mon.type === 'small');
                        if (smallMonsters.length > 0) {
                            const idx = m.findIndex(mon => mon.type === 'small');
                            if (idx !== -1) {
                                m.splice(idx, 1);
                                log("🔮 封印陷阱，防御+1，并清除了一只小怪", 'event');
                            }
                        } else {
                            log("🔮 封印陷阱，防御+1，但没有小怪可清除", 'event');
                        }
                    }
                }
            ]
        },
        {
            title: "🧪 神秘泉水",
            desc: "你发现一汪发光的泉水，喝下它会有什么效果？",
            options: [
                {
                    text: "💙 喝一大口 (随机属性+1, 但可能中毒)",
                    effect: (p, m, log) => {
                        if (Math.random() < 0.5) {
                            p.atk++;
                            log("💙 攻击+1", 'event');
                        } else {
                            p.def++;
                            log("💙 防御+1", 'event');
                        }
                        if (Math.random() < 0.3) {
                            p.hp = Math.max(1, p.hp - 2);
                            log("😵 中毒了，生命-2", 'event');
                        }
                    }
                },
                {
                    text: "🧴 装瓶带走 (获得1瓶血药)",
                    effect: (p, m, log) => {
                        p.hp = Math.min(p.maxHp, p.hp + 1);
                        log("🧴 获得1瓶血药，生命+1", 'event');
                    }
                },
                {
                    text: "🚶 无视它",
                    effect: (p, m, log) => {
                        log("🚶 无视泉水", 'event');
                    }
                }
            ]
        },
        {
            title: "📜 古代石碑",
            desc: "石碑上刻着古老的文字：'献祭生命换取力量，或者献祭力量换取生命'",
            options: [
                {
                    text: "🩸 献祭2生命 +2攻击",
                    effect: (p, m, log) => {
                        if (p.hp > 2) {
                            p.hp -= 2;
                            p.atk += 2;
                            log("🩸 献祭2生命，攻击+2", 'event');
                        }
                    }
                },
                {
                    text: "⚡ 献祭1攻击 +2生命",
                    effect: (p, m, log) => {
                        if (p.atk > 1) {
                            p.atk--;
                            p.maxHp += 2;
                            p.hp += 2;
                            log("⚡ 献祭1攻击，生命上限+2，生命+2", 'event');
                        }
                    }
                },
                {
                    text: "🚫 离开",
                    effect: (p, m, log) => {
                        log("🚫 离开石碑", 'event');
                    }
                }
            ]
        },
        {
            title: "👥 流浪商人",
            desc: "一个神秘商人出现：'我可以帮你，但需要代价...'",
            options: [
                {
                    text: "🗡️ 买剑 (1攻击, 但花费2生命)",
                    effect: (p, m, log) => {
                        if (p.hp > 2) {
                            p.hp -= 2;
                            p.atk++;
                            log("🗡️ 购买剑，攻击+1，生命-2", 'event');
                        }
                    }
                },
                {
                    text: "🛡️ 买盾 (1防御, 但花费2生命)",
                    effect: (p, m, log) => {
                        if (p.hp > 2) {
                            p.hp -= 2;
                            p.def++;
                            log("🛡️ 购买盾，防御+1，生命-2", 'event');
                        }
                    }
                },
                {
                    text: "💰 贿赂 (随机消失一只小怪)",
                    effect: (p, m, log) => {
                        const smallMonsters = m.filter(mon => mon.type === 'small');
                        if (smallMonsters.length > 0) {
                            const idx = m.findIndex(mon => mon.type === 'small');
                            if (idx !== -1) {
                                m.splice(idx, 1);
                                log("💰 贿赂成功，一只小怪消失了", 'event');
                            }
                        } else {
                            log("💰 没有小怪可贿赂", 'event');
                        }
                    }
                }
            ]
        },
        {
            title: "🏺 古代神龛",
            desc: "一个古老的神龛，散发着神秘的光芒...",
            options: [
                {
                    text: "🙏 祈祷 (50%几率全属性+1, 50%召唤怪物)",
                    effect: (p, m, log) => {
                        if (Math.random() < 0.5) {
                            p.atk++;
                            p.def++;
                            p.maxHp++;
                            p.hp++;
                            log("🙏 祈祷应验！全属性+1", 'event');
                        } else {
                            const newMonster = new Monster(
                                Date.now(), p.row, p.col, 'big', 4, 4, 8
                            );
                            m.push(newMonster);
                            log("🙏 祈祷招来了灾祸！一只大怪出现", 'event');
                        }
                    }
                },
                {
                    text: "💰 献祭 (失去2生命, 获得1攻击1防御)",
                    effect: (p, m, log) => {
                        p.hp = Math.max(1, p.hp - 2);
                        p.atk++;
                        p.def++;
                        log("💰 献祭2生命，获得1攻击1防御", 'event');
                    }
                },
                {
                    text: "🚶 离开",
                    effect: (p, m, log) => {
                        log("🚶 离开神龛", 'event');
                    }
                }
            ]
        }
    ],

    /**
     * 获取随机事件
     */
    getRandomEvent(rng) {
        const index = Math.floor(rng() * this.events.length);
        return this.events[index];
    },

    /**
     * 触发事件
     */
    triggerEvent(modalManager, player, monsters, stats, addLog, callback) {
        const evt = this.getRandomEvent(Math.random);

        modalManager.showEventModal(
            evt.title,
            evt.desc,
            evt.options.map(opt => ({
                text: opt.text,
                onClick: () => {
                    opt.effect(player, monsters, addLog);
                    if (player.hp <= 0) {
                        callback('gameOver');
                    }
                    callback('continue');
                }
            }))
        );

        stats.eventsTriggered++;
    }
};
