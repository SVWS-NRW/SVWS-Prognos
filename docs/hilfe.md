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

# Hilfe & Problemlösung

[← Übersicht](index.md)

---

## Verbindungsprobleme

### „Verbindung fehlgeschlagen" beim Anmelden

**Mögliche Ursachen und Lösungen:**

1. **Falsche Server-URL**  
   Prüfen Sie, ob die URL vollständig und korrekt ist (inklusive `https://` und ggf. Port).  
   Beispiel: `https://svws.meine-schule.de` oder `https://10.0.0.5:8443`

2. **Falsches Schema**  
   Das Schema ist der Datenbankname Ihrer Schule auf dem SVWS-Server. Erfragen Sie den genauen Namen bei Ihrem SVWS-Administrator.

3. **Falsches Passwort oder falscher Benutzername**  
   Prüfen Sie Ihre Zugangsdaten. Es sind dieselben Daten wie für den SVWS-WebClient.

4. **SVWS-Server nicht erreichbar**  
   Prüfen Sie, ob der Server läuft und ob Sie sich im Schulnetzwerk (oder VPN) befinden.

5. **Firewall oder Proxy**  
   Wenn Sie die Web-Version nutzen, könnte eine Firewall oder ein Proxy die Verbindung blockieren. Wenden Sie sich an Ihre IT-Abteilung.

---

### SSL-Zertifikatsfehler

Falls der SVWS-Server ein **selbstsigniertes Zertifikat** verwendet, kann die Desktop-App (Electron) die Verbindung in bestimmten Fällen ablehnen.

**Lösung (Desktop-App):**  
Bitten Sie Ihren SVWS-Administrator, ein gültiges SSL-Zertifikat (z. B. von Let's Encrypt) einzurichten.

**Workaround (temporär, nur für Administratoren):**  
In manchen Schulumgebungen wird das Zertifikat zunächst im Betriebssystem als vertrauenswürdig markiert. Bitte konsultieren Sie Ihre IT-Abteilung.

---

### Die App zeigt keine Schüler an

Wenn nach dem Verbinden keine Klassen oder Schüler erscheinen:

- Prüfen Sie, ob der richtige **Schuljahresabschnitt** ausgewählt ist
- Stellen Sie sicher, dass Ihr SVWS-Benutzer die erforderlichen Leserechte für die entsprechenden Klassen und Jahrgänge hat
- Kontaktieren Sie Ihren SVWS-Administrator und bitten Sie um Überprüfung der Berechtigungen

---

## Fragen zur Prognoseberechnung

### Die Prognose erscheint falsch / unerwartet

Die Prognose wird vollständig nach **APO-SI20** berechnet. Wenn Sie ein unerwartetes Ergebnis sehen:

1. Öffnen Sie die **Manuelle Prognose** und geben Sie die Noten des Schülers manuell ein
2. Lesen Sie das **Berechnungsprotokoll** — es zeigt Schritt für Schritt, warum das Ergebnis so ist
3. Prüfen Sie insbesondere:
   - Sind alle Fächer mit der richtigen **Kursart** (E/G) eingetragen?
   - Sind Fremdsprachen als **FS** markiert?
   - Ist der richtige **Jahrgang** ausgewählt?

Eine Erklärung der Abschlüsse und Berechnungsregeln:  
→ [Schulabschlüsse verstehen](abschluesse.md)

---

### Was bedeutet „LBNW" im Protokoll?

**LBNW** steht für „Lernbereich Naturwissenschaften" und bezieht sich auf das Fach, das in der Berechnung als naturwissenschaftliches Leitfach gewertet wird (Biologie, Chemie oder Physik). Dieses Fach ist für die MSA-Berechnung zentral.

---

### Warum wird ein Fach im Protokoll ignoriert?

Folgende Fächer werden von der Prognoseberechnung grundsätzlich ignoriert:

| Kürzel | Fach |
|---|---|
| `LBAL` | Lernbereichsarbeit |
| `AT` | — |
| `AH` | — |
| `AW` | — |
| `PK` | Projektkurs |

Diese Fächer fließen weder in die Fächergruppen noch in die Ausgleichsberechnung ein.

---

### WPU-Fach wird nicht erkannt

Wenn Sie Wahlpflichtunterricht eingeben, verwenden Sie bitte das Kürzel `WP1` oder `WP2`. Die App normiert diese intern zu `WPU`. Alle WP-Kürzel mit Ziffer werden gleichwertig behandelt.

---

## Allgemeine Fragen

### Werden Daten in SVWS gespeichert?

**Nein.** SVWS-Prognos liest Daten aus dem SVWS-Server, schreibt jedoch (in der aktuellen Version) nichts zurück. Alle Prognoseberechnungen laufen ausschließlich im Arbeitsspeicher Ihres Computers.

---

### Werden Passwörter gespeichert?

**Nein.** SVWS-Prognos speichert Zugangsdaten ausschließlich im Arbeitsspeicher. Nach dem Beenden der App oder dem Klick auf „Abmelden" sind alle Daten gelöscht. Es werden keine Passwörter auf die Festplatte geschrieben.

---

### Kann ich SVWS-Prognos ohne SVWS-Server nutzen?

Ja — über die **Manuelle Prognose**. Dort können Sie Noten direkt eingeben oder eine JSON-Datei importieren, ohne eine Serververbindung zu benötigen. Sie müssen dazu nicht eingeloggt sein.

→ [Manuelle Prognose](funktionen/manuelle-prognose.md)

---

### Für welche Schulformen ist die App gedacht?

SVWS-Prognos unterstützt:
- **Gesamtschule** (GE)
- **Sekundarschule** (SK)
- **Primusschule**

Die Berechnung erfolgt nach **APO-SI20** (gültig ab 01.08.2020). Andere Schulformen (z. B. Gymnasium, Realschule) werden nicht unterstützt.

---

### Ich habe einen Fehler gefunden / möchte etwas melden

Bitte erstellen Sie einen Eintrag im Issue-Tracker des Projekts auf GitHub. Beschreiben Sie dabei:
- Die verwendete Version (zu finden im Verbindungsformular oder im Dateinamen des Downloads)
- Das Betriebssystem
- Was Sie getan haben und was Sie erwartet haben
- Den tatsächlichen Fehler oder das unerwartete Verhalten

---

[← Zurück zur Übersicht](index.md)
