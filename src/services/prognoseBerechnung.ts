import { berechnePrognose } from '@/rules'
import type { RegelwerkErgebnis, Schulform } from '@/rules/types'
import type { AbschlussTyp } from '@/models/PrognoseErgebnis'
import type { FachDaten } from '@/models/Fach'
import type { SvwsAbschlussdaten, SvwsLernabschnittsdaten } from '@/models/Lernabschnitt'
import {
  loadAbschlussdaten,
  loadKursKuerzel,
  loadSvwsLernabschnittsdaten,
  parseNoteString,
  patchAbschlussdaten,
  patchLernabschnittsdaten,
} from '@/services/svwsService'
import { ordneRechenKuerzelZu } from '@/services/prognoseEingabe'
import { ABSCHLUSS_KURZ, abschlussZuKatalogId, abschlussartZuSchild, istApoSI20 } from '@/services/schildAbschluss'

// Berechnung und Speichern der Prognose eines Schülers aus SVWS-Daten. Wird von der
// Einzelansicht und der Gruppenprognose gemeinsam genutzt, damit beide denselben Prognosetext
// erzeugen — sonst meldet die Einzelansicht danach "Prognosetext ist neu berechnet".

export type Kursart = 'E' | 'G' | 'Sonstige'
export type NotenModus = 'halbjahr' | 'quartal'

export interface PrognoseFach {
  kuerzel: string
  bezeichnung: string
  note: number | null
  kursart: Kursart
  istFremdsprache: boolean
  // Manuell von der Prognose ausgeschlossen
  ignorieren: boolean
  // Statistik-Kürzel (ASD) und Kürzel des Fachs an der Schule (eindeutig); leer bei neu hinzugefügten Fächern
  asdKuerzel: string
  fachKuerzel: string
  svwsId: number | null
}

export interface RohFach extends PrognoseFach {
  noteHalbjahr: number | null
  noteQuartal: number | null
  svwsId: number
}

export interface PrognoseKontext {
  lernabschnitt: SvwsLernabschnittsdaten
  abschlussdaten: SvwsAbschlussdaten | null
  // Grund, wenn der Server die Abschlussberechnung ablehnt (z.B. Jg. 8)
  abschlussNichtUnterstuetzt: string | null
  rohFaecher: RohFach[]
}

export interface BerechnungsParameter {
  jahrgang: string | null
  halbjahr: 1 | 2 | null
  schulform: Schulform
  notenModus: NotenModus
}

// ─── Laden ──────────────────────────────────────────────────────────────────

export async function ladePrognoseKontext(
  schuelerId: number,
  abschnittId: number,
  faecherMap: Map<number, FachDaten>,
  ladeKursKuerzel: KursKuerzelLader,
): Promise<PrognoseKontext> {
  const lernabschnitt = await loadSvwsLernabschnittsdaten(schuelerId, abschnittId)
  const abschluss = await loadAbschlussdaten(lernabschnitt.id)
  const kurse = await ladeKursKuerzel(lernabschnitt.leistungsdaten.map(ld => ld.kursID))
  return {
    lernabschnitt,
    abschlussdaten: abschluss.daten,
    abschlussNichtUnterstuetzt: abschluss.nichtUnterstuetzt,
    rohFaecher: baueRohFaecher(lernabschnitt, faecherMap, kurse),
  }
}

export type KursKuerzelLader = (ids: Array<number | null>) => Promise<Map<number, string | null>>

// Lädt Kurs-Kürzel und merkt sie sich für weitere Schüler; schlägt das Laden fehl, wird nur das
// Fach-Kürzel angezeigt. Ein Lader pro Ansicht bzw. Gruppenlauf (Kurs-IDs gelten nur im Schema).
export function erzeugeKursKuerzelLader(): KursKuerzelLader {
  const cache = new Map<number, Promise<string | null>>()
  return async ids => {
    const eindeutig = [...new Set(ids.filter((id): id is number => id !== null))]
    for (const id of eindeutig) {
      if (!cache.has(id)) cache.set(id, loadKursKuerzel(id).catch(() => null))
    }
    return new Map(await Promise.all(eindeutig.map(async id => [id, await cache.get(id)!] as const)))
  }
}

export function mapKursart(k: string | null): Kursart {
  if (k === 'E') return 'E'
  if (k === 'G') return 'G'
  return 'Sonstige'
}

export function baueRohFaecher(
  lernabschnitt: SvwsLernabschnittsdaten,
  faecherMap: Map<number, FachDaten>,
  kurse: Map<number, string | null>,
): RohFach[] {
  const belegungen = lernabschnitt.leistungsdaten
    .map(ld => ({ ld, fach: faecherMap.get(ld.fachID) }))
    .filter((b): b is { ld: typeof b.ld; fach: FachDaten } => b.fach !== undefined)
    // Der Server liefert die Leistungsdaten in wechselnder Reihenfolge; ohne feste Sortierung
    // ändert sich nach dem Neuladen die Fachreihenfolge im Prognosetext
    .sort((a, b) => a.fach.sortierung - b.fach.sortierung || a.ld.id - b.ld.id)
  const rechenKuerzel = ordneRechenKuerzelZu(belegungen.map(({ ld, fach }) => ({ fach, kursart: ld.kursart })))

  return belegungen.map(({ ld, fach }, i) => {
    const noteHj = parseNoteString(ld.note)
    const noteQ = parseNoteString(ld.noteQuartal)
    const bezeichnung = fach.bezeichnung ?? ''
    const kurs = ld.kursID !== null ? kurse.get(ld.kursID) : null
    return {
      kuerzel: rechenKuerzel[i],
      bezeichnung: rechenKuerzel[i] === fach.kuerzel ? bezeichnung : `${bezeichnung} (${fach.kuerzel})`,
      note: noteHj,
      kursart: mapKursart(ld.kursart),
      istFremdsprache: fach.istFremdsprache,
      ignorieren: false,
      noteHalbjahr: noteHj,
      noteQuartal: noteQ,
      asdKuerzel: fach.kuerzelStatistik ?? '',
      // Mit Kurs, damit z.B. zweimal ER (Fachkurs und Kurs WS-3-Werte) unterscheidbar ist
      fachKuerzel: kurs ? `${fach.kuerzel} · ${kurs}` : fach.kuerzel,
      svwsId: ld.id,
    }
  })
}

// ─── Fächer für die Berechnung ──────────────────────────────────────────────

// Fächergruppe I (D, M, E, WP) oben, danach das NW-Fach mit Fachleistungsdifferenzierung,
// EGSN ganz unten; die übrigen Fächer behalten ihre Reihenfolge aus SVWS
const FG1_REIHENFOLGE = ['D', 'M', 'E', 'WPU']
const NW_FAECHER = ['BI', 'CH', 'PH']

function sortierRang(fach: { kuerzel: string; kursart: string }): number {
  const kuerzel = /^WP\d/.test(fach.kuerzel) ? 'WPU' : fach.kuerzel
  const fg1 = FG1_REIHENFOLGE.indexOf(kuerzel)
  if (fg1 !== -1) return fg1
  if (NW_FAECHER.includes(kuerzel) && (fach.kursart === 'E' || fach.kursart === 'G')) return FG1_REIHENFOLGE.length
  if (kuerzel === 'EGSN') return 99
  return 50
}

// Bei gleichem Rang entscheidet die Position in SVWS, nicht die bisherige Zeile: So ergibt eine
// geänderte Kursart dieselbe Reihenfolge wie nach dem Neuladen (neue Fächer ans Ende)
export function kernfaecherNachOben<T extends { kuerzel: string; kursart: string; svwsId: number | null }>(
  arr: T[],
  roh: RohFach[],
): T[] {
  const svwsPos = (f: T) => {
    const i = roh.findIndex(r => r.svwsId === f.svwsId)
    return i === -1 ? Infinity : i
  }
  return [...arr].sort((a, b) => sortierRang(a) - sortierRang(b) || svwsPos(a) - svwsPos(b))
}

// Kursarten werden nicht in SVWS geschrieben, sondern im Prognosetext vermerkt
// ("FLD-Kursarten für die Prognose geändert, …: M: E (SVWS: Sonstige), …"). Beim Laden werden sie
// wieder angenommen, solange die Kursart in SVWS noch die damals notierte ist.
export const KURSARTEN_PRAEFIX = 'FLD-Kursarten für die Prognose geändert, nicht in SVWS gespeichert: '

// Ausgeschlossene Fächer werden wie die Kursarten nur im Prognosetext vermerkt und beim Laden
// wieder ausgeschlossen; erkannt am Fach-Kurs-Kürzel
export const AUSGESCHLOSSEN_PRAEFIX = 'Von der Prognose ausgeschlossen, nicht in SVWS gespeichert: '

function zeileMit(text: string | null, praefix: string): string | undefined {
  return text?.split('\n').find(z => z.startsWith(praefix))
}

function mitAngenommenenKursarten(liste: PrognoseFach[], roh: RohFach[], gespeicherterText: string | null): PrognoseFach[] {
  const zeile = zeileMit(gespeicherterText, KURSARTEN_PRAEFIX)
  if (!zeile) return liste
  const angenommen = new Map<string, { kursart: Kursart; svws: string }>()
  for (const m of zeile.matchAll(/(\S+): (E|G|Sonstige) \(SVWS: (E|G|Sonstige)\)/g)) {
    angenommen.set(m[1], { kursart: m[2] as Kursart, svws: m[3] })
  }
  return liste.map(f => {
    const a = angenommen.get(f.kuerzel)
    const r = roh.find(r => r.svwsId === f.svwsId)
    return a && r?.kursart === a.svws ? { ...f, kursart: a.kursart } : f
  })
}

function mitAusgeschlossenenFaechern(liste: PrognoseFach[], gespeicherterText: string | null): PrognoseFach[] {
  const zeile = zeileMit(gespeicherterText, AUSGESCHLOSSEN_PRAEFIX)
  if (!zeile) return liste
  const ausgeschlossen = new Set(zeile.slice(AUSGESCHLOSSEN_PRAEFIX.length).split(', '))
  return liste.map(f => f.svwsId !== null && ausgeschlossen.has(f.fachKuerzel) ? { ...f, ignorieren: true } : f)
}

function alsPrognoseFach(f: RohFach, notenModus: NotenModus): PrognoseFach {
  return {
    kuerzel: f.kuerzel,
    bezeichnung: f.bezeichnung,
    note: notenModus === 'quartal' ? f.noteQuartal : f.noteHalbjahr,
    kursart: f.kursart,
    istFremdsprache: f.istFremdsprache,
    ignorieren: false,
    asdKuerzel: f.asdKuerzel,
    fachKuerzel: f.fachKuerzel,
    svwsId: f.svwsId,
  }
}

// Fächer wie in SVWS, ohne die im Prognosetext vermerkten Annahmen (z.B. beim Verwerfen)
export function faecherOhneAnnahmen(roh: RohFach[], notenModus: NotenModus): PrognoseFach[] {
  return kernfaecherNachOben(roh.map(f => alsPrognoseFach(f, notenModus)), roh)
}

// Fächer, wie sie beim Öffnen angezeigt und berechnet werden: mit den im gespeicherten
// Prognosetext vermerkten Kursarten und ausgeschlossenen Fächern
export function faecherMitAnnahmen(roh: RohFach[], notenModus: NotenModus, gespeicherterText: string | null): PrognoseFach[] {
  const liste = roh.map(f => alsPrognoseFach(f, notenModus))
  return kernfaecherNachOben(mitAusgeschlossenenFaechern(mitAngenommenenKursarten(liste, roh, gespeicherterText), gespeicherterText), roh)
}

// Kursarten, die nur für die Prognose von den SVWS-Daten abweichend angenommen wurden
export function kursartAbweichungen(faecher: PrognoseFach[], roh: RohFach[]): string[] {
  return kernfaecherNachOben(faecher, roh).flatMap(f => {
    const r = roh.find(r => r.svwsId === f.svwsId)
    return r && r.kursart !== f.kursart ? [`${f.kuerzel}: ${f.kursart} (SVWS: ${r.kursart})`] : []
  })
}

export function ausgeschlosseneFaecher(faecher: PrognoseFach[], roh: RohFach[]): string[] {
  return kernfaecherNachOben(faecher, roh).filter(f => f.ignorieren).map(f => f.fachKuerzel || f.kuerzel)
}

// ─── Berechnung und Prognosetext ────────────────────────────────────────────

// Das Protokoll listet die Fächer in Eingabereihenfolge. Die Tabelle wird nur beim Laden
// sortiert, nach einer Kursartänderung danach also anders; deshalb hier immer sortiert, sonst
// weicht der Prognosetext nach Speichern und Neuladen vom gespeicherten ab
export function berechne(
  faecher: PrognoseFach[],
  roh: RohFach[],
  lbnwNote: number | null,
  p: BerechnungsParameter,
): RegelwerkErgebnis | null {
  const valid = kernfaecherNachOben(faecher, roh).filter(f => !f.ignorieren && f.kuerzel.trim() !== '' && f.note !== null)
  if (valid.length === 0) return null
  const eingabe = valid.map(f => ({
    kuerzel: f.kuerzel,
    note: f.note as number,
    kursart: f.kursart,
    bezeichnung: f.bezeichnung || undefined,
    istFremdsprache: f.istFremdsprache || undefined,
  }))
  if (lbnwNote !== null) {
    eingabe.push({ kuerzel: 'LBNW', note: lbnwNote, kursart: 'Sonstige', bezeichnung: undefined, istFremdsprache: undefined })
  }
  return berechnePrognose({
    jahrgang: p.jahrgang,
    halbjahr: p.halbjahr,
    schulform: p.schulform,
    faecher: eingabe,
  })
}

export function protokollText(
  ergebnis: RegelwerkErgebnis,
  faecher: PrognoseFach[],
  roh: RohFach[],
  p: Pick<BerechnungsParameter, 'jahrgang' | 'halbjahr' | 'notenModus'>,
  zeitpunkt = new Date(),
): string {
  const kopf = `SVWS-Prognos · APO-SI20 · Jg. ${p.jahrgang ?? '–'}${p.halbjahr ? `/${p.halbjahr}. Hj.` : ''}`
    + ` · ${p.notenModus === 'quartal' ? 'Quartalsnoten' : 'Halbjahresnoten'} · ${zeitpunkt.toLocaleString('de-DE')}`
  const kursarten = kursartAbweichungen(faecher, roh)
  const ausgeschlossen = ausgeschlosseneFaecher(faecher, roh)
  return [
    kopf,
    `Prognose: ${ABSCHLUSS_KURZ[ergebnis.empfehlung]}`,
    ...(kursarten.length > 0 ? [KURSARTEN_PRAEFIX + kursarten.join(', ')] : []),
    ...(ausgeschlossen.length > 0 ? [AUSGESCHLOSSEN_PRAEFIX + ausgeschlossen.join(', ')] : []),
    '',
    ...ergebnis.protokoll,
  ].join('\n')
}

// Die Kopfzeile enthält den Zeitstempel und zählt beim Vergleich nicht mit
export function ohneKopfzeile(text: string | null | undefined): string | null {
  return text ? text.split('\n').slice(1).join('\n') : null
}

// ─── Vergleich mit dem Gespeicherten ────────────────────────────────────────

// Prognosetext: mit dem Abschluss über /abschluesse, in Jg. 8 (dort nicht unterstützt) über die
// Lernabschnittsdaten
export function gespeicherterPrognosetext(k: PrognoseKontext, notenModus: NotenModus): string | null {
  if (k.abschlussNichtUnterstuetzt) return k.lernabschnitt.textErgebnisPruefungsalgorithmus ?? null
  return notenModus === 'quartal'
    ? k.abschlussdaten?.textErgebniseQuartalsprognose ?? null
    : k.abschlussdaten?.textErgebnisPruefungsalgorithmus ?? null
}

// Der Abschluss wird nur zusammen mit APO-SI20 gespeichert, weil nur dafür gerechnet wird
export function abschlussWirdGespeichert(pruefungsOrdnung: string | null, abschlussNichtUnterstuetzt: string | null): boolean {
  return istApoSI20(pruefungsOrdnung) && !abschlussNichtUnterstuetzt
}

// In Jg. 8 gibt es in den Lernabschnittsdaten kein Feld für die Quartalsprognose
export function prognosetextSpeicherbar(
  pruefungsOrdnung: string | null,
  abschlussNichtUnterstuetzt: string | null,
  notenModus: NotenModus,
): boolean {
  return istApoSI20(pruefungsOrdnung) && (!abschlussNichtUnterstuetzt || notenModus === 'halbjahr')
}

export function abschlussGeaendert(
  empfehlung: AbschlussTyp,
  abschlussdaten: SvwsAbschlussdaten | null,
  notenModus: NotenModus,
): boolean {
  const id = abschlussZuKatalogId(empfehlung)
  if (notenModus === 'quartal') return id !== (abschlussdaten?.idAbschlussQuartalsprognose ?? null)
  return id !== (abschlussdaten?.idAbschluss ?? null)
    || abschlussartZuSchild(empfehlung) !== (abschlussdaten?.idAbschlussart ?? null)
}

// Erfasst auch Änderungen, die den Abschluss nicht ändern (z.B. nur angenommene Kursarten)
export function prognosetextGeaendert(neuerText: string, gespeicherterText: string | null): boolean {
  return ohneKopfzeile(neuerText) !== ohneKopfzeile(gespeicherterText)
}

// Ist Prognose: immer, außer Jg. 10 im 2. Halbjahr — dort ist der berechnete Abschluss der tatsächliche
export function standardIstPrognose(jahrgang: string | null, halbjahr: 1 | 2 | null): boolean {
  return !(Number(jahrgang) === 10 && halbjahr === 2)
}

// ─── Speichern ──────────────────────────────────────────────────────────────

// Halbjahresnoten → idAbschluss + idAbschlussart, Quartalsnoten → idAbschlussQuartalsprognose
export function abschlussFelder(empfehlung: AbschlussTyp, text: string, notenModus: NotenModus): Partial<SvwsAbschlussdaten> {
  const id = abschlussZuKatalogId(empfehlung)
  return notenModus === 'quartal'
    ? { idAbschlussQuartalsprognose: id, textErgebniseQuartalsprognose: text }
    : { idAbschluss: id, idAbschlussart: abschlussartZuSchild(empfehlung), textErgebnisPruefungsalgorithmus: text }
}

export interface SpeicherAuftrag {
  lernabschnittId: number
  pruefungsOrdnung: string | null
  istAbschlussPrognose: boolean
  // undefined = unverändert, nicht senden
  noteLernbereichNW?: number | null
  abschlussNichtUnterstuetzt: string | null
  notenModus: NotenModus
  // null, wenn nichts berechnet wurde
  empfehlung: AbschlussTyp | null
  text: string | null
}

// Zwei Schritte (ADR 0018): erst die Lernabschnittsdaten (Prüfungsordnung, Prognose-Flag, LBNW,
// in Jg. 8 der Prognosetext), dann der Abschluss — der Server prüft ihn gegen die Prüfungsordnung
export async function speicherePrognose(a: SpeicherAuftrag): Promise<void> {
  const body: Record<string, unknown> = { istAbschlussPrognose: a.istAbschlussPrognose }
  if (a.pruefungsOrdnung) body.pruefungsOrdnung = a.pruefungsOrdnung
  if (a.noteLernbereichNW !== undefined) body.noteLernbereichNW = a.noteLernbereichNW
  if (a.abschlussNichtUnterstuetzt && a.text && prognosetextSpeicherbar(a.pruefungsOrdnung, a.abschlussNichtUnterstuetzt, a.notenModus)) {
    body.textErgebnisPruefungsalgorithmus = a.text
  }
  await patchLernabschnittsdaten(a.lernabschnittId, body)

  if (abschlussWirdGespeichert(a.pruefungsOrdnung, a.abschlussNichtUnterstuetzt) && a.empfehlung && a.text) {
    const felder = abschlussFelder(a.empfehlung, a.text, a.notenModus)
    const antwort = await patchAbschlussdaten(a.lernabschnittId, felder)
    const idFeld = a.notenModus === 'quartal' ? 'idAbschlussQuartalsprognose' : 'idAbschluss'
    // Eine im Schuljahr ungültige ID setzt der Server ohne Fehler auf null
    if (antwort[idFeld] !== felder[idFeld]) {
      throw new Error(`Der SVWS-Server hat den Abschluss ${ABSCHLUSS_KURZ[a.empfehlung]} nicht übernommen.`)
    }
  }
}
