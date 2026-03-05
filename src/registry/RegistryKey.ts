import {Identifier} from "./Identifier.ts";
import {createClean} from "../utils/uit.ts";
import type {Registry} from "./Registry.ts";


// @ts-ignore
export class RegistryKey<T> {
    private static readonly REGISTRY = new Map<RegistryIdPair, RegistryKey<any>>();

    private readonly registry: Identifier;
    private readonly value: Identifier;

    private constructor(registry: Identifier, value: Identifier) {
        this.registry = registry;
        this.value = value;
    }

    public static of<T>(registry: RegistryKey<Registry<T>>, value: Identifier) {
        return RegistryKey.ofKey(registry.getValue(), value) as RegistryKey<T>;
    }

    public static ofRegistry<T>(registry: Identifier): RegistryKey<T> {
        return RegistryKey.ofKey(Identifier.ROOT, registry);
    }

    private static ofKey<T>(registry: Identifier, id: Identifier): RegistryKey<T> {
        const pair: RegistryIdPair = createClean({registry, id});
        const existKey = RegistryKey.REGISTRY.get(pair);
        if (existKey) return existKey;

        const key = new RegistryKey<T>(registry, id);
        RegistryKey.REGISTRY.set(pair, key);

        return key as RegistryKey<T>;
    }

    public isOf(registry: RegistryKey<any>) {
        return this.registry.equals(registry.getValue());
    }

    public getValue(): Identifier {
        return this.value;
    }

    public getRegistry(): Identifier {
        return this.registry;
    }
}

interface RegistryIdPair {
    registry: Identifier,
    id: Identifier
}