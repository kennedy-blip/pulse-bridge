import {defineConfig} from 'vite';
export default defineConfig({server:{allowedHosts:true},build:{rollupOptions:{onwarn(warn,handler){if(warn.code!=='MODULE_LEVEL_DIRECTIVE'||!warn.message.includes('use client'))handler(warn);},output:{manualChunks:{animation:['framer-motion'],storage:['dexie','dexie-react-hooks']}}}}});
