declare module 'observable-slim' {
    type ChangeType = 'add' | 'update' | 'delete' | 'splice';

    interface Change {
        type: ChangeType;
        property: string;
        currentPath: string;
        newValue: unknown;
        previousValue: unknown;
        target: object;
        proxy: object;
    }

    const ObservableSlim: {
        create<T extends object>(target: T, domDelay: boolean, handler: (changes: Change[]) => void): T;
        remove(proxy: object): void;
    };

    export default ObservableSlim;
}
