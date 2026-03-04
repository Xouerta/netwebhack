import type {NbtElement} from "./NbtElement.ts";
import {type NbtType, NbtTypeId, type NbtTypeIndex} from "../NbtType.ts";
import {config} from "../../utils/uit.ts";

export class NbtEnd implements NbtElement {
    public static readonly TYPE: NbtType<NbtEnd> = config({
        read(): NbtEnd {
            return NbtEnd.INSTANCE;
        }
    });

    public readonly type = NbtTypeId.End;
    public static readonly INSTANCE = new NbtEnd();

    private constructor() {
    }

    public getType(): NbtTypeIndex {
        return 0;
    }

    public copy(): NbtEnd {
        return this;
    }

    public write() {
    }
}