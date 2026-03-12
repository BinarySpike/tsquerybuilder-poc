import type { QueryBuilder } from './testheavy.ts'

let qb = {} as QueryBuilder;

qb.where()
qb.where().is()
qb.where().not.is()
qb.where().is().and.is()
qb.where().is().and.not.is()
qb.where().is().select()
qb.where().not.is().select()
qb.where().is().and.is().and.is().or.is().select()
qb.where().is().and.is().select()
qb.where().is().and.not.is().select()
qb.where().is().andWhere().not.is().select()
qb.where().is().and.not.is().andWhere().is().select()
qb.where().is().and.not.is().andWhere(i => i.where().is().and.is()).select()
qb.where().is().and.is().andWhere(i => i.where().is().or.is().and.is()).select()
qb.where(i => i.where().is()).and.is().and.is()
qb.where(i => i.where().is()).andWhere(i => i.where().is()).and.is()
qb.where().is().andWhere().is().and.not.is().select()
qb.where(i => i.where().is())
qb.where(i => i.where().not.is())
qb.where().is().andWhere(i => i.where().is()).select()
qb.where(i => i.where().is().andWhere().is()).select()

qb.where(a => a.where(b => b.where().is()))

qb.where().not.is().and.not.is().and.not.is().and.not.is().and.not.is().and.not.is().and.not.is().and.not.is().and.not.is().and.not.is().and.not.is().and.not.is().and.not.is().and.not.is()

// qb.where(i => i.where().is().select())
// qb.where(i => i.where().is().and.is().select())
