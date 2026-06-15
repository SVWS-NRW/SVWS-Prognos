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

# Installation

[← Übersicht](index.md)

SVWS-Prognos steht in drei Varianten bereit:

| Variante | Betriebssystem | Datei |
|---|---|---|
| **Desktop-App (Windows)** | Windows 10 / 11 | `SVWS-Prognos-x.x.x.exe` |
| **Desktop-App (Linux)** | Ubuntu, Fedora u. a. | `SVWS-Prognos-x.x.x.AppImage` |
| **Web-Bundle** | Beliebiger Browser | `SVWS-Prognos-x.x.x-webserver.zip` |

Die aktuellen Downloads finden Sie auf der [Release-Seite des Projekts](https://github.com/SVWS-NRW/SVWS-Prognos/releases).

---

## Installation unter Windows

### Voraussetzungen

- Windows 10 (64-Bit) oder Windows 11
- Keine weitere Software erforderlich (alle Abhängigkeiten sind enthalten)

### Schritte

1. Laden Sie die Datei `SVWS-Prognos-x.x.x.exe` herunter.
2. Starten Sie die Installationsdatei mit einem Doppelklick.
3. Folgen Sie dem Installationsassistenten.
4. SVWS-Prognos wird im Startmenü eingetragen und kann direkt geöffnet werden.

> **Windows-Sicherheitswarnung:** Da die Anwendung aktuell kein Code-Signing-Zertifikat besitzt, kann Windows beim ersten Start eine SmartScreen-Warnung anzeigen. Klicken Sie auf **„Weitere Informationen"** und anschließend auf **„Trotzdem ausführen"**.

---

## Installation unter Linux

### Voraussetzungen

- 64-Bit-Linux-Distribution (Ubuntu 20.04+, Fedora 38+, Debian 11+)
- Ausführungsrecht auf die AppImage-Datei

### Schritte

1. Laden Sie die Datei `SVWS-Prognos-x.x.x.AppImage` herunter.
2. Machen Sie die Datei ausführbar. Entweder über den Dateimanager (Rechtsklick → Eigenschaften → Ausführen erlauben) oder im Terminal:

   ```bash
   chmod +x SVWS-Prognos-x.x.x.AppImage
   ```

3. Starten Sie die App per Doppelklick oder im Terminal:

   ```bash
   ./SVWS-Prognos-x.x.x.AppImage
   ```

> **Hinweis für Wayland-Nutzer:** Sollte die App nicht starten, fügen Sie die Option `--ozone-platform=x11` hinzu:
> ```bash
> ./SVWS-Prognos-x.x.x.AppImage --ozone-platform=x11
> ```

---

## Betrieb als Web-App (Webserver)

Wenn Sie SVWS-Prognos auf einem Schulserver als Web-Anwendung bereitstellen möchten, nutzen Sie das Web-Bundle.

### Voraussetzungen

- Ein Webserver (z. B. nginx, Apache)
- HTTPS-Zertifikat (empfohlen, da SVWS-Server meist HTTPS verwendet)

### Schritte

1. Laden Sie `SVWS-Prognos-x.x.x-webserver.zip` herunter.
2. Entpacken Sie das Archiv in das Webverzeichnis Ihres Webservers, z. B.:

   ```bash
   unzip SVWS-Prognos-x.x.x-webserver.zip -d /var/www/html/prognos/
   ```

3. Rufen Sie die App im Browser auf: `https://ihr-schulserver.de/prognos/`

> **CORS-Hinweis:** Im Web-Browser-Betrieb muss der SVWS-Server CORS-Anfragen von Ihrer Domain erlauben. Wenden Sie sich dazu an Ihren SVWS-Administrator.

---

## Systemanforderungen

| Merkmal | Mindestanforderung |
|---|---|
| Prozessor | x86-64 (Intel/AMD 64-Bit) |
| Arbeitsspeicher | 512 MB RAM |
| Bildschirmauflösung | 1280 × 768 Pixel |
| Netzwerk | Verbindung zum SVWS-Server der Schule |
| Browser (Web-Variante) | Chrome 90+, Firefox 90+, Edge 90+, Safari 15+ |

---

## Nächste Schritte

Nach der Installation verbinden Sie die App mit Ihrem SVWS-Server:

→ [Verbindung zum SVWS-Server herstellen](verbindung.md)
