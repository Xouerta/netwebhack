import type {DamageType} from "./DamageType.ts";
import type {Entity} from "../Entity.ts";
import type {TagKey} from "../../registry/tag/TagKey.ts";
import type {RegistryEntry} from "../../registry/tag/RegistryEntry.ts";
import type {RegistryKey} from "../../registry/RegistryKey.ts";
import {clamp} from "../../utils/math.ts";

export class DamageSource {
    private readonly type: RegistryEntry<DamageType>;
    private readonly attacker: Entity | null;
    private readonly source: Entity | null;

    private healthMulti: number = 1;
    private armorMulti: number = 1;
    private shieldMulti: number = 1;

    public constructor(type: RegistryEntry<DamageType>, attacker: Entity | null = null, source: Entity | null = null) {
        this.type = type;
        this.attacker = attacker;
        this.source = source;
    }

    public isDirect(): boolean {
        return this.attacker === this.source;
    }

    public getSource(): Entity | null {
        return this.source;
    }

    public getAttacker(): Entity | null {
        return this.attacker;
    }

    public getHealthMulti(): number {
        return this.healthMulti;
    }

    public setHealthMulti(multi: number) {
        this.healthMulti = clamp(multi, 0, 128);
        return this;
    }

    public getArmorMulti(): number {
        return this.armorMulti;
    }

    public setArmorMulti(multi: number) {
        this.armorMulti = clamp(multi, 0, 128);
        return this;
    }

    public getShieldMulti(): number {
        return this.shieldMulti;
    }

    public setShieldMulti(multi: number) {
        this.shieldMulti = clamp(multi, 0, 128);
        return this;
    }

    public isIn(...type: TagKey<DamageType>[]): boolean {
        return type.some((v: TagKey<DamageType>) => this.type.isIn(v));
    }

    public isOf(typeKey: RegistryKey<DamageType>) {
        return this.type.matchesKey(typeKey);
    }

    public getType() {
        return this.type;
    }
}