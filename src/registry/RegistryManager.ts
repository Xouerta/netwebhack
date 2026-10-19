import {Registry} from "./Registry.ts";
import {RegistryKey} from "./RegistryKey.ts";
import {RegistryKeys} from "./RegistryKeys.ts";
import {Registries} from "./Registries.ts";
import {deepFreeze} from "../utils/uit.ts";
import {DamageTypes} from "../entity/damage/DamageTypes.ts";
import {NbtTypes} from "../nbt/NbtTypes.ts";

export class RegistryManager {
    private readonly registers = new Map<RegistryKey<any>, Registry<any>>();

    public async registerAll(): Promise<void> {
        if (Object.isFrozen(this)) throw new Error('Registry already registered');

        NbtTypes.init();

        this.registers.set(RegistryKeys.DAMAGE_TYPE, Registries.DAMAGE_TYPE);

        await DamageTypes.init();
        await Registries.complete();
    }

    public get<E>(key: RegistryKey<Registry<E>>): Registry<E> {
        const entry = this.registers.get(key);
        if (entry) {
            return entry;
        } else {
            throw new ReferenceError(`Missing registry: ${key}`);
        }
    }

    public freeze() {
        this.registers.values().forEach(value => value.freeze());
        deepFreeze(this);
    }
}