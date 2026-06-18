import { getApiClient } from './apiClient'
import type { Schulstammdaten, SvwsSchuelerListeEintrag, SvwsKlasse, Klasse, Schueler } from '@/models/Schueler'
import type { NotenbildSchueler } from '@/models/Lernabschnitt'
import type { SvwsLernabschnittsdaten } from '@/models/Lernabschnitt'
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
  const { data } = await getApiClient().get(
    `/schueler/lernabschnittsdaten/${schuelerId}/${abschnittId}`,
  )
  // API liefert ein Array — primärer Abschnitt hat wechselNr = 0
  const list: any[] = Array.isArray(data) ? data : [data]
  const entry = list.find(e => e.wechselNr === 0) ?? list[0]
  if (!entry) throw new Error('Keine Lernabschnittsdaten gefunden.')
  return {
    id: entry.id,
    schuelerID: entry.schuelerID,
    schuljahresabschnitt: entry.schuljahresabschnitt,
    noteLernbereichNW: entry.noteLernbereichNW ?? null,
    noteLernbereichGSbzwAL: entry.noteLernbereichGSbzwAL ?? null,
    abschluss: entry.abschluss ?? null,
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
  // Abschluss-Code für diesen Eintrag, z.B. "MSA-Q"
  abschluss: string | null
  bezeichnung: string | null
}

export async function loadPruefungsordnungen(): Promise<SvwsPruefungsordnung[]> {
  try {
    const { data } = await getApiClient().get('/schild3/pruefungsordnungen')
    return (Array.isArray(data) ? data : []).map((po: any) => ({
      pruefungsOrdnung: String(po.pruefungsOrdnung ?? po.kuerzel ?? po.id ?? ''),
      abschluss: po.abschluss ? String(po.abschluss) : null,
      bezeichnung: po.bezeichnung ?? po.text ?? null,
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
