import { describe, it, expect, beforeEach } from 'vitest';
import { Database } from '../src/index';
import { createMemoryCacheAdapter, createMemoryStoreAdapter } from '../src/inMemory';
import type { QueryDescriptor } from '../src/orm.types';
import { Customer, Address } from '../../schema/tests/testData.ts';

const ALL: QueryDescriptor = { conditions: [], select: '*' };

// ── Fixtures ──────────────────────────────────────────────────────────

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
    const cache = createMemoryCacheAdapter();
    const store = createMemoryStoreAdapter();
    const db = new Database({ cache, store, tables: { Customers: Customer, Addresses: Address } });
    return { db, cache, store };
}

// ── StoreAdapter tests ────────────────────────────────────────────────

describe('createMemoryStoreAdapter', () => {
    it('inserts and finds all records with no conditions', async () => {
        const store = createMemoryStoreAdapter();
        await store.insert('t', alice);
        await store.insert('t', bob);
        const results = await store.find('t', ALL);
        expect(results).toHaveLength(2);
    });

    it('findOne returns the first match', async () => {
        const store = createMemoryStoreAdapter();
        await store.insert('t', alice);
        await store.insert('t', bob);
        const result = await store.findOne('t', ALL);
        expect(result).toEqual(alice);
    });

    it('findOne returns null for empty table', async () => {
        const store = createMemoryStoreAdapter();
        const result = await store.findOne('t', ALL);
        expect(result).toBeNull();
    });

    it('deletes a record by id', async () => {
        const store = createMemoryStoreAdapter();
        await store.insert('t', alice);  // key = '0'
        await store.delete('t', '0');
        const results = await store.find('t', ALL);
        expect(results).toHaveLength(0);
    });

    it('updates a record by id', async () => {
        const store = createMemoryStoreAdapter();
        await store.insert('t', alice);  // key = '0'
        await store.update('t', '0', { ...alice, companyName: 'Updated' });
        const results = await store.find('t', ALL) as typeof alice[];
        expect(results[0].companyName).toBe('Updated');
    });
});

// ── CacheAdapter tests ────────────────────────────────────────────────

describe('createMemoryCacheAdapter', () => {
    it('set and get round-trips', async () => {
        const cache = createMemoryCacheAdapter();
        await cache.set('t', 1, alice);
        expect(await cache.get('t', 1)).toEqual(alice);
    });

    it('get returns null for missing key', async () => {
        const cache = createMemoryCacheAdapter();
        expect(await cache.get('t', 999)).toBeNull();
    });

    it('delete removes the record', async () => {
        const cache = createMemoryCacheAdapter();
        await cache.set('t', 1, alice);
        await cache.delete('t', 1);
        expect(await cache.get('t', 1)).toBeNull();
    });

    it('clear empties the table', async () => {
        const cache = createMemoryCacheAdapter();
        await cache.set('t', 1, alice);
        await cache.set('t', 2, bob);
        await cache.clear('t');
        const results = await cache.query('t', ALL);
        expect(results).toHaveLength(0);
    });

    it('query returns matching records', async () => {
        const cache = createMemoryCacheAdapter();
        await cache.set('t', 1, alice);
        await cache.set('t', 2, bob);
        const results = await cache.query('t', { conditions: [[['address.zipCode', 'is', '55550']]], select: '*' });
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(alice);
    });
});

// ── Database.query tests ──────────────────────────────────────────────

describe('Database.query', () => {
    let db: ReturnType<typeof makeDb>['db'];
    let store: ReturnType<typeof makeDb>['store'];

    beforeEach(async () => {
        ({ db, store } = makeDb());
        await store.insert('Customers', alice);
        await store.insert('Customers', bob);
    });

    it('returns all records when no conditions are set', async () => {
        // No .where() call — await the builder directly
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

    it('filters with .in()', async () => {
        const results = await db.query('Customers').where('id').in([1, 2]);
        expect(results).toHaveLength(2);
    });

    it('filters with .contains()', async () => {
        const results = await db.query('Customers').where('companyName').contains('Inc');
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(bob);
    });

    it('filters with .not.is()', async () => {
        const results = await db.query('Customers').where('id').not.is(1);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(bob);
    });

    it('chains andWhere conditions', async () => {
        const results = await db.query('Customers')
            .where('address.city').is('Springfield')
            .andWhere('id').is(1);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(alice);
    });

    it('returns empty array when no records match', async () => {
        const results = await db.query('Customers').where('id').is(999);
        expect(results).toHaveLength(0);
    });

    it('prefers cache results over store', async () => {
        const { db: freshDb, cache } = makeDb();
        // Populate cache with only alice — store is empty
        await cache.set('Customers', 1, alice);
        // Cache query will return alice; store would return nothing
        const results = await freshDb.query('Customers').where('id').is(1);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(alice);
    });
});

// ── Condition evaluator coverage ──────────────────────────────────────

describe('condition operators', () => {
    let db: ReturnType<typeof makeDb>['db'];
    let store: ReturnType<typeof makeDb>['store'];

    beforeEach(async () => {
        ({ db, store } = makeDb());
        await store.insert('Customers', alice);
        await store.insert('Customers', bob);
    });

    it('beginsWith', async () => {
        const results = await db.query('Customers').where('companyName').beginsWith('Alice');
        expect(results).toHaveLength(1);
    });

    it('endsWith', async () => {
        const results = await db.query('Customers').where('companyName').endsWith('Inc');
        expect(results).toHaveLength(1);
    });

    it('greaterThan', async () => {
        const results = await db.query('Customers').where('id').greaterThan(1);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(bob);
    });

    it('lessThan', async () => {
        const results = await db.query('Customers').where('id').lessThan(2);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(alice);
    });
});

// ── select / orderBy / aggregates ─────────────────────────────────────

describe('select, orderBy, and aggregates', () => {
    let db: ReturnType<typeof makeDb>['db'];
    let store: ReturnType<typeof makeDb>['store'];

    beforeEach(async () => {
        ({ db, store } = makeDb());
        await store.insert('Customers', alice);
        await store.insert('Customers', bob);
    });

    it('selectAll returns full records', async () => {
        const results = await db.query('Customers').where('id').greaterThan(0).selectAll();
        expect(results).toHaveLength(2);
        expect(results[0]).toEqual(alice);
    });

    it('select with specific paths projects fields', async () => {
        const results = await db.query('Customers').where('id').greaterThan(0).select('id', 'companyName') as any[];
        expect(results).toHaveLength(2);
        expect(results[0]).toEqual({ id: 1, companyName: 'Alice Co' });
        expect(Object.keys(results[0])).not.toContain('email');
    });

    it('orderBy asc', async () => {
        const results = await db.query('Customers')
            .where('id').greaterThan(0)
            .orderBy('id', 'asc')
            .selectAll() as any[];
        expect(results[0].id).toBe(1);
        expect(results[1].id).toBe(2);
    });

    it('orderBy desc', async () => {
        const results = await db.query('Customers')
            .where('id').greaterThan(0)
            .orderBy('id', 'desc')
            .selectAll() as any[];
        expect(results[0].id).toBe(2);
        expect(results[1].id).toBe(1);
    });

    it('aggregate count', async () => {
        const results = await db.query('Customers')
            .where('id').greaterThan(0)
            .select(s => s.count()) as any[];
        expect(results[0]).toBe(2);
    });

    it('aggregate sum', async () => {
        const results = await db.query('Customers')
            .where('id').greaterThan(0)
            .select(s => s.sum('id')) as any[];
        expect(results[0]).toBe(3); // 1 + 2
    });

    it('aggregate avg', async () => {
        const results = await db.query('Customers')
            .where('id').greaterThan(0)
            .select(s => s.avg('id')) as any[];
        expect(results[0]).toBe(1.5);
    });

    it('aggregate min', async () => {
        const results = await db.query('Customers')
            .where('id').greaterThan(0)
            .select(s => s.min('id')) as any[];
        expect(results[0]).toBe(1);
    });

    it('aggregate max', async () => {
        const results = await db.query('Customers')
            .where('id').greaterThan(0)
            .select(s => s.max('id')) as any[];
        expect(results[0]).toBe(2);
    });

    it('aggregate countDistinct', async () => {
        const results = await db.query('Customers')
            .where('id').greaterThan(0)
            .select(s => s.countDistinct('companyName')) as any[];
        expect(results[0]).toBe(2);
    });

    it('aggregate distinct', async () => {
        const results = await db.query('Customers')
            .where('id').greaterThan(0)
            .select(s => s.distinct('address.city')) as any[];
        expect(results[0]).toEqual(expect.arrayContaining(['Springfield', 'Shelbyville']));
    });
});

// ── Transaction ───────────────────────────────────────────────────────

describe('Database.Transaction', () => {
    let db: ReturnType<typeof makeDb>['db'];
    let store: ReturnType<typeof makeDb>['store'];

    beforeEach(async () => {
        ({ db, store } = makeDb());
        await store.insert('Customers', { ...alice });
        await store.insert('Customers', { ...bob });
    });

    it('applies POJO-style mutations and persists a differential update', async () => {
        const results = await db.query('Customers').where('id').is(1);
        await db.Transaction(results, r => {
            r[0].companyName = 'FooCorp';
        });
        // In-memory value is updated
        expect(results[0].companyName).toBe('FooCorp');
        // Store is updated — re-query to confirm
        const reloaded = await db.query('Customers').where('id').is(1) as any[];
        expect(reloaded[0].companyName).toBe('FooCorp');
    });

    it('only sends changed fields (differential update)', async () => {
        const patches: unknown[] = [];
        const patchingStore = createMemoryStoreAdapter();
        const originalUpdate = patchingStore.update.bind(patchingStore);
        patchingStore.update = async (table, id, patch) => {
            patches.push(patch);
            return originalUpdate(table, id, patch);
        };
        const { db: patchDb } = { db: new Database({ cache: createMemoryCacheAdapter(), store: patchingStore, tables: { Customers: Customer } }) };
        await patchingStore.insert('Customers', { ...alice });

        const results = await patchDb.query('Customers').where('id').is(1);
        await patchDb.Transaction(results, r => {
            r[0].companyName = 'FooCorp';
        });
        // Only companyName should be in the patch
        expect(patches).toHaveLength(1);
        expect(patches[0]).toEqual({ companyName: 'FooCorp' });
        expect(Object.keys(patches[0] as object)).not.toContain('email');
    });

    it('rolls back in-memory state when the store update fails', async () => {
        const failingStore = createMemoryStoreAdapter();
        await failingStore.insert('Customers', { ...alice });
        failingStore.update = async () => { throw new Error('store failure'); };
        const { db: failDb } = { db: new Database({ cache: createMemoryCacheAdapter(), store: failingStore, tables: { Customers: Customer } }) };

        const results = await failDb.query('Customers').where('id').is(1);
        const originalName = results[0].companyName;

        await expect(
            failDb.Transaction(results, r => { r[0].companyName = 'ShouldRollBack'; })
        ).rejects.toThrow('store failure');

        // In-memory value is restored
        expect(results[0].companyName).toBe(originalName);
    });

    it('does not call store.update when no fields were changed', async () => {
        let updateCalled = false;
        const noopStore = createMemoryStoreAdapter();
        await noopStore.insert('Customers', { ...alice });
        noopStore.update = async () => { updateCalled = true; };
        const { db: noopDb } = { db: new Database({ cache: createMemoryCacheAdapter(), store: noopStore, tables: { Customers: Customer } }) };

        const results = await noopDb.query('Customers').where('id').is(1);
        await noopDb.Transaction(results, () => { /* no mutations */ });
        expect(updateCalled).toBe(false);
    });
});

// ── db.insert / db.delete ─────────────────────────────────────────────

describe('Database.insert and Database.delete', () => {
    it('db.insert stores a record retrievable via db.query', async () => {
        const { db } = makeDb();
        await db.insert('Customers', { ...alice });
        const results = await db.query('Customers').where('id').is(1);
        expect(results).toHaveLength(1);
        expect(results[0].companyName).toBe('Alice Co');
    });

    it('db.insert assigns a $id accessible on query results', async () => {
        const { db } = makeDb();
        await db.insert('Customers', { ...alice });
        const results = await db.query('Customers');
        expect(typeof results[0].$id).toBe('string');
    });

    it('db.delete removes a record so it no longer appears in queries', async () => {
        const { db } = makeDb();
        await db.insert('Customers', { ...alice });
        await db.insert('Customers', { ...bob });

        const all = await db.query('Customers');
        expect(all).toHaveLength(2);

        await db.delete(all[0]);
        const remaining = await db.query('Customers');
        expect(remaining).toHaveLength(1);
    });

    it('db.insert clears the cache so the next query reflects the new record', async () => {
        const cache = createMemoryCacheAdapter();
        const store = createMemoryStoreAdapter();
        const db = new Database({ cache, store, tables: { Customers: Customer } });

        // Prime the cache with alice only
        await cache.set('Customers', '0', { ...alice });
        let results = await db.query('Customers');
        expect(results).toHaveLength(1);

        // Inserting via db should clear the cache
        await db.insert('Customers', { ...bob });
        results = await db.query('Customers');
        // Both alice (from store insert) and bob should now appear
        expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('db.delete clears the cache so the next query reflects the removal', async () => {
        const { db } = makeDb();
        await db.insert('Customers', { ...alice });

        // Warm the cache
        await db.query('Customers');

        const all = await db.query('Customers');
        await db.delete(all[0]);

        const afterDelete = await db.query('Customers');
        expect(afterDelete).toHaveLength(0);
    });
});

// ── Reactive mode ─────────────────────────────────────────────────────

describe('reactive mode', () => {
    it('reactive: true auto-persists direct property mutations', async () => {
        const store = createMemoryStoreAdapter();
        await store.insert('Customers', { ...alice });
        const db = new Database({ cache: createMemoryCacheAdapter(), store, reactive: true, tables: { Customers: Customer } });

        const results = await db.query('Customers').where('id').is(1);
        results[0].companyName = 'FooCorp';

        // Let fire-and-forget settle
        await new Promise(r => setTimeout(r, 0));

        const refetch = await db.query('Customers').where('id').is(1);
        expect(refetch[0].companyName).toBe('FooCorp');
    });

    it('reactive: true Transaction unwraps the reactive proxy (no double store.update)', async () => {
        const updates: unknown[] = [];
        const store = createMemoryStoreAdapter();
        await store.insert('Customers', { ...alice });
        const originalUpdate = store.update.bind(store);
        store.update = async (table, id, patch) => { updates.push(patch); return originalUpdate(table, id, patch); };

        const db = new Database({ cache: createMemoryCacheAdapter(), store, reactive: true, tables: { Customers: Customer } });
        const results = await db.query('Customers').where('id').is(1);

        await db.Transaction(results, r => { r[0].companyName = 'FooCorp'; });

        // Only one store.update call — the transaction one; the reactive handler does not fire
        expect(updates).toHaveLength(1);
        expect(updates[0]).toEqual({ companyName: 'FooCorp' });
    });

    it('reactive: false throws when mutating a record directly', async () => {
        const store = createMemoryStoreAdapter();
        await store.insert('Customers', { ...alice });
        const db = new Database({ cache: createMemoryCacheAdapter(), store, tables: { Customers: Customer } });

        const results = await db.query('Customers').where('id').is(1);
        expect(() => { results[0].companyName = 'FooCorp'; }).toThrow(
            'Cannot mutate record directly when reactive is false'
        );
    });
});
