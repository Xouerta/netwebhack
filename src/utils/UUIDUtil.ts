import type {UUID} from "../types.ts";
import {config} from "./uit.ts";

export class UUIDUtil {
    public static readonly EMPTY_UUID = new Uint8Array(16);
    public static readonly EMPTY_UUID_STRING: UUID = '0000-0000-0000-0000-0000';

    private static readonly HEX_CHAR_TO_BYTE: Record<string, number> = config({
        '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
        '8': 8, '9': 9, 'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15,
        'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15
    });

    private static readonly HEX_TABLE = Array.from({length: 256}, (_, i) =>
        i.toString(16).padStart(2, '0')
    );

    public static parse(uuid: string): Uint8Array {
        if (uuid.length !== 36 || uuid[8] !== '-' || uuid[13] !== '-' || uuid[18] !== '-' || uuid[23] !== '-') {
            throw new Error("Invalid UUID format");
        }

        const T = this.HEX_CHAR_TO_BYTE;
        const b = new Uint8Array(16);

        b[0] = (T[uuid[0]] << 4) | T[uuid[1]];
        b[1] = (T[uuid[2]] << 4) | T[uuid[3]];
        b[2] = (T[uuid[4]] << 4) | T[uuid[5]];
        b[3] = (T[uuid[6]] << 4) | T[uuid[7]];
        // uuid[8] == '-'
        b[4] = (T[uuid[9]] << 4) | T[uuid[10]];
        b[5] = (T[uuid[11]] << 4) | T[uuid[12]];
        // uuid[13] == '-'
        b[6] = (T[uuid[14]] << 4) | T[uuid[15]];
        b[7] = (T[uuid[16]] << 4) | T[uuid[17]];
        // uuid[18] == '-'
        b[8] = (T[uuid[19]] << 4) | T[uuid[20]];
        b[9] = (T[uuid[21]] << 4) | T[uuid[22]];
        // uuid[23] == '-'
        b[10] = (T[uuid[24]] << 4) | T[uuid[25]];
        b[11] = (T[uuid[26]] << 4) | T[uuid[27]];
        b[12] = (T[uuid[28]] << 4) | T[uuid[29]];
        b[13] = (T[uuid[30]] << 4) | T[uuid[31]];
        b[14] = (T[uuid[32]] << 4) | T[uuid[33]];
        b[15] = (T[uuid[34]] << 4) | T[uuid[35]];

        return b;
    }

    public static stringify(bytes: Uint8Array): UUID {
        if (bytes.length !== 16) {
            throw new Error("Invalid UUID bytes");
        }
        const hex = new Array(16);
        for (let i = 0; i < 16; i++) {
            hex[i] = this.HEX_TABLE[bytes[i]];
        }

        return (
            hex[0] + hex[1] + hex[2] + hex[3] + '-' +
            hex[4] + hex[5] + '-' +
            hex[6] + hex[7] + '-' +
            hex[8] + hex[9] + '-' +
            hex[10] + hex[11] + hex[12] + hex[13] + hex[14] + hex[15]
        ) as UUID;
    }

    public static async uuidFromUsername(username: string): Promise<UUID> {
        const encoder = new TextEncoder();
        const data = encoder.encode(username);

        const hashBuffer = await crypto.subtle.digest("SHA-1", data);
        const hash = new Uint8Array(hashBuffer);

        const bytes = hash.slice(0, 16);

        bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC4122

        return this.stringify(bytes);
    }

    public static isValidUUID(uuid: string): uuid is UUID {
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
        return uuidRegex.test(uuid);
    }

    public static nil(): Uint8Array {
        return new Uint8Array(16);
    }
}
