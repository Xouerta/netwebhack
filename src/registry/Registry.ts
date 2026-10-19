import {RegistryKey} from "./RegistryKey.ts";
import {RegistryEntry} from "./tag/RegistryEntry.ts";
import type {Identifier} from "./Identifier.ts";
import type {TagKey} from "./tag/TagKey.ts";
import {HashMap} from "../utils/collection/HashMap.ts";
import type {IndexedIterable} from "../utils/collection/IndexedIterable.ts";
import {deepFreeze} from "../utils/uit.ts";

export class Registry<T> implements IndexedIterable<T> {
    public static registerReference<T>(registry: Registry<T>, key: RegistryKey<T>, entry: T): RegistryEntry<T> {
        return registry.add(key, entry);
    }

    public static registerReferenceById<T>(registry: Registry<T>, id: Identifier, entry: T): RegistryEntry<T> {
        return this.registerReference(registry, RegistryKey.of(registry.getKey(), id), entry);
    }

    private static getValue<T>(entry: RegistryEntry<T> | null): T | null {
        return entry !== null ? entry.getValue() : null;
    }

    public readonly key: RegistryKey<T>;

    private readonly indexToEntry: RegistryEntry<T>[];
    private readonly entryToIndex: Map<RegistryEntry<T>, number>;
    private readonly idToEntry: HashMap<Identifier, RegistryEntry<T>>;
    private readonly keyToEntry: Map<RegistryKey<T>, RegistryEntry<T>>;
    private readonly valueToEntry: Map<T, RegistryEntry<T>>;

    public constructor(key: RegistryKey<Registry<T>>) {
        this.key = key;
        this.indexToEntry = [];
        this.entryToIndex = new Map<RegistryEntry<T>, number>();
        this.idToEntry = new HashMap<Identifier, RegistryEntry<T>>();
        this.keyToEntry = new Map<RegistryKey<T>, RegistryEntry<T>>();
        this.valueToEntry = new Map<T, RegistryEntry<T>>();
    }

    public getKey(): RegistryKey<T> {
        return this.key;
    }

    private assertNotFrozen() {
        if (Object.isFrozen(this)) {
            throw new Error('Registry is already frozen');
        }
    }

    public add(key: RegistryKey<T>, value: T, ...tags: TagKey<T>[]): RegistryEntry<T> {
        this.assertNotFrozen();

        if (this.idToEntry.has(key.getValue())) throw new Error(`ID is already registered: ${key.getValue()}`);
        if (this.valueToEntry.has(value)) throw new Error(`Value is already registered: ${value}`);

        const entry = new RegistryEntry(key, value);
        if (tags && tags.length > 0) entry.setTags(new Set(tags));

        this.keyToEntry.set(key, entry);
        this.idToEntry.set(key.getValue(), entry);
        this.valueToEntry.set(value, entry);

        const index = this.indexToEntry.length;
        this.indexToEntry.push(entry);
        this.entryToIndex.set(entry, index);

        return entry;
    }

    /**
     * Get value's identifier.
     * */
    public getId(value: T): Identifier | null {
        const entry = this.valueToEntry.get(value);
        return entry !== undefined ? entry.getRegistryKey().getValue() : null
    }

    /**
     * Get value's registry key.
     * */
    public getRegistryKey(value: T): RegistryKey<T> | null {
        return this.valueToEntry.get(value)?.getRegistryKey() ?? null;
    }

    /**
     * Get value's registry index(raw id)
     * */
    public getIndex(value: T): number {
        const entry = this.valueToEntry.get(value);
        if (!entry) return -1;
        return this.getEntryIndex(entry);
    }

    public getIndexOrThrow(value: T): number {
        const entry = this.valueToEntry.get(value);
        if (!entry) throw new ReferenceError(`No entry with ${value}`);

        const id = this.getEntryIndex(entry);
        if (id === -1) {
            throw new ReferenceError(`Can't find id for ${value}`);
        }
        return id;
    }

    public getEntryIndex(entry: RegistryEntry<T>): number {
        return this.entryToIndex.get(entry) ?? -1;
    }

    public getById(id: Identifier | null): T | null {
        if (!id) return null;
        return Registry.getValue(this.idToEntry.get(id) ?? null);
    }

    public getByIndex(index: number): T | null {
        const entry = this.getEntryByIndex(index);
        if (!entry) return null;
        return entry.getValue();
    }

    public getByIndexOrThrow(index: number): T {
        const entry = this.getEntryByIndex(index);
        if (!entry) throw new ReferenceError(`No value with id ${index}`);
        return entry.getValue();
    }

    public getEntryById(id: Identifier): RegistryEntry<T> | null {
        return this.idToEntry.get(id) ?? null;
    }

    public getEntryByValue(value: T): RegistryEntry<T> | null {
        return this.valueToEntry.get(value) ?? null;
    }

    public getEntryByKey(key: RegistryKey<T>): RegistryEntry<T> {
        return this.keyToEntry.get(key)!;
    }

    public getEntryByIndex(index: number): RegistryEntry<T> | null {
        return index >= 0 && index < this.indexToEntry.length ? this.indexToEntry[index] : null;
    }

    public size() {
        return this.keyToEntry.size;
    }

    public getIdSet(): Set<Identifier> {
        return new Set(this.idToEntry.keys());
    }

    public getIds() {
        return this.idToEntry.keys();
    }

    public getEntries() {
        return this.idToEntry.values();
    }

    public [Symbol.iterator]() {
        return this.valueToEntry.keys();
    }

    public getIndexedEntries(): IndexedIterable<RegistryEntry<T>> {
        const self = this;
        return {
            getIndex(entry: RegistryEntry<T>): number {
                return self.getEntryIndex(entry);
            },
            getByIndex(index: number): RegistryEntry<T> | null {
                return self.getEntryByIndex(index);
            },
            getByIndexOrThrow(index: number): RegistryEntry<T> {
                const value = this.getByIndex(index);
                if (value === null) throw new ReferenceError(`No value with id ${index}`);
                return value
            },
            getIndexOrThrow(entry: RegistryEntry<T>): number {
                const id = this.getIndex(entry);
                if (id === -1) {
                    throw new ReferenceError(`Can't find id for ${entry.toString()}`);
                }
                return id;
            },
            size() {
                return self.size();
            },

            [Symbol.iterator]() {
                return self.entryToIndex.keys();
            },
        } satisfies IndexedIterable<RegistryEntry<T>>;
    }

    public freeze() {
        if (Object.isFrozen(this)) {
            return;
        }
        deepFreeze(this);

        const unbound = this.keyToEntry
            .entries()
            .filter(entry => !entry[1].hasKeyAndValue())
            .map(entry => entry[0].getValue())
            .toArray()
            .sort();
        if (unbound.length > 0) {
            throw new Error(`Unbound values in registry ${this.getKey()}:\n ${unbound}`);
        }
    }
}