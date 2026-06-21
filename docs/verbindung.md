<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="52" viewBox="0 0 220 52" role="img" aria-label="SVWS Prognos">
  <defs>
    <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A2E5A"/>
      <stop offset="100%" stop-color="#2D5FA6"/>
    </linearGradient>
    <linearGradient id="gd" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F7B32B"/>
      <stop offset="100%" stop-color="#F28F3B"/>
    </linearGradient>
  </defs>
  <rect width="52" height="52" rx="12" fill="url(#hg)"/>
  <rect x="10" y="36" width="6" height="8"  rx="1.5" fill="white" fill-opacity="0.40"/>
  <rect x="19" y="28" width="6" height="16" rx="1.5" fill="white" fill-opacity="0.40"/>
  <rect x="28" y="18" width="6" height="26" rx="1.5" fill="white" fill-opacity="0.40"/>
  <polyline points="13,40 22,32 31,22 39,13" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="39" cy="13" r="4.5" fill="url(#gd)"/>
  <circle cx="39" cy="13" r="2"   fill="white"/>
  <text x="64" y="22" font-family="system-ui,-apple-system,sans-serif" font-size="16" font-weight="700" fill="#111827">SVWS Prognos</text>
  <text x="64" y="38" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="#6b7280">Abschlussprognose · NRW Sek. I</text>
</svg>
</div>

---

# Verbindung zum SVWS-Server

[← Übersicht](index.md)

Beim ersten Start öffnet sich automatisch der Verbindungsdialog. Dieser fragt vier Angaben ab, die Sie von Ihrer Schulverwaltung oder Ihrem IT-Betreuer erhalten:

---

## Verbindungsformular

### Server-URL

Die vollständige Adresse Ihres SVWS-Servers, inklusive Protokoll und ggf. Port.

**Beispiele:**
```
https://svws.meine-schule.de
https://10.0.0.5:8443
```

> Die URL beginnt immer mit `https://`. Eine unverschlüsselte Verbindung (`http://`) wird nicht unterstützt.

---

### Schema

Das Schema entspricht dem **Datenbank-Mandanten** Ihrer Schule auf dem SVWS-Server. Jede Schule hat ein eigenes Schema. Der Name wird in der SVWS-Administration festgelegt.

**Beispiel:** `gesamtschule_musterstadt`

Wenden Sie sich bei Unklarheiten an Ihren SVWS-Administrator.

---

### Benutzername und Passwort

Geben Sie Ihre persönlichen SVWS-Zugangsdaten ein. Es werden dieselben Daten verwendet, die Sie auch für den SVWS-WebClient nutzen.

> **Sicherheitshinweis:** SVWS-Prognos speichert Ihr Passwort **ausschließlich im Arbeitsspeicher** — niemals auf der Festplatte oder in einer Datei. Nach dem Beenden der App sind alle Zugangsdaten gelöscht.

---

## Verbindung herstellen

Klicken Sie nach dem Ausfüllen auf **„Verbinden"**. Die App:

1. Prüft die Erreichbarkeit des SVWS-Servers
2. Authentifiziert Ihren Benutzer
3. Lädt die verfügbaren Schuljahresabschnitte
4. Leitet Sie auf das [Dashboard](funktionen/dashboard.md) weiter

---

## Verbindung beenden

Über den Button **„Abmelden"** auf dem Dashboard können Sie die Verbindung jederzeit trennen. Sie werden zum Verbindungsformular zurückgeleitet. Alle Daten im Speicher werden gelöscht.

---

## Fehlermeldungen beim Verbinden

| Meldung | Mögliche Ursache | Lösung |
|---|---|---|
| „Verbindung fehlgeschlagen" | Server nicht erreichbar, falsche URL | URL prüfen, Netzwerkverbindung prüfen |
| „Verbindung fehlgeschlagen" | Falsches Schema | Schema-Namen beim Administrator erfragen |
| „Verbindung fehlgeschlagen" | Falsches Passwort / gesperrter Account | Zugangsdaten prüfen |
| Seite lädt nicht | Firewall oder Proxy blockiert | IT-Abteilung kontaktieren |
| SSL-Zertifikatsfehler | Selbstsigniertes Zertifikat auf dem Server | [Siehe Hilfe](hilfe.md#ssl-zertifikatsfehler) |

Weitere Hinweise zur Fehlerdiagnose finden Sie auf der Seite [Hilfe & Problemlösung](hilfe.md).

---

## Nächste Schritte

Nach erfolgreicher Verbindung gelangen Sie automatisch zum Dashboard:

→ [Das Dashboard kennenlernen](funktionen/dashboard.md)
