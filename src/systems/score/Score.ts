export interface Score {
    baseScore: number;
    smallKillScore: number;
    bigKillScore: number;
    bossScore: number;
    atkScore: number;
    defScore: number;
    hpScore: number;
    itemScore: number;
    stepScore: number;
    eventScore: number;
    levelScore: number;
    total: number;
    details: ScoreDetails;
}

export interface ScoreDetails {
    smallKills: number;
    bigKills: number;
    bossKilled: boolean;
    atk: number;
    def: number;
    hp: number;
    items: number;
    steps: number;
    events: number;
    level: number;
}