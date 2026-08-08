import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const frontendRoot = fileURLToPath(new URL('.', import.meta.url))
const certificatePath = resolve(frontendRoot, '.cert/localhost.pem')
const certificateKeyPath = resolve(frontendRoot, '.cert/localhost.key')

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, frontendRoot, '')
  const isDevelopmentServer = command === 'serve'

  if (isDevelopmentServer && (!existsSync(certificatePath) || !existsSync(certificateKeyPath))) {
    throw new Error('Chưa có chứng chỉ HTTPS. Chạy: npm run setup:https')
  }

  return {
    plugins: [react()],
    server: isDevelopmentServer
      ? {
          host: 'localhost',
          port: 5173,
          strictPort: true,
          https: {
            cert: readFileSync(certificatePath),
            key: readFileSync(certificateKeyPath),
          },
          proxy: {
            '/api': {
              target: env.VITE_BACKEND_PROXY_TARGET || 'https://localhost:7080',
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  }
})
