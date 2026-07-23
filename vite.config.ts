import {defineConfig} from "vite";

export default defineConfig({
    base: './',
    build: {
        minify: 'terser',
        terserOptions: {
            ecma: 2025,
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
            format: {
                comments: false,
            }
        },
    }
})