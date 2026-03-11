import {clamp} from "../utils/math.ts";
import type {NbtSerializable} from "../nbt/NbtSerializable.ts";
import {type NbtCompound} from "../nbt/element/NbtCompound.ts";
import {NbtTypeId} from "../nbt/NbtType.ts";
import {AtomicInteger} from "../utils/collection/AtomicInteger.ts";

export abstract class Entity implements NbtSerializable {
    private static readonly NEXT_ID = new AtomicInteger();

    public readonly id = Entity.NEXT_ID.getAndIncrement();
    private _row: number;
    private _col: number;
    public pervRow: number;
    public pervCol: number;

    private maxHealth: number;
    private health: number;

    public atk: number;
    public def: number;

    protected constructor(row: number, col: number, maxHealth: number, atk: number, def: number) {
        this._row = row;
        this._col = col;
        this.pervRow = row;
        this.pervCol = col;

        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.atk = atk;
        this.def = def;
    }

    public setHealth(value: number) {
        this.health = clamp(value, 0, this.maxHealth);
    }

    public getHealth() {
        return this.health;
    }

    public setMaxHealth(value: number) {
        this.maxHealth = Math.max(0, value);
    }

    public getMaxHealth() {
        return this.maxHealth;
    }

    public takeDamage(damage: number) {
        this.setHealth(this.getHealth() - damage);
    }

    public heal(value: number) {
        this.setHealth(this.getHealth() + value);
    }

    public isDead() {
        return this.health <= 0;
    }

    public get row(): number {
        return this._row;
    }

    public get col(): number {
        return this._col;
    }

    public setPos(x: number, y: number) {
        this.pervRow = this._row;
        this.pervCol = this._col;
        this._row = x;
        this._col = y;
    }

    public move(dx: number, dy: number) {
        this.setPos(this._row + dx, this._col + dy);
    }

    public readNBT(nbt: NbtCompound) {
        const pos = nbt.getInt16Array('pos');
        this._row = pos[0] ?? 1;
        this._col = pos[1] ?? 1;

        if (nbt.contains('maxHealth', NbtTypeId.Int8)) {
            this.setMaxHealth(nbt.getInt8('max_health'));
            this.setHealth(nbt.getInt8('health'));
        }
        this.atk = nbt.getInt8('attack');
        this.def = nbt.getInt8('def');
    }

    public writeNBT(nbt: NbtCompound): NbtCompound {
        nbt.putInt16Array('pos', this._row, this._col);

        nbt.putInt8('max_health', this.maxHealth);
        nbt.putInt8('health', this.health);
        nbt.putInt8('attack', this.atk);
        nbt.putInt8('def', this.def);
        return nbt;
    }
}