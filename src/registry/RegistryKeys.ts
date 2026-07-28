import {Identifier} from "./Identifier.ts";
import {RegistryKey} from "./RegistryKey.ts";
import type {Registry} from "./Registry.ts";
import type {DamageType} from "../entity/damage/DamageType.ts";

export class RegistryKeys {
    public static readonly DAMAGE_TYPE: RegistryKey<Registry<DamageType>> = this.of("damage_type");

    private static of<T>(id: string): RegistryKey<T> {
        return RegistryKey.ofRegistry(Identifier.ofVanilla(id));
    }
}
