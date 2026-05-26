import fs from 'node:fs'
import { spawn } from 'node:child_process'

const envFile = 'supabase/.env.local'
const args = ['supabase', 'functions', 'serve']
if (fs.existsSync(envFile)) {
  args.push('--env-file', envFile)
}

const child = spawn('npx', args, { stdio: 'inherit', shell: true })
child.on('exit', (code) => process.exit(code ?? 0))

