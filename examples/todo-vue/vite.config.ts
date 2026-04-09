import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: [
            { find: '@topheavy/orm/localStorage', replacement: path.resolve(__dirname, '../../packages/orm/src/localStorage.ts') },
            { find: '@topheavy/orm/inMemory',     replacement: path.resolve(__dirname, '../../packages/orm/src/inMemory.ts') },
            { find: '@topheavy/orm',              replacement: path.resolve(__dirname, '../../packages/orm/src/index.ts') },
            { find: '@topheavy/schema',           replacement: path.resolve(__dirname, '../../packages/schema/src/index.ts') },
            { find: '@topheavy/query',            replacement: path.resolve(__dirname, '../../packages/query/src/index.ts') },
        ],
    },
});
