import { loadEnvFile } from './env.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '..')
const rootEnvPath = path.join(projectRoot, '.env')
const backendEnvPath = path.join(projectRoot, 'benv')

loadEnvFile(backendEnvPath)
loadEnvFile(rootEnvPath)
loadEnvFile()

const required = ['RESEND_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
const missing = required.filter((key) => !process.env[key])
if (missing.length) {
  const hasEnv = fs.existsSync(rootEnvPath)
  const hint = hasEnv
    ? 'Check your .env contents (make sure keys have no typos and are not empty).'
    : 'Create a .env file in the project root (same folder as package.json).'
  throw new Error(`Missing required env var(s): ${missing.join(', ')}. ${hint} Path: ${rootEnvPath}`)
}

const { startServer } = await import('./index.mjs')
await startServer()
