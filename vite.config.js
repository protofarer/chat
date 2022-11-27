import { defineConfig, loadEnv } from 'vite'
import fs from 'fs';

// export default defineConfig(({ root: "app", envDir: "../" }) => {

// }
export default defineConfig({
  root: "app",
  // root: ".",
  mode: "development",
  envDir: "../",
  // envDir: ".",
  // publicDir: '../public',
  // publicDir: './app',
  server: {
    port: 3001
  },
  // build: {
  //   rollupOptions: {
  //     input: 'app/index.js',
  //     output: {
  //       dir: 'public',
  //       entryFileNames: 'assets/[name].js',
  //       sourcemap: true,
  //     },
  //   },
  // },
})

// })

  // https: {
  //   key: fs.readFileSync('key.pem'),
  //   cert: fs.readFileSync('cert.pem')
  // },
  // server: {
  //   port: 3333,
    // https: true,
  // }
  //
  // OR
  //
  // server: {
  //   https: {
  //     key: fs.readFileSync('key.pem'),
  //     cert: fs.readFileSync('cert.pem')
  //   },
  //   open: true
  // }