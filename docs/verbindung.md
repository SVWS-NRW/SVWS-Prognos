<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="52" viewBox="0 0 220 52" role="img" aria-label="SVWS Prognos">
  <rect width="52" height="52" rx="12" fill="#059669"/>
  <rect x="11" y="32" width="8" height="12" rx="2" fill="white" opacity="0.75"/>
  <rect x="22" y="22" width="8" height="22" rx="2" fill="white" opacity="0.88"/>
  <rect x="33" y="12" width="8" height="32" rx="2" fill="white"/>
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
