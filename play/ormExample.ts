import { Database } from '@topheavy/orm';
import { createMemoryCacheAdapter, createMemoryStoreAdapter } from '@topheavy/orm/inMemory';
import { Customer } from '../packages/schema/tests/testData';

const cache = createMemoryCacheAdapter();
const store = createMemoryStoreAdapter();
const db = new Database(cache, store,
    {
        tables: {
            Customers: Customer
        },
    }
);

const results = await db.query('Customers').where('address.zipCode').is('55550').select('companyName')

db.Transaction(results, r => {
    r.forEach(ri => ri.companyName = 'FooCorp')
})
