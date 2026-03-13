// 1. Define the wrapper interface to defer evaluation
interface PathsWrapper<T> {
    // This property acts as the "deferred" entry point
    value: Paths<T>;
}
 
// 2. Your Paths type now points to the wrapper's property
export type Paths<T> = T extends Date | Array<any> ? never :
    T extends object ? { [K in keyof T]:
        K extends string | number ?
        `${K}` | (T[K] extends object ? `${K}.${PathsWrapper<T[K]>['value']}` : never)
        : never
    }[keyof T] : never;
 
// PathType remains the same as it handles the resolved strings
export type PathType<T, P extends string> =
    P extends `${infer Key}.${infer Rest}` ?
    Key extends keyof T ?
    PathType<T[Key], Rest>
    : never
    : P extends keyof T ? T[P] : never;

// Extract the last segment of a dotted path string
export type LeafKey<P extends string> =
    P extends `${string}.${infer Rest}` ? LeafKey<Rest> : P;

// Build a result type from a tuple of paths
export type SelectResult<T, P extends any[]> =
    P extends [infer First extends string, ...infer Rest]
    ? { [K in LeafKey<First>]: PathType<T, First> } & SelectResult<T, Rest>
    : {};
