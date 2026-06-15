#!/usr/bin/env node
/**
 * Trägt den ersten Klassenlehrer der jeweiligen Klasse in alle Leistungsdaten
 * der Schüler aus Jg. 8–10 ein.
 *
 * Verwendung:
 *   node scripts/set-klassenlehrer-in-leistungsdaten.mjs \
 *     --url https://svws-server:8443 \
 *     --schema prognos \
 *     --user admin \
 *     --pass geheim
 *
 * Optionen:
 *   --abschnitt <id>   Abweichenden Schuljahresabschnitt verwenden
 *   --jahrgang <jg>    Nur diesen Jahrgang verarbeiten (z. B. 8); Standard: 8 9 10
 *   --dry-run          Nur anzeigen, was geändert würde (kein Schreiben)
 */
import https from 'node:https'
import http from 'node:http'
import { URL } from 'node:url'

// ---------------------------------------------------------------------------
// CLI-Argumente
// ---------------------------------------------------------------------------
function parseArgs() {
  const argv = process.argv.slice(2)
  const get = flag => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null }
  const url    = get('--url')
  const schema = get('--schema')
  const user   = get('--user')
  const pass   = get('--pass')
  if (!url || !schema || !user || pass === null) {
    console.error(
      'Verwendung: node set-klassenlehrer-in-leistungsdaten.mjs\n' +
      '  --url <svws-url> --schema <schema> --user <user> --pass <pass>\n' +
      '  [--abschnitt <id>] [--dry-run]'
    )
    process.exit(1)
  }
  const jgArg = get('--jahrgang')
  return {
    url, schema, user, pass,
    abschnitt:  get('--abschnitt') ? Number(get('--abschnitt')) : null,
    jahrgaenge: jgArg ? new Set([jgArg]) : new Set(['8', '9', '10']),
    dryRun:     argv.includes('--dry-run'),
  }
}

const args = parseArgs()
const AUTH_HEADER = 'Basic ' + Buffer.from(`${args.user}:${args.pass}`).toString('base64')
const BASE = `${args.url}/db/${args.schema}`

// ---------------------------------------------------------------------------
// HTTP-Helfer
// ---------------------------------------------------------------------------
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + path)
    const options = {
      hostname: u.hostname,
      port:     u.port || (u.protocol === 'https:' ? 443 : 80),
      path:     u.pathname + u.search,
      method,
      headers: {
        Authorization:  AUTH_HEADER,
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      rejectUnauthorized: false,
    }
    const transport = u.protocol === 'https:' ? https : http
    const req = transport.request(options, res => {
      let raw = ''
      res.on('data', chunk => raw += chunk)
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} ${method} ${path}: ${raw.slice(0, 200)}`))
          return
        }
        try { resolve(raw ? JSON.parse(raw) : null) } catch { resolve(raw) }
      })
    })
    req.on('error', reject)
    if (body != null) req.write(JSON.stringify(body))
    req.end()
  })
}

// ---------------------------------------------------------------------------
// Hauptlogik
// ---------------------------------------------------------------------------
async function main() {
  if (args.dryRun) console.log('=== DRY-RUN — es werden keine Daten geschrieben ===\n')

  // 1. Schuljahresabschnitt
  const stammdaten  = await request('GET', '/schule/stammdaten')
  const abschnittId = args.abschnitt ?? stammdaten.idSchuljahresabschnitt
  console.log(`Schuljahresabschnitt ID: ${abschnittId}`)

  // 2. Klassen mit Klassenleitungen laden
  const klassenDetails = await request('GET', `/klassen/details/abschnitt/${abschnittId}`)
  const klassenlehrerMap = new Map() // klasseId → lehrerID
  for (const k of klassenDetails) {
    const leitungen = k.klassenLeitungen ?? []
    if (leitungen.length > 0) {
      klassenlehrerMap.set(k.id, leitungen[0])
    }
  }
  console.log(`${klassenlehrerMap.size} Klassen mit Klassenlehrer gefunden`)

  // 3. Schülerliste Jg. 8–10
  const auswahl  = await request('GET', `/schueler/abschnitt/${abschnittId}/auswahlliste`)
  const alle     = auswahl.schueler ?? []
  const schueler = alle.filter(s => args.jahrgaenge.has(String(parseInt(s.jahrgang, 10))))
  console.log(`${schueler.length} Schüler in Jg. ${[...args.jahrgaenge].join('/')} gefunden\n`)

  let gesetzt = 0, ohneLehrer = 0, fehler = 0

  for (const s of schueler) {
    const name      = `${s.nachname}, ${s.vorname} (Jg. ${parseInt(s.jahrgang, 10)})`
    const lehrerID  = klassenlehrerMap.get(s.idKlasse)
    process.stdout.write(`\r  Lade: ${name.slice(0, 50).padEnd(50)}`)

    if (!lehrerID) {
      console.log(`\n  – ${name}: Kein Klassenlehrer für Klasse ${s.idKlasse} gefunden`)
      ohneLehrer++
      continue
    }

    let la
    try {
      const list = await request('GET', `/schueler/lernabschnittsdaten/${s.id}/${abschnittId}`)
      const arr  = Array.isArray(list) ? list : [list]
      la         = arr.find(e => e.wechselNr === 0) ?? arr[0]
    } catch (e) {
      console.log(`\n  ✗ ${name}: Lernabschnitt nicht ladbar — ${e.message}`)
      fehler++
      continue
    }

    if (!la?.leistungsdaten?.length) continue

    for (const ld of la.leistungsdaten) {
      if (!args.dryRun) {
        try {
          const body = Object.fromEntries(
            Object.entries({ ...ld, lehrerID }).filter(([, v]) => v !== null)
          )
          await request('PATCH', `/schueler/leistungsdaten/${ld.id}`, body)
          gesetzt++
        } catch (e) {
          console.log(`\n  ✗ Leistungsdaten-ID ${ld.id} (${name}): ${e.message}`)
          fehler++
        }
      } else {
        console.log(`  [dry] ${name}: Klasse ${s.idKlasse} → lehrerID ${lehrerID}`)
        gesetzt++
      }
    }
  }

  console.log(`\n\nErgebnis:`)
  console.log(`  ✓ ${gesetzt} Leistungsdaten mit Klassenlehrer eingetragen`)
  if (ohneLehrer > 0) console.log(`  – ${ohneLehrer} Schüler ohne Klassenlehrer übersprungen`)
  if (fehler > 0)     console.log(`  ✗ ${fehler} Fehler`)
}

main().catch(e => {
  console.error('\nAbbruch:', e.message)
  process.exit(1)
})
