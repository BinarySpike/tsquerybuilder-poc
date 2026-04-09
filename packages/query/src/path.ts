// 1. Define the wrapper interface to defer evaluation
export interface PathsWrapper<T> {
    [K: string]: any;
    // This property acts as the "deferred" entry point
    value: Paths<T>;
}
 
// 2. Your Paths type now points to the wrapper's property
export type Paths<T> = T extends Date | Array<any> ? never :
    T extends object ? { [K in keyof T]:
        K extends string | number ?
        `${K}` | (
            T[K] extends Array<infer U> ?
                (U extends object ? `${K}.${PathsWrapper<U>['value']}` : never) :
                T[K] extends object ? `${K}.${PathsWrapper<T[K]>['value']}` : never
        )
        : never
    }[keyof T] : never;
 
// PathType resolves a dotted path, broadcasting through arrays
export type PathType<T, P extends string> =
    P extends `${infer Key}.${infer Rest}` ?
    Key extends keyof T ?
        T[Key] extends Array<infer U> ?
            PathType<U, Rest>[] :
            PathType<T[Key], Rest>
    : never
    : P extends keyof T ? T[P] : never;
