import type { QueryBuilder } from './testheavy'

let qb = {} as QueryBuilder;

qb.where()
qb.where().is()
qb.where().not.is()
qb.where().is().and.is()
qb.where().is().and.not.is()
qb.where().is().select()
qb.where().not.is().select()
qb.where().is().and.is().select()
qb.where().is().and.not.is().select()
qb.where().is().andWhere().not.is().select()
qb.where().is().andWhere().is().and.not.is().select()
qb.where(i => i.where().is())
qb.where(i => i.where().not.is()).select()
qb.where().is().andWhere(i => i.where().is()).select()
qb.where(i => i.where().is().andWhere().is()).select()
