import type {RegistryKey} from "../RegistryKey.ts";
import type {Identifier} from "../Identifier.ts";

export class TagKey<T> {
    private readonly registry: RegistryKey<T>;
    private readonly id: Identifier;

    public constructor(registryKey: RegistryKey<T>, identifier: Identifier) {
        this.registry = registryKey;
        this.id = identifier;
    }

    public static of<T>(registry: RegistryKey<T>, id: Identifier) {
        return new TagKey(registry, id);
    }

    public isOf(registryRef: RegistryKey<T>): boolean {
        return this.registry === registryRef;
    }

    public toString(): string {
        return `TagKey[${this.registry.getValue().toString()}/${this.id.toString()}]`;
    }
}