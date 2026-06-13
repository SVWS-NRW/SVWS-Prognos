#!/usr/bin/env node
/**
 * Zeigt verfügbare Prüfungsordnungen + gültige Abschluss-Codes aus SVWS.
 * Verwendung: node scripts/explore-pruefungsordnungen.mjs
 * Credentials werden aus .env gelesen (oder per --pass übergeben).
 */
import https from 'node:https'
import http from 'node:http'
import { URL } from 'node:url'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// .env einlesen
function readEnv() {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return {}
  const env = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
  return env
}

const env = readEnv()
const argv = process.argv.slice(2)
const get = flag => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null }

const url    = get('--url')    ?? env.VITE_SVWS_URL
const schema = get('--schema') ?? env.VITE_SVWS_SCHEMA
const user   = get('--user')   ?? env.VITE_SVWS_USERNAME
const pass   = get('--pass')   ?? env.VITE_SVWS_PASSWORD

if (!url || !schema || !user || !pass) {
  console.error('Credentials fehlen. Bitte --pass angeben oder in .env setzen (VITE_SVWS_PASSWORD).')
  process.exit(1)
}

const AUTH   = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
const BASE   = `${url}/db/${schema}`

function request(path) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + path)
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'GET',
      headers: { Authorization: AUTH, Accept: 'application/json' },
      rejectUnauthorized: false,
    }
    const transport = u.protocol === 'https:' ? https : http
    const req = transport.request(opts, res => {
      let raw = ''
      res.on('data', c => raw += c)
      res.on('end', () => {
        console.log(`  HTTP ${res.statusCode} ${path}`)
        try { resolve({ status: res.statusCode, data: raw ? JSON.parse(raw) : null }) }
        catch { resolve({ status: res.statusCode, data: raw }) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function main() {
  console.log(`\nSVWS: ${url}  Schema: ${schema}\n`)

  // 1. /schild3/pruefungsordnungen
  console.log('=== /schild3/pruefungsordnungen ===')
  const r1 = await request('/schild3/pruefungsordnungen')
  if (Array.isArray(r1.data)) {
    for (const po of r1.data) {
      console.log(`  ${JSON.stringify(po)}`)
    }
  } else {
    console.log('  Antwort:', r1.data)
  }

  // 2. /schild3/pruefungsordnungen/optionen
  console.log('\n=== /schild3/pruefungsordnungen/optionen ===')
  const r2 = await request('/schild3/pruefungsordnungen/optionen')
  if (Array.isArray(r2.data)) {
    for (const opt of r2.data) {
      console.log(`  ${JSON.stringify(opt)}`)
    }
  } else {
    console.log('  Antwort:', r2.data)
  }

  // 3. Lernabschnittsdaten eines beliebigen Schülers (erstes Ergebnis)
  console.log('\n=== Beispiel: abschluss-Wert aus vorhandenen Lernabschnittsdaten ===')
  const stamm = await request('/schule/stammdaten')
  const abschnittId = stamm.data?.idSchuljahresabschnitt
  if (abschnittId) {
    const auswahl = await request(`/schueler/abschnitt/${abschnittId}/auswahlliste`)
    const schuelerMitAbschluss = (auswahl.data?.schueler ?? []).slice(0, 50)
    let gefunden = 0
    for (const s of schuelerMitAbschluss) {
      const la = await request(`/schueler/lernabschnittsdaten/${s.id}/${abschnittId}`)
      const arr = Array.isArray(la.data) ? la.data : [la.data]
      const entry = arr.find(e => e?.wechselNr === 0) ?? arr[0]
      if (entry?.abschluss) {
        console.log(`  Schüler ${s.id}: abschluss="${entry.abschluss}" istAbschlussPrognose=${entry.istAbschlussPrognose}`)
        gefunden++
        if (gefunden >= 5) break
      }
    }
    if (gefunden === 0) console.log('  (Keine Einträge mit abschluss gefunden)')
  }
}

main().catch(e => { console.error('\nFehler:', e.message); process.exit(1) })
