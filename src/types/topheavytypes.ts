import type {
    ThStringChain,
    ThNumberChain,
    ThBigIntChain,
    ThDateChain,
    ThBooleanChain,
    ThSymbolChain,
    ThUndefinedChain,
    ThNullChain,
    ThBaseChain,
    TypeDefinition,
    ThRefField,
    ThType,
    InferSchema,
    ValidThField,
} from './topheavytypes.types';

// ══════════════════════════════════════════════════════════════════════
// Runtime Implementation
// ══════════════════════════════════════════════════════════════════════

type ValidatorFn = (value: any) => boolean;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── BaseChainBuilder ─────────────────────────────────────────────────

class BaseChainBuilder {
    validators: ValidatorFn[] = [];
    private _nullable = false;

    /** @internal phantom — only meaningful at the type level */
    declare readonly _type: unknown;

    validate(value: any): boolean {
        if (this._nullable && (value === null || value === undefined)) return true;
        return this.validators.every(fn => fn(value));
    }

    get nullable(): this {
        this._nullable = true;
        return this;
    }

    test(fn: ValidatorFn): this {
        this.validators.push(fn);
        return this;
    }
}

// ── StringChainBuilder ───────────────────────────────────────────────

class StringChainBuilder extends BaseChainBuilder implements ThStringChain {
    declare readonly _type: string;

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'string');
    }

    len(n: number): this {
        this.validators.push((v: any) => v.length === n);
        return this;
    }

    length(n: number): this {
        this.validators.push((v: any) => v.length === n);
        return this;
    }

    minLen(n: number): this {
        this.validators.push((v: any) => v.length >= n);
        return this;
    }

    maxLen(n: number): this {
        this.validators.push((v: any) => v.length <= n);
        return this;
    }

    beginsWith(s: string): this {
        this.validators.push((v: any) => v.startsWith(s));
        return this;
    }

    endsWith(s: string): this {
        this.validators.push((v: any) => v.endsWith(s));
        return this;
    }

    contains(s: string): this {
        this.validators.push((v: any) => v.includes(s));
        return this;
    }

    regex(pattern: RegExp): this {
        this.validators.push((v: any) => pattern.test(v));
        return this;
    }

    template(strings: TemplateStringsArray, ...exprs: any[]): this {
        let pattern = '^';
        for (let i = 0; i < strings.length; i++) {
            pattern += strings[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (i < exprs.length) pattern += '.*';
        }
        pattern += '$';
        const regex = new RegExp(pattern);
        this.validators.push((v: any) => regex.test(v));
        return this;
    }

    uppercase(): this {
        this.validators.push((v: any) => v === v.toUpperCase());
        return this;
    }

    lowercase(): this {
        this.validators.push((v: any) => v === v.toLowerCase());
        return this;
    }

    get email(): this {
        this.validators.push((v: any) => EMAIL_REGEX.test(v));
        return this;
    }
}

// ── NumberChainBuilder ───────────────────────────────────────────────

class NumberChainBuilder extends BaseChainBuilder implements ThNumberChain {
    declare readonly _type: number;

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'number' && !Number.isNaN(v));
    }

    gt(n: number): this {
        this.validators.push((v: any) => v > n);
        return this;
    }

    lt(n: number): this {
        this.validators.push((v: any) => v < n);
        return this;
    }

    gte(n: number): this {
        this.validators.push((v: any) => v >= n);
        return this;
    }

    lte(n: number): this {
        this.validators.push((v: any) => v <= n);
        return this;
    }

    multipleOf(n: number): this {
        this.validators.push((v: any) => v % n === 0);
        return this;
    }

    get unsigned(): this {
        this.validators.push((v: any) => v >= 0);
        return this;
    }

    get signed(): this {
        return this;
    }
}

// ── BigIntChainBuilder ───────────────────────────────────────────────

class BigIntChainBuilder extends BaseChainBuilder implements ThBigIntChain {
    declare readonly _type: bigint;

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'bigint');
    }

    gt(n: bigint): this {
        this.validators.push((v: any) => v > n);
        return this;
    }

    lt(n: bigint): this {
        this.validators.push((v: any) => v < n);
        return this;
    }

    gte(n: bigint): this {
        this.validators.push((v: any) => v >= n);
        return this;
    }

    lte(n: bigint): this {
        this.validators.push((v: any) => v <= n);
        return this;
    }

    multipleOf(n: bigint): this {
        this.validators.push((v: any) => v % n === 0n);
        return this;
    }
}

// ── DateChainBuilder ─────────────────────────────────────────────────

class DateChainBuilder extends BaseChainBuilder implements ThDateChain {
    declare readonly _type: Date;

    constructor() {
        super();
        this.validators.push((v: any) => v instanceof Date && !Number.isNaN(v.valueOf()));
    }

    gt(d: Date): this {
        this.validators.push((v: any) => v > d);
        return this;
    }

    lt(d: Date): this {
        this.validators.push((v: any) => v < d);
        return this;
    }

    gte(d: Date): this {
        this.validators.push((v: any) => v >= d);
        return this;
    }

    lte(d: Date): this {
        this.validators.push((v: any) => v <= d);
        return this;
    }

    min(s: string): this {
        this.validators.push((v: any) => v >= new Date(s));
        return this;
    }

    max(s: string): this {
        this.validators.push((v: any) => v <= new Date(s));
        return this;
    }
}

// ── Simple chain builders ────────────────────────────────────────────

class BooleanChainBuilder extends BaseChainBuilder implements ThBooleanChain {
    declare readonly _type: boolean;

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'boolean');
    }
}

class SymbolChainBuilder extends BaseChainBuilder implements ThSymbolChain {
    declare readonly _type: symbol;

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'symbol');
    }
}

class UndefinedChainBuilder extends BaseChainBuilder implements ThUndefinedChain {
    declare readonly _type: undefined;

    constructor() {
        super();
        this.validators.push((v: any) => typeof v === 'undefined');
    }
}

class NullChainBuilder extends BaseChainBuilder implements ThNullChain {
    declare readonly _type: null;

    constructor() {
        super();
        this.validators.push((v: any) => v === null);
    }
}

// ── LiteralChainBuilder ─────────────────────────────────────────────

class LiteralChainBuilder extends BaseChainBuilder {
    constructor(values: any[]) {
        super();
        this.validators.push((v: any) => values.includes(v));
    }
}

// ── RefTypeDefinition ────────────────────────────────────────────────

class RefTypeDefinition {
    private _resolve: () => any;
    private _resolved: TypeDefinitionImpl | null = null;
    private _isArray: boolean;

    constructor(resolve: () => any, isArray = false) {
        this._resolve = resolve;
        this._isArray = isArray;
    }

    private _get(): TypeDefinitionImpl {
        if (!this._resolved) {
            this._resolved = this._resolve() as TypeDefinitionImpl;
        }
        return this._resolved;
    }

    get array(): RefTypeDefinition {
        return new RefTypeDefinition(this._resolve, true);
    }

    get infer(): any {
        return undefined; // phantom — only meaningful at the type level
    }

    validate(value: any): boolean {
        const inner = this._get();
        if (this._isArray) {
            if (!Array.isArray(value)) return false;
            return value.every((item: any) => inner.validate(item));
        }
        return inner.validate(value);
    }
}

// ── TypeDefinitionImpl ───────────────────────────────────────────────

class TypeDefinitionImpl implements TypeDefinition {
    private _schema: Record<string, BaseChainBuilder | TypeDefinitionImpl | RefTypeDefinition>;
    private _isArray: boolean;

    constructor(schema: Record<string, BaseChainBuilder | TypeDefinitionImpl | RefTypeDefinition> = {}, isArray = false) {
        this._schema = schema;
        this._isArray = isArray;
    }

    get array(): TypeDefinitionImpl {
        return new TypeDefinitionImpl(this._schema, true);
    }

    get infer(): any {
        return undefined; // phantom — only meaningful at the type level
    }

    validate(value: any): boolean {
        if (this._isArray) {
            if (!Array.isArray(value)) return false;
            return value.every((item: any) => this._validateObject(item));
        }
        return this._validateObject(value);
    }

    private _validateObject(value: any): boolean {
        if (typeof value !== 'object' || value === null) return false;
        for (const [key, chain] of Object.entries(this._schema)) {
            if (chain instanceof BaseChainBuilder) {
                if (!chain.validate(value[key])) return false;
            } else if (chain instanceof TypeDefinitionImpl) {
                if (!chain.validate(value[key])) return false;
            } else if (chain instanceof RefTypeDefinition) {
                if (!chain.validate(value[key])) return false;
            }
        }
        return true;
    }
}

// ── createThType ─────────────────────────────────────────────────────

function createThType(): ThType {
    return {
        get str()       { return new StringChainBuilder(); },
        get string()    { return new StringChainBuilder(); },
        get num()       { return new NumberChainBuilder(); },
        get number()    { return new NumberChainBuilder(); },
        get bool()      { return new BooleanChainBuilder(); },
        get date()      { return new DateChainBuilder(); },
        get sym()       { return new SymbolChainBuilder(); },
        get symbol()    { return new SymbolChainBuilder(); },
        get bigInt()    { return new BigIntChainBuilder(); },
        get bigint()    { return new BigIntChainBuilder(); },
        get undefined() { return new UndefinedChainBuilder(); },
        get null()      { return new NullChainBuilder(); },
        literal(...values: any[]) {
            return new LiteralChainBuilder(values);
        },
        ref(fn: () => any) {
            return new RefTypeDefinition(fn);
        },
    } as unknown as ThType;
}

// ── th() factory ─────────────────────────────────────────────────────

export function th<S extends Record<string, ValidThField> | void>(
    cb: (t: ThType) => S
): TypeDefinition<S extends Record<string, ValidThField> ? InferSchema<S> : unknown> {
    const t = createThType();
    const schema = cb(t);
    return new TypeDefinitionImpl((schema ?? {}) as any);
}
