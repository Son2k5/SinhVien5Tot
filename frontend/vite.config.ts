import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const frontendRoot = fileURLToPath(new URL('.', import.meta.url))

function requiredEnv(env: Record<string, string>, key: string): string {
  const value = env[key]
  if (!value) throw new Error(`Missing required frontend environment variable: ${key}`)
  return value
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, frontendRoot, 'VITE_')
  const isDevelopmentServer = command === 'serve'

  if (!isDevelopmentServer) {
    return { plugins: [react()] }
  }

  const developmentHost = requiredEnv(env, 'VITE_DEV_HOST')
  const developmentPort = Number(requiredEnv(env, 'VITE_DEV_PORT'))
  const certificatePath = resolve(
    frontendRoot,
    requiredEnv(env, 'VITE_DEV_HTTPS_CERT_PATH'),
  )
  const certificateKeyPath = resolve(
    frontendRoot,
    requiredEnv(env, 'VITE_DEV_HTTPS_KEY_PATH'),
  )
  const apiProxyPrefix = requiredEnv(env, 'VITE_API_PROXY_PREFIX')
  const backendProxyTarget = requiredEnv(env, 'VITE_BACKEND_PROXY_TARGET')

  if (!Number.isInteger(developmentPort) || developmentPort < 1 || developmentPort > 65_535) {
    throw new Error('VITE_DEV_PORT must be a valid TCP port.')
  }

  if (!existsSync(certificatePath) || !existsSync(certificateKeyPath)) {
    throw new Error('Chưa có chứng chỉ HTTPS. Chạy: npm run setup:https')
  }

  return {
    plugins: [react()],
    server: {
      host: developmentHost,
      port: developmentPort,
      strictPort: true,
      https: {
        cert: readFileSync(certificatePath),
        key: readFileSync(certificateKeyPath),
      },
      proxy: {
        [apiProxyPrefix]: {
          target: backendProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
