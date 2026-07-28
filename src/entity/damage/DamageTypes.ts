import {RegistryKey} from "../../registry/RegistryKey.ts";
import {RegistryKeys} from "../../registry/RegistryKeys.ts";
import {Identifier} from "../../registry/Identifier.ts";
import {Registries} from "../../registry/Registries.ts";

export class DamageTypes {
    public static readonly GENERIC = this.registry("generic");

    public static async init() {
        const damage = Registries.DAMAGE_TYPE;
        damage.add(this.GENERIC, 'generic');
    }

    private static registry(id: string) {
        return RegistryKey.of(RegistryKeys.DAMAGE_TYPE, Identifier.ofVanilla(id));
    }
}
