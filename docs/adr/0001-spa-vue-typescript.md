# ADR 0001: Verwendung von Vue.js mit TypeScript für SPA

## Status

Accepted

## Kontext

SVWS-Prognos soll vollständig im Browser laufen (Single Page Application) und ohne
eigenes Backend ausgeliefert werden. Die App richtet sich an Schulverwaltungspersonal
an Gesamtschulen und Sekundarschulen in NRW, das Notenbilder von Schülern einsehen
und Abschlussprognosen berechnen möchte.

Diese Entscheidung orientiert sich bewusst an der Parallelentscheidung in SVWS-Import,
damit beide Apps innerhalb derselben Produktfamilie dieselbe technische Grundlage teilen.

## Entscheidung

Die Anwendung wird als SPA mit Vue 3 und TypeScript umgesetzt.

## Begründung

* Vue bietet eine klare Komponentenstruktur mit Single File Components
* TypeScript erhöht Typsicherheit, was bei der Berechnung von Schulabschlüssen
  (komplexe Regelwerke) besonders wichtig ist
* Etabliertes Tooling (Vite, npm) im bestehenden Projektkosmos
* Gleiche Technologiebasis wie SVWS-Import — Wissen und Patterns sind übertragbar
* Geringe Einstiegshürde für Entwickler, die SVWS-Import bereits kennen

## Alternativen

* React → mehr Boilerplate, keine klare Trennung ohne zusätzliche Konventionen
* Angular → zu schwergewichtig für den Anwendungsfall
* Vanilla JS → nicht wartbar bei der Komplexität eines regelbasierten Berechnungsmodells

## Konsequenzen

* Build-Prozess notwendig (Vite, siehe ADR 0002)
* Entwickler müssen TypeScript beherrschen
* Strukturierung in Komponenten, Services und Composables erforderlich
* Einheitliche Codebasis mit SVWS-Import vereinfacht Komponentenübertragung
