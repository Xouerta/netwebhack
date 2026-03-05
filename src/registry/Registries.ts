import {RegistryKey} from "./RegistryKey.ts";
import {Registry} from "./Registry.ts";
import {RegistryKeys} from "./RegistryKeys.ts";
import {Identifier} from "./Identifier.ts";

export class Registries {
    private static readonly ROOT = new Registry(RegistryKey.ofRegistry(Identifier.ROOT));
    private static readonly DEFAULT_ENTRIES = new Map<Identifier, CallableFunction>();

    public static readonly DAMAGE_TYPE = this.simpleCreate(RegistryKeys.DAMAGE_TYPE, () => {
    });

    public static async complete() {
        // 防止循环引用
    }

    private static simpleCreate<T>(key: RegistryKey<Registry<T>>, initializer: CallableFunction): Registry<T> {
        return this.create(key, new Registry(key), initializer);
    }

    private static create<T, R extends Registry<T>>(key: RegistryKey<Registry<T>>, registry: R, initializer: CallableFunction): R {
        const id = key.getValue();
        this.DEFAULT_ENTRIES.set(id, initializer);
        this.ROOT.add(key, registry);
        return registry;
    }
}