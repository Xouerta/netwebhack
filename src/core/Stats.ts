import {status} from "../utils/uit.ts";

export interface Stats {
    smallKills: number;
    bigKills: number;
    bossKilled: boolean;
    itemsCollected: number;
    eventsTriggered: number;
    steps: number;
    startTime: number;
    upgradeLuck: number;
    blessing: number
}

export function newStats(): Stats {
    return status({
        smallKills: 0,
        bigKills: 0,
        bossKilled: false,
        itemsCollected: 0,
        eventsTriggered: 0,
        steps: 0,
        startTime: Date.now(),
        upgradeLuck: 0,
        blessing: 0,
    });
}