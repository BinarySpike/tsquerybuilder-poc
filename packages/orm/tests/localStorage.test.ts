import { describe, it, expect, beforeEach } from 'vitest';
import { Database } from '../src/index';
import { createLocalStorageCacheAdapter, createLocalStorageStorageAdapter } from '../src/localStorage';
import type { QueryDescriptor } from '../src/orm.types';
import { Customer, Address } from '../../schema/tests/testData.ts';

// ── localStorage mock for Node test environment ───────────────────────

const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
        key: (i: number) => Object.keys(store)[i] ?? null,
        get length() { return Object.keys(store).length; },
        clear: () => { store = {}; },
    };
})();
(global as any).localStorage = localStorageMock;

// ── Fixtures ──────────────────────────────────────────────────────────

const ALL: QueryDescriptor = { conditions: [], select: '*' };

const alice = {
    id: 1,
    companyName: 'Alice Co',
    email: 'alice@example.com',
    address: { number: '1', street: 'Main St', city: 'Springfield', zipCode: '55550' },
};

const bob = {
    id: 2,
    companyName: 'Bob Inc',
    email: 'bob@example.com',
    address: { number: '2', street: 'Oak Ave', city: 'Shelbyville', zipCode: '99990' },
};

// ── Helpers ───────────────────────────────────────────────────────────

function makeDb() {
    const cache = createLocalStorageCacheAdapter();
    const store = createLocalStorageStorageAdapter();
    const db = new Database(cache, store, { tables: { Customers: Customer, Addresses: Address } });
    return { db, cache, store };
}

// ── StoreAdapter tests ────────────────────────────────────────────────

describe('createLocalStorageStorageAdapter', () => {
    beforeEach(() => localStorage.clear());

    it('inserts and finds all records with no conditions', async () => {
        const store = createLocalStorageStorageAdapter();
        await store.insert('t', alice);
        await store.insert('t', bob);
        const results = await store.find('t', ALL);
        expect(results).toHaveLength(2);
    });

    it('findOne returns the first match', async () => {
        const store = createLocalStorageStorageAdapter();
        await store.insert('t', alice);
        await store.insert('t', bob);
        const result = await store.findOne('t', ALL);
        expect(result).toEqual(alice);
    });

    it('findOne returns null for empty table', async () => {
        const store = createLocalStorageStorageAdapter();
        const result = await store.findOne('t', ALL);
        expect(result).toBeNull();
    });

    it('deletes a record by id', async () => {
        const store = createLocalStorageStorageAdapter();
        await store.insert('t', alice);  // key = '0'
        await store.delete('t', '0');
        const results = await store.find('t', ALL);
        expect(results).toHaveLength(0);
    });

    it('updates a record by id', async () => {
        const store = createLocalStorageStorageAdapter();
        await store.insert('t', alice);  // key = '0'
        await store.update('t', '0', { ...alice, companyName: 'Updated' });
        const results = await store.find('t', ALL) as typeof alice[];
        expect(results[0].companyName).toBe('Updated');
    });
});

// ── CacheAdapter tests ────────────────────────────────────────────────

describe('createLocalStorageCacheAdapter', () => {
    beforeEach(() => localStorage.clear());

    it('set and get round-trips', async () => {
        const cache = createLocalStorageCacheAdapter();
        await cache.set('t', 1, alice);
        expect(await cache.get('t', 1)).toEqual(alice);
    });

    it('get returns null for missing key', async () => {
        const cache = createLocalStorageCacheAdapter();
        expect(await cache.get('t', 999)).toBeNull();
    });

    it('delete removes the record', async () => {
        const cache = createLocalStorageCacheAdapter();
        await cache.set('t', 1, alice);
        await cache.delete('t', 1);
        expect(await cache.get('t', 1)).toBeNull();
    });

    it('clear empties the table', async () => {
        const cache = createLocalStorageCacheAdapter();
        await cache.set('t', 1, alice);
        await cache.set('t', 2, bob);
        await cache.clear('t');
        const results = await cache.query('t', ALL);
        expect(results).toHaveLength(0);
    });

    it('query returns matching records', async () => {
        const cache = createLocalStorageCacheAdapter();
        await cache.set('t', 1, alice);
        await cache.set('t', 2, bob);
        const results = await cache.query('t', { conditions: [[['address.zipCode', 'is', '55550']]], select: '*' });
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(alice);
    });
});

// ── Database.query tests ──────────────────────────────────────────────

describe('Database.query (localStorage adapters)', () => {
    let db: ReturnType<typeof makeDb>['db'];
    let store: ReturnType<typeof makeDb>['store'];

    beforeEach(async () => {
        localStorage.clear();
        ({ db, store } = makeDb());
        await store.insert('Customers', alice);
        await store.insert('Customers', bob);
    });

    it('returns all records when no conditions are set', async () => {
        const results = await db.query('Customers').where('id').greaterThan(0);
        expect(results).toHaveLength(2);
    });

    it('filters by a top-level field with .is()', async () => {
        const results = await db.query('Customers').where('id').is(1);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(alice);
    });

    it('filters by a nested path', async () => {
        const results = await db.query('Customers').where('address.zipCode').is('55550');
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(alice);
    });

    it('returns empty array when no records match', async () => {
        const results = await db.query('Customers').where('id').is(999);
        expect(results).toHaveLength(0);
    });

    it('prefers cache results over store', async () => {
        localStorage.clear();
        const { db: freshDb, cache } = makeDb();
        await cache.set('Customers', 1, alice);
        const results = await freshDb.query('Customers').where('id').is(1);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(alice);
    });
});
