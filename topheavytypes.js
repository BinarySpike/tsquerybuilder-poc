// ── BaseChainBuilder ─────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class BaseChainBuilder {
    validators = [];
    _nullable = false;

    validate(value) {
        if (this._nullable && (value === null || value === undefined)) return true;
        return this.validators.every(fn => fn(value));
    }

    get nullable() {
        this._nullable = true;
        return this;
    }

    test(fn) {
        this.validators.push(fn);
        return this;
    }
}

// ── StringChainBuilder ───────────────────────────────────────────────

class StringChainBuilder extends BaseChainBuilder {
    len(n) {
        this.validators.push((v) => typeof v === 'string' && v.length === n);
        return this;
    }
    length(n) {
        this.validators.push((v) => typeof v === 'string' && v.length === n);
        return this;
    }
    minLen(n) {
        this.validators.push((v) => typeof v === 'string' && v.length >= n);
        return this;
    }
    maxLen(n) {
        this.validators.push((v) => typeof v === 'string' && v.length <= n);
        return this;
    }
    beginsWith(s) {
        this.validators.push((v) => typeof v === 'string' && v.startsWith(s));
        return this;
    }
    endsWith(s) {
        this.validators.push((v) => typeof v === 'string' && v.endsWith(s));
        return this;
    }
    contains(s) {
        this.validators.push((v) => typeof v === 'string' && v.includes(s));
        return this;
    }
    regex(pattern) {
        this.validators.push((v) => typeof v === 'string' && pattern.test(v));
        return this;
    }
    template(strings, ...exprs) {
        this.validators.push((v) => {
            if (typeof v !== 'string') return false;
            let pattern = '^';
            for (let i = 0; i < strings.length; i++) {
                pattern += strings[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (i < exprs.length) pattern += '.*';
            }
            pattern += '$';
            return new RegExp(pattern).test(v);
        });
        return this;
    }
    uppercase() {
        this.validators.push((v) => typeof v === 'string' && v === v.toUpperCase());
        return this;
    }
    lowercase() {
        this.validators.push((v) => typeof v === 'string' && v === v.toLowerCase());
        return this;
    }
    get email() {
        this.validators.push((v) => typeof v === 'string' && EMAIL_REGEX.test(v));
        return this;
    }
}

// ── NumberChainBuilder ───────────────────────────────────────────────

class NumberChainBuilder extends BaseChainBuilder {
    gt(n) {
        this.validators.push((v) => v > n);
        return this;
    }
    lt(n) {
        this.validators.push((v) => v < n);
        return this;
    }
    gte(n) {
        this.validators.push((v) => v >= n);
        return this;
    }
    lte(n) {
        this.validators.push((v) => v <= n);
        return this;
    }
    multipleOf(n) {
        this.validators.push((v) => typeof v === 'number' && v % n === 0);
        return this;
    }
    get unsigned() {
        this.validators.push((v) => typeof v === 'number' && v >= 0);
        return this;
    }
    get signed() {
        this.validators.push((v) => typeof v === 'number');
        return this;
    }
}

// ── BigIntChainBuilder ───────────────────────────────────────────────

class BigIntChainBuilder extends BaseChainBuilder {
    gt(n) {
        this.validators.push((v) => v > n);
        return this;
    }
    lt(n) {
        this.validators.push((v) => v < n);
        return this;
    }
    gte(n) {
        this.validators.push((v) => v >= n);
        return this;
    }
    lte(n) {
        this.validators.push((v) => v <= n);
        return this;
    }
    multipleOf(n) {
        this.validators.push((v) => typeof v === 'bigint' && v % n === 0n);
        return this;
    }
}

// ── DateChainBuilder ─────────────────────────────────────────────────

class DateChainBuilder extends BaseChainBuilder {
    gt(d) {
        this.validators.push((v) => v > d);
        return this;
    }
    lt(d) {
        this.validators.push((v) => v < d);
        return this;
    }
    gte(d) {
        this.validators.push((v) => v >= d);
        return this;
    }
    lte(d) {
        this.validators.push((v) => v <= d);
        return this;
    }
    min(s) {
        this.validators.push((v) => v instanceof Date && v >= new Date(s));
        return this;
    }
    max(s) {
        this.validators.push((v) => v instanceof Date && v <= new Date(s));
        return this;
    }
}

// ── Simple chain builders ────────────────────────────────────────────

class BooleanChainBuilder extends BaseChainBuilder { }
class SymbolChainBuilder extends BaseChainBuilder { }
class UndefinedChainBuilder extends BaseChainBuilder { }
class NullChainBuilder extends BaseChainBuilder { }

// ── LiteralChainBuilder ─────────────────────────────────────────────

class LiteralChainBuilder extends BaseChainBuilder {
    constructor(values) {
        super();
        this.validators.push((v) => values.includes(v));
    }
}

// ── TypeDefinitionImpl ───────────────────────────────────────────────

class TypeDefinitionImpl {
    _schema;
    _isArray;

    constructor(schema = {}, isArray = false) {
        this._schema = schema;
        this._isArray = isArray;
    }

    get array() {
        return new TypeDefinitionImpl(this._schema, true);
    }

    get infer() {
        return undefined; // phantom — only meaningful at the type level
    }

    validate(value) {
        if (this._isArray) {
            if (!Array.isArray(value)) return false;
            return value.every((item) => this._validateObject(item));
        }
        return this._validateObject(value);
    }

    _validateObject(value) {
        if (typeof value !== 'object' || value === null) return false;
        for (const [key, chain] of Object.entries(this._schema)) {
            if (chain instanceof BaseChainBuilder) {
                if (!chain.validate(value[key])) return false;
            } else if (chain instanceof TypeDefinitionImpl) {
                if (!chain.validate(value[key])) return false;
            }
        }
        return true;
    }
}

// ── createThType ─────────────────────────────────────────────────────

function createThType() {
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
        literal(...values) {
            return new LiteralChainBuilder(values);
        },
    };
}

// ── th() factory ─────────────────────────────────────────────────────

export function th(cb) {
    const t = createThType();
    const schema = cb(t);
    return new TypeDefinitionImpl(schema ?? {});
}
