#!/usr/bin/env node
/**
 * Vergibt synthetische Noten (Halbjahr + Quartal) an Schüler eines oder mehrerer Jahrgänge.
 * Die Notenbilder stammen aus den Test-JSON-Dateien; pro Datei werden 3 Varianten
 * gebildet (Original, alle Noten +1, alle Noten −1).
 *
 * Lernbereichsnoten werden direkt am Lernabschnitt gesetzt:
 *   LBNW → noteLernbereichNW      (PATCH /schueler/lernabschnittsdaten/{id})
 *   LBAL → noteLernbereichGSbzwAL (PATCH /schueler/lernabschnittsdaten/{id})
 *
 * Verwendung:
 *   node scripts/seed-noten-jahrgang8.mjs \
 *     --url https://svws-server:8443 \
 *     --schema prognos \
 *     --user admin \
 *     --pass geheim
 *
 * Optionen:
 *   --jahrgang <jg>         Kommagetrennte Jahrgänge (Standard: 8), z. B. --jahrgang 9,10
 *   --nur-ohne-noten        Nur Schüler ohne jede eingetragene Note verarbeiten
 *   --abschnitt <id>        Abweichenden Schuljahresabschnitt verwenden
 *   --test-json-dir <pfad>  Pfad zum test-json Verzeichnis (Standard: ./test-json)
 *   --seed <zahl>           Zufallsseed für reproduzierbare Zuweisung (Standard: 42)
 *   --dry-run               Nur anzeigen, was geändert würde (kein Schreiben)
 */
import https from 'node:https'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { URL } from 'node:url'

// ---------------------------------------------------------------------------
// CLI-Argumente
// ---------------------------------------------------------------------------
function parseArgs() {
  const argv = process.argv.slice(2)
  const get = flag => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null }
  const url  = get('--url')
  const schema = get('--schema')
  const user = get('--user')
  const pass = get('--pass')
  if (!url || !schema || !user || pass === null) {
    console.error(
      'Verwendung: node seed-noten-jahrgang8.mjs\n' +
      '  --url <svws-url> --schema <schema> --user <user> --pass <pass>\n' +
      '  [--jahrgang <jg,...>] [--nur-ohne-noten]\n' +
      '  [--abschnitt <id>] [--test-json-dir <pfad>] [--seed <zahl>] [--dry-run]'
    )
    process.exit(1)
  }
  const jgArg = get('--jahrgang')
  return {
    url, schema, user, pass,
    jahrgaenge:    new Set((jgArg ?? '8').split(',').map(s => s.trim())),
    nurOhneNoten:  argv.includes('--nur-ohne-noten'),
    abschnitt:     get('--abschnitt') ? Number(get('--abschnitt')) : null,
    testJsonDir:   get('--test-json-dir') ?? path.resolve('test-json'),
    seed:          get('--seed') ? Number(get('--seed')) : 42,
    dryRun:        argv.includes('--dry-run'),
  }
}

const args = parseArgs()
const AUTH_HEADER = 'Basic ' + Buffer.from(`${args.user}:${args.pass}`).toString('base64')
const BASE = `${args.url}/db/${args.schema}`

// ---------------------------------------------------------------------------
// HTTP-Helfer
// ---------------------------------------------------------------------------
function request(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + urlPath)
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
          reject(new Error(`HTTP ${res.statusCode} ${method} ${urlPath}: ${raw.slice(0, 200)}`))
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
// Deterministischer Zufallsgenerator (Mulberry32)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ---------------------------------------------------------------------------
// Notenbilder aus test-json laden und Pool aufbauen
// ---------------------------------------------------------------------------
function normKuerzel(k) {
  return /^WP\d/.test(k) ? 'WPU' : k
}

function ladeNotenbildPool(dir, rng) {
  if (!fs.existsSync(dir)) {
    console.error(`test-json Verzeichnis nicht gefunden: ${dir}`)
    process.exit(1)
  }
  const files = fs.readdirSync(dir).filter(f => /\.(JSON|json)$/.test(f))
  if (files.length === 0) {
    console.error('Keine JSON-Dateien im test-json Verzeichnis gefunden.')
    process.exit(1)
  }

  const pool = []
  for (const file of files) {
    let raw
    try {
      raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
    } catch {
      continue
    }

    const noten = {}
    for (const fach of raw.input?.faecher ?? []) {
      if (typeof fach.note === 'number') {
        noten[normKuerzel(fach.kuerzel)] = fach.note
      }
    }
    if (Object.keys(noten).length === 0) continue

    // Original
    pool.push(noten)

    // +1-Variante (schwächere Noten, max 6)
    pool.push(Object.fromEntries(
      Object.entries(noten).map(([k, v]) => [k, Math.min(6, v + 1)])
    ))

    // −1-Variante (stärkere Noten, min 1)
    pool.push(Object.fromEntries(
      Object.entries(noten).map(([k, v]) => [k, Math.max(1, v - 1)])
    ))
  }

  console.log(`${files.length} Notenbilder geladen → ${pool.length} Profil-Varianten`)
  return shuffle(pool, rng)
}

// ---------------------------------------------------------------------------
// Hauptlogik
// ---------------------------------------------------------------------------
async function main() {
  const rng = mulberry32(args.seed)

  if (args.dryRun) console.log('=== DRY-RUN — es werden keine Daten geschrieben ===\n')

  const pool = ladeNotenbildPool(args.testJsonDir, rng)
  console.log()

  // Schuljahresabschnitt
  const stammdaten  = await request('GET', '/schule/stammdaten')
  const abschnittId = args.abschnitt ?? stammdaten.idSchuljahresabschnitt
  console.log(`Schuljahresabschnitt ID: ${abschnittId}`)

  // Fächerliste → Map fachID → kürzel
  const faecherRaw = await request('GET', '/faecher')
  const fachMap    = new Map(faecherRaw.map(f => [f.id, normKuerzel(f.kuerzel ?? '')]))
  console.log(`${fachMap.size} Fächer geladen`)

  // Schülerliste nach Jahrgängen
  const auswahl  = await request('GET', `/schueler/abschnitt/${abschnittId}/auswahlliste`)
  const schueler = (auswahl.schueler ?? []).filter(
    s => args.jahrgaenge.has(String(parseInt(s.jahrgang, 10)))
  )
  const jgLabel = [...args.jahrgaenge].join('/')
  console.log(`${schueler.length} Schüler in Jg. ${jgLabel} gefunden`)
  if (args.nurOhneNoten) console.log('Modus: nur Schüler ohne jede eingetragene Note\n')
  else console.log()

  let notenGesetzt = 0, lbnGesetzt = 0, fallbacks = 0, fehler = 0, uebersprungen = 0
  let profilIdx = 0  // eigener Zähler, damit übersprungene Schüler kein Profil verbrauchen

  for (let si = 0; si < schueler.length; si++) {
    const s    = schueler[si]
    const name = `${s.nachname}, ${s.vorname}`
    process.stdout.write(`\r  [${si + 1}/${schueler.length}] ${name.slice(0, 45).padEnd(45)}`)

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

    if (!la) continue

    // --nur-ohne-noten: überspringen wenn bereits mindestens eine Note vorhanden
    // SVWS liefert leere Noten als "" (leerer String), nicht als null
    if (args.nurOhneNoten) {
      const hatNote =
        (la.noteLernbereichNW != null) ||
        (la.noteLernbereichGSbzwAL != null) ||
        (la.leistungsdaten ?? []).some(ld => ld.note !== null && ld.note !== '')
      if (hatNote) {
        uebersprungen++
        continue
      }
    }

    const profil = pool[profilIdx++ % pool.length]

    // --- Lernbereichsnoten (LBNW + LBAL) direkt am Lernabschnitt ---
    // Nur setzen wenn das Feld im Lernabschnitt bereits vorhanden ist (nicht undefined)
    const hatNW = la.noteLernbereichNW !== undefined
    const hatAL = la.noteLernbereichGSbzwAL !== undefined
    const lbnPatch = {}
    if (hatNW) lbnPatch.noteLernbereichNW      = profil['LBNW'] ?? (2 + Math.floor(rng() * 3))
    if (hatAL) lbnPatch.noteLernbereichGSbzwAL = profil['LBAL'] ?? (2 + Math.floor(rng() * 3))

    if (Object.keys(lbnPatch).length > 0) {
      if (!args.dryRun) {
        try {
          await request('PATCH', `/schueler/lernabschnittsdaten/${la.id}`, lbnPatch)
          lbnGesetzt += Object.keys(lbnPatch).length
        } catch (e) {
          console.log(`\n  ✗ ${name}: LBN-Patch fehlgeschlagen — ${e.message}`)
          fehler++
        }
      } else {
        const parts = Object.entries(lbnPatch).map(([k, v]) => `${k.includes('NW') ? 'LBNW' : 'LBAL'}=${v}`).join(' ')
        console.log(`\n  [dry] ${name}: ${parts}`)
        lbnGesetzt += Object.keys(lbnPatch).length
      }
    }

    // --- Leistungsdaten (einzelne Fächer) ---
    for (const ld of la.leistungsdaten ?? []) {
      const kuerzel = fachMap.get(ld.fachID)
      if (!kuerzel) continue

      // LBN-Fächer nicht als Leistungsdatum patchen (werden oben gesetzt)
      if (kuerzel === 'LBNW' || kuerzel === 'LBAL') continue

      let noteHj = profil[kuerzel]
      if (noteHj == null) {
        noteHj = 2 + Math.floor(rng() * 3)  // Fallback 2–4
        fallbacks++
      }

      // Quartalsnote: mit 40% Wahrscheinlichkeit 1 besser als Halbjahr
      const noteQ = Math.max(1, noteHj + (rng() < 0.4 ? -1 : 0))

      if (!args.dryRun) {
        try {
          const body = Object.fromEntries(
            Object.entries({ ...ld, note: String(noteHj), noteQuartal: String(noteQ) })
              .filter(([, v]) => v !== null)
          )
          await request('PATCH', `/schueler/leistungsdaten/${ld.id}`, body)
          notenGesetzt++
        } catch (e) {
          console.log(`\n  ✗ LD-ID ${ld.id} (${name}, ${kuerzel}): ${e.message}`)
          fehler++
        }
      } else {
        console.log(`    ${kuerzel.padEnd(6)}: HJ=${noteHj}  Q=${noteQ}`)
        notenGesetzt++
      }
    }
  }

  console.log('\n\nErgebnis:')
  console.log(`  ✓ ${notenGesetzt} Leistungsdaten mit Noten gesetzt (note + noteQuartal)`)
  console.log(`  ✓ ${lbnGesetzt} Lernbereichsnoten gesetzt (LBNW + LBAL am Lernabschnitt)`)
  if (uebersprungen > 0) console.log(`  – ${uebersprungen} Schüler übersprungen (bereits Noten vorhanden)`)
  if (fallbacks > 0)     console.log(`  ~ ${fallbacks} Fächer ohne Profil-Treffer (Zufallsnote 2–4)`)
  if (fehler > 0)        console.log(`  ✗ ${fehler} Fehler`)
}

main().catch(e => {
  console.error('\nAbbruch:', e.message)
  process.exit(1)
})
