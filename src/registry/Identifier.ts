import type {Comparable} from "../types/Comparable.ts";
import {stringHashCode} from "../utils/hash.ts";

export class Identifier implements Comparable {
    private static readonly validNamespace = /^[a-z0-9_.-]+$/;
    private static readonly validPath = /^[a-z0-9_.\/-]+$/;

    public static readonly NAMESPACE_SEPARATOR: string = ':';
    public static readonly DEFAULT_NAMESPACE: string = 'netwebhack';
    public static readonly ROOT: Identifier = Identifier.ofVanilla('root');

    private readonly namespace: string;
    private readonly path: string;
    private readonly hashCache: number;

    public constructor(namespace: string, path: string) {
        if (!Identifier.isNamespaceValid(namespace)) throw new SyntaxError(`Invalid namespace: ${namespace}`);
        if (!Identifier.isPathValid(path)) throw new SyntaxError(`Invalid path: ${path}`);

        this.namespace = namespace;
        this.path = path;
        this.hashCache = (stringHashCode(namespace) * 31 + stringHashCode(path)) | 0;
    }

    public static of(namespace: string, path: string): Identifier {
        return Identifier.ofValidated(namespace, path);
    }

    public static ofVanilla(path: string): Identifier {
        return new Identifier(Identifier.DEFAULT_NAMESPACE, Identifier.validatePath(Identifier.DEFAULT_NAMESPACE, path));
    }

    public static tryParse(id: string): Identifier | null {
        const sep = id.indexOf(':');

        if (sep >= 0) {
            const namespace = id.substring(0, sep);
            const path = id.substring(sep + 1);

            if (!this.isPathValid(path)) return null;

            if (namespace.length === 0) {
                return new Identifier('netwebhack', path);
            }

            return this.isNamespaceValid(namespace) ? new Identifier(namespace, path) : null;
        }

        return this.isPathValid(id) ? new Identifier('netwebhack', id) : null;
    }

    public static splitOn(id: string, delimiter = ':') {
        const sep = id.indexOf(delimiter);
        if (sep >= 0) {
            const path = id.substring(sep + 1);
            if (sep !== 0) {
                const namespace = id.substring(0, sep);
                return this.ofValidated(namespace, path);
            }
            return this.ofVanilla(path);
        }
        return this.ofVanilla(id);
    }

    public static isNamespaceValid(namespace: string): boolean {
        return this.validNamespace.test(namespace);
    }

    public static isPathValid(path: string): boolean {
        return this.validPath.test(path);
    }

    private static ofValidated(namespace: string, path: string): Identifier {
        return new Identifier(Identifier.validateNamespace(namespace, path), Identifier.validatePath(namespace, path));
    }

    private static validateNamespace(namespace: string, path: string): string {
        if (Identifier.isNamespaceValid(namespace)) {
            return namespace;
        } else {
            throw new SyntaxError(`Non [a-z0-9_.-] character in namespace of location: ${namespace}:${path}`);
        }
    }

    private static validatePath(namespace: string, path: string): string {
        if (Identifier.isPathValid(path)) {
            return path;
        } else {
            throw new SyntaxError(`"Non [a-z0-9/._-] character in path of location: ${namespace}:${path}`);
        }
    }

    public getPath(): string {
        return this.path;
    }

    public getNamespace(): string {
        return this.namespace;
    }

    public withPath(newPath: string): Identifier {
        return new Identifier(this.namespace, Identifier.validatePath(this.namespace, newPath));
    }

    public withPrefix(prefix: string): Identifier {
        return this.withPath(prefix + this.path);
    }

    public toString(): string {
        return `${this.namespace}:${this.path}`;
    }

    public equal(o: unknown): boolean {
        if (this === o) {
            return true;
        }
        return !(o instanceof Identifier) ? false : this.namespace === o.namespace && this.path === o.path;
    }

    public hashCode(): number {
        return this.hashCache;
    }
}