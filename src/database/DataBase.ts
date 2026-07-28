import {IndexedDBHelper} from "./IndexedDBHelper.ts";
import type {NbtCompound} from "../nbt/element/NbtCompound.ts";
import {NbtSerialization} from "../nbt/NbtSerialization.ts";

interface Save {
    save_name: string;
    data: Uint8Array<ArrayBuffer>;
}

export class DataBase {
    public static readonly db = new IndexedDBHelper('game', 1, [
        {
            name: 'save',
            keyPath: 'save_name'
        }
    ]);

    public static saveGame(compound: NbtCompound) {
        return this.db.update('save', {
            save_name: 'MyGame',
            data: NbtSerialization.toCompactBinary(compound)
        });
    }

    public static loadGame() {
        return this.db.get<Save>('save', 'MyGame');
    }
}