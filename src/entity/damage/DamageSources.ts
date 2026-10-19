import {DamageSource} from "./DamageSource.ts";
import type {Entity} from "../Entity.ts";
import type {DamageType} from "./DamageType.ts";
import {DamageTypes} from "./DamageTypes.ts";
import type {RegistryKey} from "../../registry/RegistryKey.ts";
import {Registry} from "../../registry/Registry.ts";
import {RegistryManager} from "../../registry/RegistryManager.ts";
import {RegistryKeys} from "../../registry/RegistryKeys.ts";

export class DamageSources {
    private readonly registry: Registry<DamageType>;
    private readonly _generic: DamageSource;

    public constructor(registryManager: RegistryManager) {
        this.registry = registryManager.get(RegistryKeys.DAMAGE_TYPE);
        this._generic = this.create(DamageTypes.GENERIC);
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
}
