import { defineConfig, loadEnv } from 'vite'
import fs from 'fs';

// export default defineConfig(({ root: "app", envDir: "../" }) => {

// }
export default defineConfig({
  root: "app",
  mode: "development",
  envDir: "../",
  publicDir: '../public',
  server: {
    port: 3001
  }
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