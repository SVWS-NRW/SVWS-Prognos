import { getApiClient } from './apiClient'
import type { Schuljahresabschnitt, Klasse, Schueler } from '@/models/Schueler'
import type { NotenbildSchueler } from '@/models/Lernabschnitt'

export async function loadSchuljahresabschnitte(): Promise<Schuljahresabschnitt[]> {
  const { data } = await getApiClient().get('/schuljahresabschnitte/')
  // TODO: Mapping SVWS-Format → internes Modell
  return data as Schuljahresabschnitt[]
}

export async function loadKlassen(schuljahresabschnittId: number): Promise<Klasse[]> {
  const { data } = await getApiClient().get('/klassen/', {
    params: { abschnittId: schuljahresabschnittId },
  })
  // TODO: Mapping SVWS-Format → internes Modell
  return data as Klasse[]
}

export async function loadSchueler(klasseId: number): Promise<Schueler[]> {
  const { data } = await getApiClient().get(`/klassen/${klasseId}/schueler/`)
  // TODO: Mapping SVWS-Format → internes Modell
  return data as Schueler[]
}

export async function loadNotenbild(schuelerId: number): Promise<NotenbildSchueler> {
  const { data } = await getApiClient().get(`/schueler/${schuelerId}/lernabschnitte/`)
  // TODO: Mapping SVWS-Format → internes Modell
  return { schuelerId, lernabschnitte: data }
}
