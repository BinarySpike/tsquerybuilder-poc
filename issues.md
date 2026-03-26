  ---             
  Logic / Runtime Issues
                                                                                                                                                                                                                                                                                       
  4. template ignores interpolated chain constraints (schema.ts:134-146) — As your TODO.md notes, all interpolation slots emit .* regardless of what chain was
  passed. This is a known TODO but worth flagging.                                                                                                                  

  ---                                                                                                                                                               
  Query Module Issues
                                                                                                                                                                    
                                       
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