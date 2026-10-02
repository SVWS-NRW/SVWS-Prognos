import { isAxiosError } from 'axios'
import { getApiClient } from './apiClient'
import type { Schulstammdaten, SvwsSchuelerListeEintrag, SvwsKlasse, Klasse, Schueler } from '@/models/Schueler'
import type { NotenbildSchueler } from '@/models/Lernabschnitt'
import type { SvwsAbschlussdaten, SvwsLernabschnittsdaten } from '@/models/Lernabschnitt'
import type { GEAbschlussFaecher } from '@/models/GEAbschluss'
import type { FachDaten } from '@/models/Fach'

export async function loadSchulstammdaten(): Promise<Schulstammdaten> {
  const { data } = await getApiClient().get('/schule/stammdaten')
  return {
    schulform: data.schulform ?? 'GE',
    idSchuljahresabschnitt: data.idSchuljahresabschnitt,
    abschnitte: (data.abschnitte ?? []).map((a: any) => ({
      id: a.id,
      schuljahr: a.schuljahr,
      abschnitt: a.abschnitt,
    })),
  }
}

export async function loadFaecher(): Promise<FachDaten[]> {
  const { data } = await getApiClient().get('/faecher')
  return (data as any[]).map(f => ({
    id: f.id,
    kuerzel: f.kuerzel ?? '',
    kuerzelStatistik: f.kuerzelStatistik ?? null,
    bezeichnung: f.bezeichnung ?? null,
    istFremdsprache: f.istFremdsprache === true,
  }))
}

export interface SchuelerAuswahlliste {
  schueler: SvwsSchuelerListeEintrag[]
  klassen: SvwsKlasse[]
}

export async function loadSchuelerAuswahlliste(abschnittId: number): Promise<SchuelerAuswahlliste> {
  const { data } = await getApiClient().get(`/schueler/abschnitt/${abschnittId}/auswahlliste`)
  const schueler: SvwsSchuelerListeEintrag[] = (data.schueler ?? [])
    .filter((s: any) => s != null)
    .map((s: any) => ({
      id: s.id,
      nachname: s.nachname ?? '',
      vorname: s.vorname ?? '',
      idKlasse: s.idKlasse,
      idJahrgang: s.idJahrgang,
      jahrgang: s.jahrgang ?? '',
      status: s.status != null ? Number(s.status) : null,
    }))
  const klassen: SvwsKlasse[] = (data.klassen ?? [])
    .filter((k: any) => k != null)
    .map((k: any) => ({
      id: k.id,
      kuerzel: k.kuerzel ?? null,
      idJahrgang: k.idJahrgang ?? null,
    }))
  return { schueler, klassen }
}

export async function loadPrognoseLeistungsdaten(
  schuelerId: number,
  abschnittId: number,
): Promise<GEAbschlussFaecher> {
  const { data } = await getApiClient().get(
    `/gesamtschule/schueler/${schuelerId}/prognose_leistungsdaten/abschnitt/${abschnittId}`,
  )
  return {
    schuljahr: data.schuljahr,
    abschnitt: data.abschnitt,
    jahrgang: data.jahrgang ?? null,
    faecher: (data.faecher ?? []).map((f: any) =>
      f == null
        ? null
        : {
            kuerzel: f.kuerzel ?? '',
            bezeichnung: f.bezeichnung ?? null,
            note: typeof f.note === 'number' ? f.note : null,
            istFremdsprache: f.istFremdsprache ?? null,
            kursart: f.kursart ?? null,
          },
    ),
  }
}

export async function loadSvwsLernabschnittsdaten(
  schuelerId: number,
  abschnittId: number,
): Promise<SvwsLernabschnittsdaten> {
  const la = await loadSvwsLernabschnittsdatenOderNull(schuelerId, abschnittId)
  if (!la) throw new Error('Keine Lernabschnittsdaten gefunden.')
  return la
}

// null, wenn der Schüler im Abschnitt keinen Lernabschnitt hat (z.B. Ehemalige, die die
// Auswahlliste trotzdem enthält; der Server liefert dann ein leeres Array)
export async function loadSvwsLernabschnittsdatenOderNull(
  schuelerId: number,
  abschnittId: number,
): Promise<SvwsLernabschnittsdaten | null> {
  const { data } = await getApiClient().get(
    `/schueler/lernabschnittsdaten/${schuelerId}/${abschnittId}`,
  )
  // API liefert ein Array — primärer Abschnitt hat wechselNr = 0
  const list: any[] = Array.isArray(data) ? data : [data]
  const entry = list.find(e => e.wechselNr === 0) ?? list[0]
  if (!entry) return null
  return {
    id: entry.id,
    schuelerID: entry.schuelerID,
    schuljahresabschnitt: entry.schuljahresabschnitt,
    noteLernbereichNW: entry.noteLernbereichNW ?? null,
    noteLernbereichGSbzwAL: entry.noteLernbereichGSbzwAL ?? null,
    abschluss: entry.abschluss ?? null,
    abschlussart: entry.abschlussart ?? null,
    istAbschlussPrognose: entry.istAbschlussPrognose ?? null,
    pruefungsOrdnung: entry.pruefungsOrdnung ?? null,
    leistungsdaten: (entry.leistungsdaten ?? []).map((l: any) => ({
      id: l.id,
      fachID: l.fachID,
      kursart: l.kursart ?? null,
      note: l.note ?? null,
      noteQuartal: l.noteQuartal ?? null,
    })),
  }
}

export interface SvwsPruefungsordnung {
  // Voller Identifier, z.B. "GE/APO-SI20/5-10"
  pruefungsOrdnung: string
  bezeichnung: string | null
}

// Der Katalog enthält die Prüfungsordnungen aller Schulformen. Die Schulform steht in
// PO_Schulform (z.B. "GE", "SK", "PS"); GE, SK und PS teilen sich dasselbe PO_Krz.
export async function loadPruefungsordnungen(schulformKuerzel: string): Promise<SvwsPruefungsordnung[]> {
  try {
    const { data } = await getApiClient().get('/schild3/pruefungsordnungen')
    return (Array.isArray(data) ? data : [])
      .filter((po: any) => po?.PO_Schulform === schulformKuerzel && po.PO_Krz)
      .map((po: any) => ({
        pruefungsOrdnung: String(po.PO_Krz),
        bezeichnung: po.PO_Name ?? null,
      }))
  } catch {
    return []
  }
}

export async function patchLernabschnittsdaten(
  id: number,
  felder: Record<string, unknown>,
): Promise<void> {
  const body = Object.fromEntries(Object.entries(felder).filter(([, v]) => v !== null && v !== undefined))
  await getApiClient().patch(`/schueler/lernabschnittsdaten/${id}`, body)
}

function mapAbschlussdaten(data: any): SvwsAbschlussdaten {
  return {
    idLernabschnitt: data.idLernabschnitt,
    pruefungsordnung: data.pruefungsordnung ?? null,
    idAbschluss: data.idAbschluss ?? null,
    istAbschlussPrognose: data.istAbschlussPrognose ?? null,
    idAbschlussart: data.idAbschlussart ?? null,
    textErgebnisPruefungsalgorithmus: data.textErgebnisPruefungsalgorithmus ?? null,
    idAbschlussQuartalsprognose: data.idAbschlussQuartalsprognose ?? null,
    textErgebniseQuartalsprognose: data.textErgebniseQuartalsprognose ?? null,
  }
}

// 400 = Abschlussberechnung für diesen Lernabschnitt nicht unterstützt (z.B. Jg. 8:
// "Für den Jahrgang wird die Abschlussberechnung aktuell nicht unterstützt."). Dann kommt
// statt der Daten der Grund zurück; auch der PATCH wird in diesem Fall abgelehnt.
export async function loadAbschlussdaten(
  lernabschnittId: number,
): Promise<{ daten: SvwsAbschlussdaten; nichtUnterstuetzt: null } | { daten: null; nichtUnterstuetzt: string }> {
  try {
    const { data } = await getApiClient().get(`/abschluesse/schueler/lernabschnittsdaten/${lernabschnittId}`)
    return { daten: mapAbschlussdaten(data), nichtUnterstuetzt: null }
  } catch (e) {
    if (!isAxiosError(e) || e.response?.status !== 400) throw e
    const grund = typeof e.response.data === 'string' && e.response.data.trim() !== ''
      ? e.response.data.trim()
      : 'Der SVWS-Server unterstützt die Abschlussberechnung für diesen Lernabschnitt nicht.'
    return { daten: null, nichtUnterstuetzt: grund }
  }
}

// Schreibt die Abschlussfelder; der Server setzt daraus u.a. 'abschluss' (Schild-Kürzel) und
// 'abschlussart' der Lernabschnittsdaten. 'pruefungsordnung' erwartet hier bewusst die Kurzform
// ('APO-SI20'); sie wird vorerst weiter in Langform über patchLernabschnittsdaten() gesetzt.
export async function patchAbschlussdaten(
  lernabschnittId: number,
  felder: Partial<Omit<SvwsAbschlussdaten, 'idLernabschnitt' | 'pruefungsordnung'>>,
): Promise<SvwsAbschlussdaten> {
  const { data } = await getApiClient().patch(`/abschluesse/schueler/lernabschnittsdaten/${lernabschnittId}`, felder)
  return mapAbschlussdaten(data)
}

export async function patchLeistungsdaten(
  id: number,
  data: Record<string, unknown>,
): Promise<void> {
  const body = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null))
  await getApiClient().patch(`/schueler/leistungsdaten/${id}`, body)
}

export async function deleteLeistungsdaten(id: number): Promise<void> {
  await getApiClient().delete(`/schueler/leistungsdaten/${id}`)
}

export function parseNoteString(noteStr: string | null | undefined): number | null {
  if (!noteStr) return null
  const ersteZiffer = parseInt(noteStr.trim()[0], 10)
  if (ersteZiffer >= 1 && ersteZiffer <= 6) return ersteZiffer
  return null
}

// Legacy: bisher ungenutzte Funktionen, behalten für NotenbildView
export async function loadKlassen(schuljahresabschnittId: number): Promise<Klasse[]> {
  const { data } = await getApiClient().get('/klassen/list-item/abschnitt/' + schuljahresabschnittId)
  return (data as any[]).map(k => ({
    id: k.id,
    kuerzel: k.kuerzel ?? '',
    jahrgang: '',
    schuljahresabschnittId: schuljahresabschnittId,
  }))
}

export async function loadSchueler(klasseId: number): Promise<Schueler[]> {
  const { data } = await getApiClient().get(`/klassen/${klasseId}/schueler/`)
  return data as Schueler[]
}

export async function loadNotenbild(schuelerId: number): Promise<NotenbildSchueler> {
  const { data } = await getApiClient().get(`/schueler/${schuelerId}/lernabschnitte/`)
  return { schuelerId, lernabschnitte: data }
}
