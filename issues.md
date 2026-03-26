  ---             
  Logic / Runtime Issues
                                                                                                                                                                                                                                                                                       
  4. template ignores interpolated chain constraints (schema.ts:134-146) — As your TODO.md notes, all interpolation slots emit .* regardless of what chain was
  passed. This is a known TODO but worth flagging.                                                                                                           

