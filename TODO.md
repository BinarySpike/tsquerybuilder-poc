# TODO

## Research mutable versus immutable query chain building
  7. Mutability — QueryBuilderImpl mutates internal state (_negated, _currentPath, _currentGroup). The chain methods return this, so the builder can't be forked.   
  This is fine for single-use query building, but worth noting compared to the schema module which uses immutable cloning.

 - Query builders are inherently single-use — you build a query, call select()/selectAll(), and you're done. Forking a half-built query is an unusual pattern that rarely comes up in practice.
 - The schema module benefits from immutability because chains are reusable building blocks (e.g. t.str.minLen(3) might be used across multiple schemas). Query builders don't have that reuse pattern.
 - Cloning on every method call (where, and, or, condition methods, orderBy) would add allocation overhead and complexity for no practical gain. The schema module only clones on constraint methods, but a query builder mutates much more frequently per usage.


 ## Signed
 Research Signed/Unsigned/Int/Int32/Positive/Negative/Safe etc.