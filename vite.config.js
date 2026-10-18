// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'nitro-renderer',
            fileName: 'nitro-renderer'
        }
    },
    server: {
        host: '127.0.0.1'
    }
});
