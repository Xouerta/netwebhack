import {DamageSource} from "./DamageSource.ts";
import type {Entity} from "../Entity.ts";
import type {DamageType} from "./DamageType.ts";
import {DamageTypes} from "./DamageTypes.ts";
import type {RegistryKey} from "../../registry/RegistryKey.ts";
import {Registry} from "../../registry/Registry.ts";
import {RegistryManager} from "../../registry/RegistryManager.ts";
import {RegistryKeys} from "../../registry/RegistryKeys.ts";
import type {MobEntity} from "../MobEntity.ts";
import type {PlayerEntity} from "../PlayerEntity.ts";

export class DamageSources {
    private readonly registry: Registry<DamageType>;
    private readonly _generic: DamageSource;
    private readonly _removed: DamageSource;
    private readonly _kill: DamageSource;
    private readonly _laser: DamageSource;
    private readonly _void: DamageSource;
    private readonly _erosion: DamageSource;
    private readonly _explosion: DamageSource;
    private readonly _arc: DamageSource;

    public constructor(registryManager: RegistryManager) {
        this.registry = registryManager.get(RegistryKeys.DAMAGE_TYPE);
        this._generic = this.create(DamageTypes.GENERIC);
        this._removed = this.create(DamageTypes.REMOVED);
        this._kill = this.create(DamageTypes.KILL);
        this._laser = this.create(DamageTypes.LASER).setShieldMulti(0.5);
        this._void = this.create(DamageTypes.VOID);
        this._erosion = this.create(DamageTypes.EROSION);
        this._explosion = this.create(DamageTypes.EXPLOSION);
        this._arc = this.create(DamageTypes.ARC);
    }

    public create(key: RegistryKey<DamageType>): DamageSource {
        return new DamageSource(this.registry.getEntryByKey(key));
    }

    public createWithAttacker(key: RegistryKey<DamageType>, attacker: Entity): DamageSource {
        return new DamageSource(this.registry.getEntryByKey(key), attacker);
    }

    public createWithSource(key: RegistryKey<DamageType>, source: Entity, attacker: Entity | null): DamageSource {
        return new DamageSource(this.registry.getEntryByKey(key), attacker, source);
    }

    public generic(): DamageSource {
        return this._generic;
    }

    public mobAttack(attacker: MobEntity): DamageSource {
        return this.createWithAttacker(DamageTypes.MOB_ATTACK, attacker);
    }

    public playerAttack(attacker: PlayerEntity) {
        return this.createWithAttacker(DamageTypes.PLAYER_ATTACK, attacker);
    }

    public projectile(source: Entity, attacker: Entity | null) {
        return this.createWithSource(DamageTypes.MOB_PROJECTILE, source, attacker);
    }

    public kinetic(source: Entity, attacker: Entity | null) {
        return this.createWithSource(DamageTypes.KINETIC, source, attacker).setArmorMulti(0.5);
    }

    public apDamage(source: Entity, attacker: Entity | null): DamageSource {
        return this.createWithSource(DamageTypes.AP_DAMAGE, source, attacker);
    }

    public explosion(source: Entity | null, attacker: Entity | null) {
        return source !== null ?
            this.createWithSource(DamageTypes.EXPLOSION, source, attacker) :
            this._explosion;
    }

    public laser(attacker: Entity | null) {
        return attacker !== null ?
            this.createWithAttacker(DamageTypes.LASER, attacker).setShieldMulti(0.5) :
            this._laser;
    }

    public playerImpact(attacker: PlayerEntity) {
        return this.createWithAttacker(DamageTypes.PLAYER_IMPACT, attacker);
    }

    public removed() {
        return this._removed;
    }

    public kill() {
        return this._kill;
    }

    public void(attacker: PlayerEntity | null) {
        if (attacker) {
            return this.createWithAttacker(DamageTypes.VOID, attacker);
        }
        return this._void;
    }

    public erosion() {
        return this._erosion;
    }

    public arc(attacker: Entity | null) {
        if (attacker) {
            return this.createWithAttacker(DamageTypes.ARC, attacker);
        }

        return this._arc;
    }
}
