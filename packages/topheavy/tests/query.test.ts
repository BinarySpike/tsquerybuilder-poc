import { describe, it, expect } from 'vitest';
import { query } from '../src/query';
import { Invoice } from './testData.ts';

type InvoiceType = typeof Invoice.infer;

describe('and/or condition group correctness (Issue #3)', () => {
  it('strips trailing logical operator if chain is abandoned after .and', () => {
    const q = query<InvoiceType>().where('invoiceNumber').is('1234') as any;
    q.and; // access .and without following it with a condition
    expect(q.getConditions()).toEqual([
      [['invoiceNumber', 'is', '1234']],
    ]);
  });

  it('strips trailing logical operator if chain is abandoned after .or', () => {
    const q = query<InvoiceType>().where('invoiceNumber').is('1234') as any;
    q.or; // access .or without following it with a condition
    expect(q.getConditions()).toEqual([
      [['invoiceNumber', 'is', '1234']],
    ]);
  });

  it('.and resets a leaked _negated flag before the next condition', () => {
    const q = query<InvoiceType>().where('invoiceNumber').is('1234') as any;
    q.not; // sets _negated = true without consuming it
    q.and.is('5678'); // .and should clear _negated; 'is' should NOT be negated
    expect(q.getConditions()).toEqual([
      [['invoiceNumber', 'is', '1234'], 'and', ['invoiceNumber', 'is', '5678']],
    ]);
  });

  it('.or resets a leaked _negated flag before the next condition', () => {
    const q = query<InvoiceType>().where('invoiceNumber').is('1234') as any;
    q.not; // sets _negated = true without consuming it
    q.or.is('5678'); // .or should clear _negated; 'is' should NOT be negated
    expect(q.getConditions()).toEqual([
      [['invoiceNumber', 'is', '1234'], 'or', ['invoiceNumber', 'is', '5678']],
    ]);
  });

  it('does not add leading logical operator when .and is called on empty group', () => {
    // Simulates misuse: calling .and before any condition on the path
    const q = query<InvoiceType>() as any;
    q.where('invoiceNumber');
    q.and.is('1234'); // group was empty when .and was accessed
    expect(q.getConditions()).toEqual([
      [['invoiceNumber', 'is', '1234']],
    ]);
  });

  it('andWhere as first call does not produce a leading operator', () => {
    const q = query<InvoiceType>() as any;
    q.andWhere('invoiceNumber').is('1234');
    expect(q.getConditions()).toEqual([
      [['invoiceNumber', 'is', '1234']],
    ]);
  });

  it('orWhere as first call does not produce a leading operator', () => {
    const q = query<InvoiceType>() as any;
    q.orWhere('invoiceNumber').is('1234');
    expect(q.getConditions()).toEqual([
      [['invoiceNumber', 'is', '1234']],
    ]);
  });

  it('_negated is cleared on group finalization', () => {
    const q = query<InvoiceType>() as any;
    q.where('invoiceNumber').is('1234');
    q.not; // set _negated without consuming it
    // andWhere triggers _finalizeGroup, which should clear _negated
    q.andWhere('customer.companyName').is('Acme');
    expect(q.getConditions()).toEqual([
      [['invoiceNumber', 'is', '1234']],
      'and',
      [['customer.companyName', 'is', 'Acme']],
    ]);
  });
});

describe('query builder', () => {
  it('builds complex where/andWhere/orWhere conditions', () => {
    const results = query<InvoiceType>()
      .where("invoiceNumber").contains("5").or.contains("7")
      .andWhere(i => i.where("customer.companyName").is("Luna").or.is("Moon")
        .andWhere("customer.id").in([1, 2, 3]));

    const expectedCondition = [
      [["invoiceNumber", "contains", "5"], "or", ["invoiceNumber", "contains", "7"]],
      "and",
      [
        [["customer.companyName", "is", "Luna"], "or", ["customer.companyName", "is", "Moon"]],
        "and",
        [["customer.id", "in", [1, 2, 3]]],
      ],
    ];

    expect(results.getConditions()).toEqual(expectedCondition);
  });

  it('supports field select', () => {
    const result = query<InvoiceType>()
      .where("invoiceNumber").is("1234")
      .select("invoiceNumber", "customer.address");

    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('select', ["invoiceNumber", "customer.address"]);
  });

  it('supports aggregate-only select', () => {
    const result = query<InvoiceType>()
      .where("invoiceNumber").is("1234")
      .select(s => s.countDistinct("customer.address.city"));

    expect((result as any).aggregate).toHaveProperty('type', 'countDistinct');
    expect((result as any).aggregate).toHaveProperty('path', 'customer.address.city');
  });

  it('supports combined field + aggregate select', () => {
    const result = query<InvoiceType>()
      .where("invoiceNumber").is("1234")
      .select("invoiceNumber", "customer.address", s => s.countDistinct("customer.address.city"));

    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('select', ["invoiceNumber", "customer.address"]);
    expect(result).toHaveProperty('aggregate');
    expect((result as any).aggregate).toEqual({ type: 'countDistinct', path: 'customer.address.city' });
  });

  it('supports selectAll', () => {
    const result = query<InvoiceType>()
      .where("customer.id").is(1)
      .selectAll();

    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('select', '*');
  });

  it('supports orderBy + select', () => {
    const result = query<InvoiceType>()
      .where("invoiceNumber").is("1234")
      .orderBy("invoiceNumber", "desc")
      .orderBy("customer.address.city")
      .select("invoiceNumber");

    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('select', ["invoiceNumber"]);
    expect(result).toHaveProperty('orderBy');
    expect((result as any).orderBy).toEqual([
      { path: "invoiceNumber", direction: "desc" },
      { path: "customer.address.city", direction: "asc" },
    ]);
  });
});
