# F-licentie oefenen: Windows-versie (`F-licentie.exe`)

Eén bestand met de website, de database en de accounts erin. Geen installatie, geen Docker en geen internet nodig.

## Gebruiken

1. Zet `F-licentie.exe` in een eigen map, bijvoorbeeld `C:\F-licentie\`.
2. Dubbelklik. Er opent een zwart venster en je browser gaat naar **http://localhost:8090**.
3. Maak onder *Account* een account aan en log in. Je voortgang wordt automatisch bewaard, ook als je de computer uitzet.
4. Klaar met oefenen? Sluit het zwarte venster.

Windows kan bij het eerste keer starten waarschuwen ("Windows heeft uw pc beveiligd"), omdat het bestand niet is ondertekend. Kies *Meer informatie* → *Toch uitvoeren*. De eerste start duurt een paar seconden: dan wordt alles uitgepakt.

## Waar staan mijn gegevens?

In de map **`F-licentie-data`** naast het .exe-bestand (accounts, voortgang, logboek `database.log`). Kopieer die map om een back-up te maken of de gegevens naar een andere computer te verhuizen. Staat het .exe-bestand ergens waar Windows niet in mag schrijven (bijvoorbeeld *Program Files*), dan gebruikt het programma `%APPDATA%\F-licentie`.

## Updaten

Vervang `F-licentie.exe` door de nieuwe versie en laat de map `F-licentie-data` staan. Accounts en voortgang blijven bewaard.

## Ook op je tablet of telefoon

Start het programma met `--lan`: maak een snelkoppeling naar het .exe-bestand, open *Eigenschappen* en zet bij *Doel* achter het pad ` --lan`. Het zwarte venster toont dan ook een adres als `http://192.168.1.20:8090`. Open dat op je tablet (zelfde wifi). Windows vraagt eenmalig of het programma toegang mag krijgen tot het netwerk; kies *Privénetwerken*. Je tablet en pc gebruiken dan hetzelfde account en dezelfde voortgang.

| Optie | Wat het doet |
|---|---|
| `--lan` | Bereikbaar voor andere apparaten in je netwerk |
| `--port 8091` | Andere poort (zonder account hoort je lokale voortgang bij het poortnummer) |
| `--data D:\mijn-map` | Andere map voor de gegevens |
| `--no-browser` | De browser niet automatisch openen |

## Wachtwoord vergeten

Er is geen mailserver, dus herstellen per e-mail werkt niet. Open **http://localhost:8090/_/** en maak een beheerder aan. Daarmee kun je onder *users* het wachtwoord van een account wijzigen.

## Zelf bouwen

Nodig: Go 1.21 of nieuwer en internet (PocketBase wordt gedownload). In deze map:

```
./build.sh            # dist/F-licentie.exe voor Windows
./build.sh linux      # dezelfde app als Linux-programma, om te testen
```

Het programma (`launcher/`) pakt PocketBase en de databasemigratie uit naar de datamap, start PocketBase op een intern poortnummer, serveert de website uit het bestand zelf en stuurt `/api` en `/_/` door naar PocketBase. De website zelf is dezelfde als op de hoofdbranch: bouw opnieuw na elke wijziging daar.

Het .exe-bestand is groot (± 170 MB) door de afbeeldingen van alle examenvragen. Het staat daarom in Git LFS. Het wordt automatisch gebouwd door GitHub Actions (`.github/workflows/desktop-exe.yml`) bij elke push naar deze branch en komt dan in `desktop/dist/` te staan.
