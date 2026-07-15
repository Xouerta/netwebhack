/**
 * 游戏事件系统模块
 * 处理随机事件的触发和执行
 */
import type {BiConsumer, Consumer, Supplier} from "../types/types.ts";
import type {ModalManager} from "../render/Modal.ts";
import type {PlayerEntity} from "../entity/PlayerEntity.ts";
import {MobEntity} from "../entity/MobEntity.ts";
import type {Stats} from "../core/Stats.ts";
import type {GameEvent} from "./GameEvent.ts";

export class EventSystem {
    /**
     * 事件库
     */
    public static readonly EVENTS: GameEvent[] = [
        {
            title: "💀 幽灵的考验",
            desc: "一个幽灵挡住了去路，它说：'回答我，你选择力量还是生命？'",
            options: [
                {
                    text: "⚔️ 接受力量 (-1生命, +2攻击)",
                    effect: (p, _, log) => {
                        p.takeDamage(1);
                        p.atk += 2;
                        log("💀 接受了力量，生命-1，攻击+2", 'event');
                    }
                },
                {
                    text: "🛡️ 祈求守护 (-1生命, +2防御)",
                    effect: (p, _, log) => {
                        p.takeDamage(1);
                        p.def += 2;
                        log("💀 祈求守护，生命-1，防御+2", 'event');
                    }
                },
                {
                    text: "🍎 献上食物 (恢复2生命)",
                    effect: (p, _, log) => {
                        p.heal(2);
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
                    effect: (_p, _m, log) => {
                        log("🏃 快速逃离，什么都没发生", 'event');
                    }
                },
                {
                    text: "💪 摧毁陷阱 (+1攻, 但召唤1只大怪)",
                    effect: (p, m, log) => {
                        p.atk++;
                        // 召唤大怪
                        const newMonster = new MobEntity(
                            p.row, p.col, 'big', 3, 3, 5
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
                    effect: (p, _m, log) => {
                        if (Math.random() < 0.5) {
                            p.atk++;
                            log("💙 攻击+1", 'event');
                        } else {
                            p.def++;
                            log("💙 防御+1", 'event');
                        }
                        if (Math.random() < 0.3) {
                            p.takeDamage(2);
                            log("😵 中毒了，生命-2", 'event');
                        }
                    }
                },
                {
                    text: "🧴 装瓶带走 (获得1瓶血药)",
                    effect: (p, _m, log) => {
                        p.heal(1);
                        log("🧴 获得1瓶血药，生命+1", 'event');
                    }
                },
                {
                    text: "🚶 无视它",
                    effect: (_p, _m, log) => {
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
                    effect: (p, _m, log) => {
                        if (p.getHealth() > 2) {
                            p.takeDamage(2);
                            p.atk += 2;
                            log("🩸 献祭2生命，攻击+2", 'event');
                        }
                    }
                },
                {
                    text: "⚡ 献祭1攻击 +2生命",
                    effect: (p, _m, log) => {
                        if (p.atk > 1) {
                            p.atk--;
                            p.setMaxHealth(p.getMaxHealth() + 2);
                            p.heal(2);
                            log("⚡ 献祭1攻击，生命上限+2，生命+2", 'event');
                        }
                    }
                },
                {
                    text: "🚫 离开",
                    effect: (_p, _m, log) => {
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
                    text: "🗡️ 买剑 (1 攻击, 但花费 1 生命)",
                    effect: (p, _m, log) => {
                        if (p.getHealth() > 1) {
                            p.takeDamage(1);
                            p.atk++;
                            log("🗡️ 购买剑，攻击 +1，生命 -1", 'event');
                        }
                    }
                },
                {
                    text: "🛡️ 买盾 (1 防御, 但花费 1 生命)",
                    effect: (p, _m, log) => {
                        if (p.getHealth() > 1) {
                            p.takeDamage(1);
                            p.def++;
                            log("🛡️ 购买盾，防御+1，生命-1", 'event');
                        }
                    }
                },
                {
                    text: "💰 贿赂 (随机消失一只小怪)",
                    effect: (_p, m, log) => {
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
                            p.setMaxHealth(p.getMaxHealth() + 1);
                            p.heal(1);
                            log("🙏 祈祷应验！全属性+1", 'event');
                        } else {
                            const newMonster = new MobEntity(
                                p.row, p.col, 'big', 4, 4, 8
                            );
                            m.push(newMonster);
                            log("🙏 祈祷招来了灾祸！一只大怪出现", 'event');
                        }
                    }
                },
                {
                    text: "💰 献祭 (失去2生命, 获得1攻击1防御)",
                    effect: (p, _m, log) => {
                        p.takeDamage(2);
                        p.atk++;
                        p.def++;
                        log("💰 献祭2生命，获得1攻击1防御", 'event');
                    }
                },
                {
                    text: "🚶 离开",
                    effect: (_p, _m, log) => {
                        log("🚶 离开神龛", 'event');
                    }
                }
            ]
        },
        {
            title: "隐藏的房间",
            desc: "被厚重的防护门所隔离，传来不像的气息",
            options: [
                {
                    text: "离开",
                    effect: (_p, _m, log) => {
                        log('你离开了这个看起来诡异的房间', 'event');
                    }
                },
                {
                    text: "观察",
                    effect: (_p, _m, log) => {
                        log('你看着这扇门发呆, 什么也没有发生', 'event');
                    }
                },
                {
                    text: "尝试推开",
                    effect: (p, _m, log) => {
                        if (Math.random() < 0.1) {
                            p.atk++;
                            log('你使劲推, 触发了什么东西, 一把剑掉落在你身旁', 'event');
                        } else {
                            log('门太重了, 你推不开', 'event');
                        }
                    }
                },
                {
                    text: "炸了这扇破门",
                    effect: (p, m, log) => {
                        const rand = Math.random();
                        if (rand < 0.01) {
                            p.increaseMaxHp(1);
                            p.def++;
                            log('这是女神的遗迹, 你充满了决心', 'event');
                        } else if (rand < 0.6) {
                            const newMonster = new MobEntity(
                                p.row, p.col, 'small', 4, 4, 8
                            );
                            m.push(newMonster);
                            log('山体传来剧烈的震动, 一只小怪出现了', 'event');
                        } else {
                            if (p.atk > 1) p.atk--;
                            if (p.def > 1) p.def--;
                            p.increaseMaxHp(1);
                            p.takeDamage(1);
                            log('一阵古怪的香气充斥你的鼻腔...等你醒来, 你发现自己被拔得一干二净', 'event');
                        }
                    }
                }
            ]
        },
        {
            title: "🎭 命运轮盘",
            desc: "一个古老的轮盘出现在你面前，上面刻着各种符号。转动它，接受命运的裁决。",
            options: [
                {
                    text: "🎲 转动轮盘",
                    effect: (p, m, log) => {
                        const roll = Math.random();
                        if (roll < 0.3) {
                            p.atk += 2;
                            log("🎲 轮盘停止在利剑图案上！攻击力+2！", 'event');
                        } else if (roll < 0.6) {
                            p.takeDamage(2);
                            log("🎲 轮盘停止在骷髅图案上！你感到一阵剧痛，生命-2。", 'event');
                        } else {
                            const newMonster = new MobEntity(p.row, p.col, 'big', 5, 5, 10);
                            m.push(newMonster);
                            log("🎲 轮盘停止在魔物图案上！一只强大的怪物被召唤而来！", 'event');
                        }
                    }
                },
                {
                    text: "🚶 无视它",
                    effect: (_p, _m, log) => {
                        log("你决定不碰这个危险的轮盘。", 'event');
                    }
                }
            ]
        },
        {
            title: "🌿 精灵的庇护所",
            desc: "一片宁静的林地，一位森林精灵向你伸出援手。",
            options: [
                {
                    text: "✨ 寻求祝福 (恢复全部生命)",
                    effect: (p, _m, log) => {
                        const missingHealth = p.getMaxHealth() - p.getHealth();
                        p.heal(missingHealth);
                        log("✨ 精灵施展治愈魔法，你的生命值完全恢复了！", 'event');
                    }
                },
                {
                    text: "🗡️ 请求强化 (攻击+1, 防御-1)",
                    effect: (p, _m, log) => {
                        p.atk++;
                        if (p.def > 0) p.def--;
                        log("🗡️ 精灵给你的武器附魔，攻击力+1，但防御力略微下降了。", 'event');
                    }
                },
                {
                    text: "🍃 获取仙草 (获得3瓶血药)",
                    effect: (p, _m, log) => {
                        p.heal(3);
                        log("🍃 精灵给了你一些仙草，生命+3。", 'event');
                    }
                }
            ]
        },
        {
            title: "⚡ 雷电风暴",
            desc: "天空突然变得昏暗，一道闪电劈在你附近，空气中充满了电离的焦灼味。",
            options: [
                {
                    text: "🏃‍♂️ 寻找掩体",
                    effect: (p, _m, log) => {
                        if (Math.random() < 0.7) {
                            log("🏃‍♂️ 你成功找到了一个洞穴躲避，毫发无伤。", 'event');
                        } else {
                            p.takeDamage(2);
                            log("🏃‍♂️ 你没能及时躲开，被闪电余波击中，生命-2。", 'event');
                        }
                    }
                },
                {
                    text: "🔮 引导闪电 (若成功则攻击+2, 否则生命-4)",
                    effect: (p, _m, log) => {
                        if (Math.random() < 0.4) {
                            p.atk += 2;
                            log("🔮 你成功将雷电之力引导至武器上，攻击力+2！", 'event');
                        } else {
                            p.takeDamage(4);
                            log("🔮 雷电失控，直接击中了你的身体，生命-4。", 'event');
                        }
                    }
                }
            ]
        },
        {
            title: "🏚️ 废弃铁匠铺",
            desc: "一间破败的铁匠铺，但炉火似乎还未完全熄灭。你可以在里面找到一些遗留的工具。",
            options: [
                {
                    text: "⚒️ 锻造武器 (攻击+1)",
                    effect: (p, _m, log) => {
                        p.atk++;
                        log("⚒️ 你利用剩余的矿石和炉火，粗糙地强化了你的武器，攻击力+1。", 'event');
                    }
                },
                {
                    text: "🛡️ 修理护甲 (防御+1)",
                    effect: (p, _m, log) => {
                        p.def++;
                        log("🛡️ 你找到一些废弃的金属片，加固了你的护甲，防御力+1。", 'event');
                    }
                },
                {
                    text: "🔍 搜寻补给 (随机获得1-3生命)",
                    effect: (p, _m, log) => {
                        const healAmount = Math.floor(Math.random() * 3) + 1;
                        p.heal(healAmount);
                        log(`🔍 你在角落找到了一些应急口粮，生命+${healAmount}。`, 'event');
                    }
                }
            ]
        },
        {
            title: "🕸️ 蛛网巢穴",
            desc: "空气中弥漫着腐烂的气息，巨大的蛛网覆盖了整个房间。你听到细碎的爬行声。",
            options: [
                {
                    text: "🔥 用火把焚烧",
                    effect: (p, m, log) => {
                        const spiders = m.filter(mon => mon.type === 'small');
                        const count = spiders.length;
                        if (count > 0) {
                            for (let i = m.length - 1; i >= 0; i--) {
                                if (m[i].type === 'small') {
                                    m.splice(i, 1);
                                }
                            }
                            log(`🔥 火焰蔓延开来，烧死了${count}只小蜘蛛！`, 'event');
                        } else {
                            log("🔥 火焰烧毁了蛛网，但似乎没有怪物被波及。", 'event');
                        }
                        p.takeDamage(1);
                        log("你也被轻微烧伤，生命-1。", 'event');
                    }
                },
                {
                    text: "🚶 悄悄绕行",
                    effect: (_p, _m, log) => {
                        if (Math.random() < 0.5) {
                            log("🚶 你小心翼翼地绕过了所有蛛网，安全通过。", 'event');
                        } else {
                            log("🚶 你不小心触碰了蛛网，惊动了什么，但什么也没发生。", 'event');
                        }
                    }
                }
            ]
        },
        {
            title: "🧙‍♂️ 迷途的魔法师",
            desc: "一个穿着长袍的魔法师向你求助，他声称自己的法力被封印了。",
            options: [
                {
                    text: "🤝 帮助他 (生命-1, 随机获得强力祝福)",
                    effect: (p, _m, log) => {
                        p.takeDamage(1);
                        const blessing = Math.random();
                        if (blessing < 0.33) {
                            p.atk += 2;
                            log("🤝 魔法师为了感谢你，给你的武器施加了锋锐术，攻击力+2！", 'event');
                        } else if (blessing < 0.66) {
                            p.def += 2;
                            log("🤝 魔法师为了感谢你，给你的护甲施加了护体术，防御力+2！", 'event');
                        } else {
                            p.increaseMaxHp(3);
                            p.heal(3);
                            log("🤝 魔法师为了感谢你，用最后的魔力强化了你的体质，生命上限+3，生命+3！", 'event');
                        }
                    }
                },
                {
                    text: "💰 索取报酬 (获得1攻击或1防御, 但他会诅咒你)",
                    effect: (p, _m, log) => {
                        if (Math.random() < 0.5) {
                            p.atk++;
                            log("💰 你强行索要报酬，他无奈地给你的武器附魔，攻击力+1。", 'event');
                        } else {
                            p.def++;
                            log("💰 你强行索要报酬，他给你的护甲施加了防护，防御力+1。", 'event');
                        }
                        p.takeDamage(2);
                        log("但他偷偷对你施放了虚弱诅咒，生命-2。", 'event');
                    }
                },
                {
                    text: "🚫 拒绝并离开",
                    effect: (_p, _m, log) => {
                        log("🚫 你没有理会魔法师，径直离开了。", 'event');
                    }
                }
            ]
        },
        {
            title: "🌋 熔岩裂缝",
            desc: "地面裂开一道缝隙，炽热的熔岩在下方翻滚，热浪扑面而来。",
            options: [
                {
                    text: "⛏️ 采集火晶 (随机属性+1, 但可能被灼伤)",
                    effect: (p, _m, log) => {
                        if (Math.random() < 0.6) {
                            if (Math.random() < 0.5) {
                                p.atk++;
                                log("⛏️ 你找到了一块火晶石，将其融入武器，攻击力+1！", 'event');
                            } else {
                                p.def++;
                                log("⛏️ 你找到了一块火晶石，将其镶嵌在护甲上，防御力+1！", 'event');
                            }
                        } else {
                            p.takeDamage(3);
                            log("⛏️ 你被飞溅的熔岩烫伤，生命-3。", 'event');
                        }
                    }
                },
                {
                    text: "👀 小心地观察",
                    effect: (_p, _m, log) => {
                        log("👀 你观察了很久，发现了一些前人的骸骨，但没有发现任何有价值的东西。", 'event');
                    }
                }
            ]
        },
        {
            title: "📖 诅咒的古书",
            desc: "一本用黑色皮革装订的书，散发着不祥的气息。翻开它可能会获得知识，也可能带来灾祸。",
            options: [
                {
                    text: "📚 阅读古书",
                    effect: (p, m, log) => {
                        const outcome = Math.random();
                        if (outcome < 0.4) {
                            p.atk++;
                            p.def++;
                            log("📚 你理解了书中的战术知识，攻击力和防御力各+1！", 'event');
                        } else if (outcome < 0.7) {
                            p.takeDamage(4);
                            const newMonster = new MobEntity(p.row, p.col, 'big', 4, 4, 7);
                            m.push(newMonster);
                            log("📚 古书的诅咒被触发，你受到伤害，并召唤出一只怪物！", 'event');
                        } else {
                            p.atk = Math.max(1, p.atk - 1);
                            p.def = Math.max(0, p.def - 1);
                            log("📚 你感觉一阵头晕目眩，属性被削弱了！", 'event');
                        }
                    }
                },
                {
                    text: "🔥 烧掉它",
                    effect: (p, _m, log) => {
                        p.heal(2);
                        log("🔥 你将古书付之一炬，一股暖流涌入身体，生命+2。", 'event');
                    }
                }
            ]
        },
        {
            title: "🍄 蘑菇圈",
            desc: "一圈发光的巨大蘑菇，空气中飘散着奇怪的孢子。",
            options: [
                {
                    text: "🍽️ 吃下一个蘑菇",
                    effect: (p, _m, log) => {
                        const effect = Math.random();
                        if (effect < 0.33) {
                            p.heal(5);
                            log("🍽️ 你吃下了一个治愈蘑菇，生命+5！", 'event');
                        } else if (effect < 0.66) {
                            p.atk += 1;
                            p.def += 1;
                            log("🍽️ 你吃下了一个力量蘑菇，攻击力和防御力各+1！", 'event');
                        } else {
                            p.takeDamage(3);
                            log("🍽️ 你吃下了一个毒蘑菇，生命-3！", 'event');
                        }
                    }
                },
                {
                    text: "🧪 收集孢子 (未来战斗可能触发效果)",
                    effect: (p, _m, log) => {
                        // 可以添加一个临时buff效果，这里简单实现为生命恢复
                        p.heal(1);
                        log("🧪 你收集了一些孢子，感觉神清气爽，生命+1。", 'event');
                    }
                }
            ]
        },
        {
            title: "🗡️ 英雄的墓碑",
            desc: "一块刻着字的石碑，上面写着：'这里安息着一位勇者，他未能完成的遗愿，愿后人继承。'",
            options: [
                {
                    text: "🙏 鞠躬致敬 (获得勇者的祝福)",
                    effect: (p, _m, log) => {
                        p.increaseMaxHp(2);
                        p.heal(2);
                        log("🙏 一股暖意涌上心头，你感觉体力充沛，生命上限+2，生命+2。", 'event');
                    }
                },
                {
                    text: "⚔️ 继承遗志 (攻击+1, 防御+1, 但被诅咒)",
                    effect: (p, _m, log) => {
                        p.atk++;
                        p.def++;
                        p.takeDamage(3);
                        log("⚔️ 你发誓要完成勇者的遗愿，力量提升了，但也感受到了他临终前的痛苦，生命-3。", 'event');
                    }
                },
                {
                    text: "🔍 检查墓碑",
                    effect: (_p, _m, log) => {
                        log("🔍 你仔细检查了墓碑，没有发现什么特别的东西。", 'event');
                    }
                }
            ]
        }
    ];

    /**
     * 获取随机事件
     */
    public static getRandomEvent(rng: Supplier<number>) {
        const index = Math.floor(rng() * this.EVENTS.length);
        return this.EVENTS[index];
    }

    /**
     * 触发事件
     */
    public static triggerEvent(
        modalManager: ModalManager,
        player: PlayerEntity,
        monsters: MobEntity[],
        stats: Stats,
        addLog: BiConsumer<string, string>,
        callback: Consumer<string>) {
        const evt = this.getRandomEvent(Math.random);

        modalManager.showEventModal(
            evt.title,
            evt.desc,
            evt.options.map(opt => ({
                text: opt.text,
                onClick: () => {
                    opt.effect(player, monsters, addLog);
                    callback(player.isDead() ? 'gameOver' : 'continue');
                }
            }))
        );

        stats.eventsTriggered++;
    }
}
