 ---                                                                                                                                                               
  TypeScript Compilation Errors (8 errors)                                                                                                                          
                                                                                                                                                                    
  Every subclass that overrides the nullable getter has the same error — the return type narrows away from this. In BaseChainBuilder, nullable returns this, but    
  each override returns a specific interface (e.g., ThStringChain<null>), which TS can't prove is assignable to this.                                               
                                                                                                                                                                    
  Fix: Change the base class nullable getter to not return this — instead return BaseChainBuilder, or suppress the override errors by not using override and casting
   differently. The cleanest solution is likely to remove the polymorphic this return from the base and have each subclass define its own nullable without override.
                                                                                                                                                                    
  ---             
  Logic / Runtime Issues
                                                                                                                                                                    
  1. _validateObject doesn't reject extra keys (schema.ts:484-492) — Validation only checks that schema-defined fields pass; it silently accepts objects with extra
  properties. This may be intentional (open schemas), but if you want strict validation, you'd need an extra-keys check.                                            
  2. _validateObject doesn't check for missing keys — If a field is not nullable but the key is entirely absent from the object, value[key] is undefined, which gets
   passed to the chain's validate(). For non-nullable chains, the base type check (e.g., typeof v === 'string') will fail, so this does reject — but the error      
  reason is opaque ("not a string" vs "field missing").
  3. multipleOf with floats (schema.ts:216) — v % n === 0 is unreliable for floating-point numbers (e.g., 0.3 % 0.1 !== 0). Consider using a tolerance-based check  
  like Math.abs(v % n) < Number.EPSILON.                                                                                                                            
  4. template ignores interpolated chain constraints (schema.ts:134-146) — As your TODO.md notes, all interpolation slots emit .* regardless of what chain was
  passed. This is a known TODO but worth flagging.                                                                                                                  
  5. len and length are independent (schema.ts:78-89) — These are documented as aliases but they record different constraint names ('len' vs 'length'). If anything
  inspects constraints by name, this inconsistency could bite you. Consider having one delegate to the other.                                                       
                  
  ---                                                                                                                                                               
  Query Module Issues
                                                                                                                                                                    
  6. where() with subquery pushes conditions at top level (query.ts:40-44) — Subquery conditions are spread directly into the parent's _conditions via
  push(...sub._conditions). This flattens the grouping — the subquery loses its parenthesization semantics. You likely want to push the sub-conditions as a nested  
  group: this._conditions.push(sub._conditions).
  7. Mutability — QueryBuilderImpl mutates internal state (_negated, _currentPath, _currentGroup). The chain methods return this, so the builder can't be forked.   
  This is fine for single-use query building, but worth noting compared to the schema module which uses immutable cloning.                                          
  8. select with aggregate-only doesn't handle empty paths (query.ts:133-152) — When calling select(aggregateFn), paths ends up as [] (empty array) but is still
  included in the result as select: []. This works but differs from the type signature where aggregate-only select should not include select.                       
                  
  ---                                                                                                                                                               
  Type-Level Issues
                                                                                                                                                                    
  9. SelectResult produces intersection, not a clean object (path.ts:29-32) — SelectResult builds { a: X } & { b: Y } via intersection. This works at the type level
   but IDE tooltips will be messy. A mapped-type approach would produce cleaner output.                                                                             
  10. Paths recurses into nested objects without depth limit (path.ts:9-14) — For deeply nested or self-referential types, this can cause TS to hit its recursion
  limit. The PathsWrapper helps defer evaluation but doesn't actually cap depth.                                                                                    
  11. Paths doesn't traverse into arrays — If a field is string[], the path stops there — you can't query items.0.description. This seems intentional given the
  ArrayCondition type, but worth documenting.                                                                                                                       
                  
  ---                                                                                                                                                               
  Minor / Style   
               
  12. signed constraint (schema.ts:227-232) — The signed getter just checks Number.isFinite(v), which doesn't really mean "signed." All finite numbers (including
  positive ones) pass. It's unclear what the intended semantics are.                                                                                                
  13. email regex is very permissive (schema.ts:25) — /^[^\s@]+@[^\s@]+\.[^\s@]+$/ accepts things like a@b.c. This is common and probably fine for a basic check,
  but worth noting.                                                                                                                                                 
                  
  The most impactful issues to address are the TS compilation errors (#1), the subquery flattening bug (#6), and the floating-point modulo (#3).  