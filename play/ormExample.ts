import { Database } from '@topheavy/orm';
import { createMemoryCacheAdapter, createMemoryStoreAdapter } from '@topheavy/orm/inMemory';
import { Customer } from '../packages/schema/tests/testData';

const cache = createMemoryCacheAdapter();
const store = createMemoryStoreAdapter();
const db = new Database(
    {
        cache,
        store,
        reactive: true,
        tables: {
            Customers: Customer
        },
    }
);

const results = await db.query('Customers').where('address.zipCode').is('55550').select('companyName')

db.Transaction(results, r => {
    r.forEach(ri => ri.companyName = 'FooCorp')
})

// should kick out an error that mutating companyName is not allowed when reactive: false.  And should auto transaction when reactive is true.  This is why we use observable-slim
results.forEach(r => r.companyName = 'FooCorp')
