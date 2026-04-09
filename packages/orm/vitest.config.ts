import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@topheavy/query': path.resolve(__dirname, '../query/src/index.ts'),
            '@topheavy/schema': path.resolve(__dirname, '../schema/src/index.ts'),
        },
    },
});
