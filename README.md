# F-licentie oefenen 📡

Interactieve oefenapp voor het Nederlandse F-licentie zendexamen (Full Radio Amateur), gebaseerd op de
examentraining van de [VRZA-cursus](https://cursus.vrza.nl/wp/2017/12/04/vrza-cursus-zendamateur-2017-2019/).
Pure HTML/CSS/JavaScript, geen build-stap, geen server: draait gratis op GitHub Pages.

**Nu aanwezig (1.413 vragen):** Hoofdstuk 3 (91), 4 (32), 5 (164), 6 (50), 7 (53), 8 (64), 9 (25), 10 (57), 11 (40), 12 (182), 13 (192), 14 (244), 15 (50), 16 (50), 17 (20) en 18 (99). Nog niet: Hoofdstuk 1 en 2 (en bundel B van Hoofdstuk 15, als die bestaat). Meer hoofdstukken voeg je toe met het script hieronder.

## Functies
- **Onderdelen filteren** met selectievakjes; alleen de gekozen hoofdstukken worden geladen.
- **Oefenmodus**: direct groen/rood, uitklapbare toelichting (met knop voor de originele uitwerking inclusief figuren en formules), "Volgende vraag" pas na beantwoorden. Toetsen 1–4 of A–D en Enter werken ook.
- **Examenmodus**: 50 vragen (standaard gespreid over de gekozen hoofdstukken naar rato van het aantal vragen per hoofdstuk, of puur willekeurig; de officiële verdeling van het echte examen is niet openbaar gevonden), timer (standaard 90 min, instelbaar), geen feedback, vragenoverzicht, uitslag aan het eind (geslaagd bij ≥ 35 goed) met overzicht van je fouten. Een lopend examen overleeft het herladen van de pagina.
- **Foutenvijver**: foute vragen komen in de vijver; filter "Alleen eerder foute vragen oefenen"; goed beantwoord in de oefenmodus = uit de vijver. De "slimme volgorde" toont eerst de vijver, dan vragen die herhaald moeten worden, dan nieuwe vragen, dan de rest.
- **Slim herhalen** (Leitner-boxen): elke beantwoorde vraag komt na 1, 3, 7, 14 en 30 dagen terug zolang je hem goed blijft hebben; een fout zet hem terug naar het begin. Bovenaan staat "Vandaag te herhalen" met één knop, en er is een filter "Alleen vragen die nu herhaald moeten worden". Een vraag schuift pas op als hij aan de beurt was, dus vaker oefenen krikt hem niet kunstmatig op. De herhaalgegevens synchroniseren mee met je account.
- **Voortgang**: totaal beantwoord, slagingspercentage, voortgangsbalk en percentage per onderdeel, zwakste plek, examenhistorie, reset met bevestiging.
- **Leren met theorie** (waar de theorie is toegevoegd, nu Hoofdstuk 3): de cursustekst per paragraaf als leesbare pagina's; bij elke examenvraag een link naar de bijbehorende paragraaf(en) (benadrukt bij een fout antwoord); voortgang per paragraaf; een leerroute per hoofdstuk (lezen → paragraaf oefenen → hoofdstukexamen, "beheerst" bij ≥ 80% laatste poging goed); en een formuleblad per hoofdstuk. Gelezen-markeringen synchroniseren mee met je account.
- **Reeks en oefenkalender** (zoals Anki): een kalender per maand waarop de dagen waarop je hebt geoefend groen kleuren (donkerder = meer). De reeks is het aantal dagen op rij met minstens één beantwoorde vraag of flashcard; heb je vandaag nog niets gedaan, dan breekt de reeks pas morgen. Er is dus geen dagdoel om in te stellen. Synchroniseert mee.
- **Flashcards** (waar de theorie is toegevoegd, nu H3 met 49 kaarten): in *Leren* → *Flashcards*. Tik/spatie om het antwoord te zien, daarna *Weet ik* (pijl rechts / 2) of *Nog niet* (pijl links / 1). Eigen herhaalschema (1, 3, 7, 14, 30 dagen), los van de vragen; een gemiste kaart komt in dezelfde ronde nog één keer terug. Voortgang synchroniseert mee.
- **Accounts** (zelf hosten met PocketBase in Docker, of Supabase): inloggen en je voortgang op elk apparaat behouden, ook voor medecursisten. Zie *Zelf hosten op Unraid*.
- **Synchroniseren zonder account** via een eigen Gist, link of back-upbestand.

## Lokaal proberen
```powershell
cd C:\Users\Cappi\Documents\f-licentie
python -m http.server 8000
```
Open daarna <http://localhost:8000>. (Openen via `file://` werkt niet omdat de app JSON-bestanden ophaalt.)

## Publiceren op GitHub Pages
1. Maak op github.com een nieuwe repository, bijvoorbeeld `f-licentie`.
2. In PowerShell:
   ```powershell
   cd C:\Users\Cappi\Documents\f-licentie
   git init
   git add .
   git commit -m "F-licentie oefenapp"
   git branch -M main
   git remote add origin https://github.com/<jouw-gebruikersnaam>/f-licentie.git
   git push -u origin main
   ```
3. Repository → **Settings → Pages** → *Deploy from a branch* → `main` / `(root)` → Save.
4. Na een minuutje staat de app op `https://<jouw-gebruikersnaam>.github.io/f-licentie/`.

> **Auteursrecht:** de vragen en uitwerkingen komen uit de VRZA-cursus, waarvan de site zegt dat kopiëren niet is toegestaan.
> Een openbare GitHub Pages-site is dus een kwestie van even navragen bij de VRZA (webteam@vrza.nl), of je houdt het bij lokaal gebruik / een privé-repository.
> De bron-PDF's staan in `.gitignore` en worden dus niet meegepusht.

## Zelf hosten op Unraid (Docker + Portainer) – aanbevolen

Eén container met **PocketBase** levert de website, de database en de accounts. Alle bestanden staan op GitHub; Portainer bouwt en start
de stack rechtstreeks uit je repository. Website en API draaien op hetzelfde adres, dus GitHub Pages is hiervoor niet nodig
(het mag wel, zie onder).

Wat in de repository zit: `Dockerfile`, `docker-compose.yml`, `docker/entrypoint.sh` en `pocketbase/pb_migrations/` (die maakt de tabel
`progress` met de beveiligingsregels automatisch aan bij het eerste opstarten).

### Installeren
1. Zet de repository op GitHub (zie *Publiceren op GitHub Pages*, stap 1–2; Pages zelf hoef je niet aan te zetten). Is de repository privé, maak dan een *personal access token* met leesrechten op die repository.
2. Portainer → **Stacks → Add stack → Repository**:
   - *Repository URL*: `https://github.com/<gebruikersnaam>/f-licentie`
   - *Repository reference*: `refs/heads/main` · *Compose path*: `docker-compose.yml`
   - Privé repository? Zet *Authentication* aan en vul gebruikersnaam en token in.
   - Onder **Environment variables** zet je:
     - `PB_ADMIN_EMAIL` – jouw e-mailadres als beheerder
     - `PB_ADMIN_PASSWORD` – een sterk wachtwoord van minimaal 10 tekens
     - optioneel `HOST_PORT` (standaard 8090) en `DATA_DIR` (standaard `/mnt/user/appdata/f-licentie`)
3. Klik **Deploy the stack**. De eerste keer wordt de image gebouwd; dat duurt even.
4. Test: `http://<unraid-ip>:8090` is de oefenapp, `http://<unraid-ip>:8090/_/` is het beheerscherm van PocketBase (log in met je beheerder). Registreer in de app een testaccount en kijk bij *Collections → progress* of de voortgang verschijnt.

### Bereikbaar maken voor medecursisten
De cursisten hebben een **https**-adres nodig. Twee gangbare manieren:
- **Cloudflare Tunnel** (geen open poorten): maak in Cloudflare Zero Trust een tunnel naar `http://f-licentie:8090`, zet in Portainer de variabelen `COMPOSE_PROFILES=tunnel` en `CF_TUNNEL_TOKEN=<token>` en deploy opnieuw. De optionele `tunnel`-service in `docker-compose.yml` start dan mee.
- **Eigen domein + reverse proxy** (bijv. Nginx Proxy Manager of SWAG): verwijs je domein naar `<unraid-ip>:8090`, laat de proxy het certificaat regelen en open alleen poort 443 op je router.

Zet in PocketBase (beheerscherm → Settings) bij *Application → URL* je openbare https-adres, en overweeg de *rate limiter* aan te zetten.

### Beheer
- **Updates van de app**: push naar GitHub en kies in Portainer bij de stack **Pull and redeploy** (zet, indien beschikbaar, *Re-build image* aan). Je gegevens staan buiten de container in `DATA_DIR` en blijven behouden.
- **Back-ups**: neem `DATA_DIR` mee in je Unraid-back-ups, of gebruik in het beheerscherm *Settings → Backups*.
- **Wachtwoord vergeten**: er is bewust geen mailserver nodig. Jij stelt via het beheerscherm (*Collections → users → gebruiker kiezen → nieuw wachtwoord*) een nieuw wachtwoord in. Cursisten kunnen hun wachtwoord zelf wijzigen onder *Account*.
- **Registratie afsluiten** (later, als iedereen een account heeft): zet in *Collections → users → API rules* de *Create rule* op *Set superusers only*; nieuwe gebruikers voeg je dan zelf toe.
- **PocketBase-versie**: in de `Dockerfile` staat `PB_VERSION`. Controleer op github.com/pocketbase/pocketbase/releases of er een nieuwere versie is en pas hem aan; de migratie vereist minimaal 0.23.

### Als iets niet start
Bekijk de logs van de container in Portainer. Veel voorkomend: een niet-bestaande `PB_VERSION` (build mislukt), een beheerderswachtwoord korter dan 10 tekens (maak de beheerder dan via de link in de logs), of de melding dat accounts niet zijn ingesteld (dan open je de site via `github.io` zonder `PB_URL`).

**Let op:** de app-koppeling is getest tegen een nagebootste PocketBase, maar de Docker-build en de migratie zijn nog niet op een echte server geprobeerd. Meld afwijkingen, dan pas ik ze aan.

### Site op GitHub Pages, alleen de database zelf hosten
Dat kan ook: laat de container draaien (bereikbaar via https) en zet in `js/config.js` `PB_URL = 'https://jouw-adres'`. Dan serveert GitHub Pages de site en jouw server de accounts en de database.

## Werkwijze: wijzigen, naar GitHub pushen en in Portainer bijwerken

Dit is de vaste routine, telkens als er iets verandert (nieuw hoofdstuk, aangepaste tekst, enz.).

### 1. Naar GitHub pushen (op je pc)
Open PowerShell in `C:\Users\Cappi\Documents\f-licentie`:
```powershell
git pull                      # eerst ophalen wat er online staat (voorkomt conflicten)
git status                    # laat zien wat er gewijzigd is
git add .
git commit -m "Hoofdstuk 9 toegevoegd"
git push
```
Controleer daarna op github.com/CappiSteijns/f-licentie-trainer of de commit er staat. De bron-PDF's in `bronnen/` worden bewust niet meegepusht (`.gitignore`).

### 2. In Portainer de nieuwste versie ophalen
1. Portainer → **Stacks** → kies de stack `f-licentie`.
2. Open het tabblad **Editor** en scroll naar *Git repository*.
3. Klik op **Pull and redeploy** en zet **Re-pull image and redeploy** / **Force redeployment** aan (de naam verschilt per Portainer-versie). Dit is nodig, want de website zit in de image en die moet opnieuw gebouwd worden.
4. Bevestig. De build duurt even; volg de voortgang bij **Containers → f-licentie → Logs**.
5. Open de site en ververs hard (Ctrl+F5). Staat er een oude versie? Dan heeft je browser nog de oude bestanden in het geheugen.

Je gebruikersgegevens staan in de map `DATA_DIR` op je Unraid, buiten de container, en blijven bij elke update behouden.

**Automatisch bijwerken (optioneel):** in Portainer kun je bij de stack *Automatic updates* aanzetten (polling, bijvoorbeeld elke 5 minuten). Elke push naar `main` wordt dan vanzelf uitgerold.

### Gaat er iets mis?
- *"Pull and redeploy" toont geen wijziging*: kijk of de push echt op GitHub staat en of de *Repository reference* in de stack `refs/heads/main` is.
- *Build mislukt*: bekijk de foutmelding in Portainer; meestal is dat de `PB_VERSION` in de `Dockerfile` of een typefout in een bestand.
- *Site is oud na een geslaagde update*: harde verversing (Ctrl+F5) of een privévenster.

## Een nieuwe versie eerst testen (testbranch + aparte teststack)

Grotere wijzigingen komen eerst op een eigen branch (bijv. `theorie`) en pas na jouw akkoord op `main`.

**Veilig testen op je Unraid, naast de echte site** (eigen database, eigen poort; je echte accounts en voortgang blijven onaangeraakt):
1. Portainer → **Stacks → Add stack → Repository**, naam `f-licentie-test`.
2. Repository URL: dezelfde als bij de echte stack. **Repository reference: `refs/heads/theorie`** (de naam van de testbranch).
3. Compose path: `docker-compose.yml`. Environment variables:
   `HOST_PORT=8091`, `CONTAINER_NAME=f-licentie-test`, `IMAGE_NAME=f-licentie:test`, `DATA_DIR=/mnt/user/appdata/f-licentie-test`, plus `PB_ADMIN_EMAIL` en `PB_ADMIN_PASSWORD`.
4. Deploy en open `http://<unraid-ip>:8091`. Maak daar desnoods een testaccount aan.
5. Wijzigt er iets op de testbranch? **Pull and redeploy** in de teststack.
6. Tevreden? Zet de branch via een pull request op GitHub in `main` (**Merge**) en doe **Pull and redeploy** in de echte stack. Daarna kun je de teststack verwijderen.

**Alleen op je pc** (zonder accounts, voortgang blijft in je browser):
```powershell
cd C:\Users\Cappi\Documents\f-licentie
git fetch
git switch theorie
python -m http.server 8000
```
Terug naar de gewone versie: `git switch main`.

## Alternatief: accounts via Supabase

Zet hiervoor in `js/config.js` `BACKEND = 'supabase'`.

Met een account kunnen jij en je medecursisten inloggen en hun voortgang op elk apparaat behouden. GitHub Pages is statisch,
hier staat de database bij [Supabase](https://supabase.com) (gratis abonnement is voldoende voor een klein groepje).
Zonder deze stappen werkt de app gewoon, alleen zonder inloggen.

1. Maak een gratis Supabase-account en een nieuw project. Kies een regio in de EU (bijv. Frankfurt of Ierland) en bewaar het database-wachtwoord.
2. Open **SQL Editor → New query**, plak de inhoud van `supabase/schema.sql` en klik **Run**. Dit maakt de tabel `progress` en de beveiligingsregels (Row Level Security: iedereen ziet alleen zijn eigen rij) en de functie om je eigen account te verwijderen.
3. **Authentication → Providers → Email**: zet *Confirm email* **uit** (dan kunnen cursisten meteen registreren en inloggen, zonder bevestigingsmail). De ingebouwde mailservice van Supabase is zeer beperkt in het aantal mails; alleen "wachtwoord vergeten" verstuurt nog een mail.
4. **Authentication → URL Configuration**: zet *Site URL* op het adres van je GitHub Pages-site (`https://<gebruikersnaam>.github.io/f-licentie/`) en voeg dat ook toe aan de *Redirect URLs* (voor de herstellink bij "wachtwoord vergeten"; ook `http://localhost:8000/` als je lokaal test).
5. **Project Settings → API**: kopieer de *Project URL* en de *anon / public* sleutel naar `js/config.js`, en zet je eigen e-mailadres bij `CONTACT_EMAIL` (staat in de privacyverklaring). De namen in het Supabase-dashboard kunnen iets afwijken van wat hier staat.
6. Gebruik **nooit** de `service_role`-sleutel in `js/config.js`. De anon-sleutel is bedoeld om openbaar te zijn; de beveiliging zit in stap 2.
7. Commit en push; open de site, ga naar **Account → Registreren**.

Hoe het werkt: de app blijft eerst lokaal werken (ook offline) en synchroniseert op de achtergrond met het account. Per vraag wint de
nieuwste poging, dus oefenen op twee apparaten tegelijk gaat goed. Bij uitloggen wordt de lokale kopie gewist, zodat de volgende gebruiker
op hetzelfde apparaat niets van jou ziet. Cursisten kunnen hun account zelf verwijderen (Account → Account verwijderen).

Let op:
- Een gratis Supabase-project wordt na een tijd zonder activiteit gepauzeerd (controleer de actuele voorwaarden op supabase.com); je zet het in het dashboard weer aan.
- Er is geen e-mailverificatie: iedereen die de site kent, kan een account maken. Wil je dat niet, zet dan registreren uit onder Authentication of kies verificatie met een eigen mailserver.
- De privacyverklaring in de app is een eenvoudige basis; lees hem na en pas hem aan als jouw situatie anders is.

## Voortgang meenemen zonder account
Alle voortgang staat in `localStorage` van je browser. Zonder account zijn er drie manieren om hem mee te nemen (tabblad *Meer*):

1. **Automatisch via een privé GitHub Gist** (aanrader): maak één keer een *classic* token met alleen de scope `gist`, plak het op elk apparaat en klik *Verbinden*. De app maakt zelf een privé-gist `f-licentie-voortgang.json`, haalt wijzigingen op bij het openen van de pagina en schrijft ze weg na het oefenen. Het token blijft op je apparaat en gaat nooit in de gist.
2. **Overdraag-link**: één link met je voortgang erin; mail of appt hem naar jezelf.
3. **Back-upbestand** (.json) downloaden en op het andere apparaat importeren.

Samenvoegen gaat per vraag: de nieuwste poging wint. Een reset krijgt een tijdstempel, zodat gewiste gegevens niet via een ander apparaat terugkomen.
Als je op twee apparaten tegelijk offline dezelfde vraag beantwoordt, telt alleen de nieuwste poging van die vraag.

## Meer hoofdstukken toevoegen
De VRZA biedt per hoofdstuk een *Examentraining*-PDF aan (bijv. `HS4_exa_20260103.pdf`).
1. Zet de PDF('s) in `bronnen/` (de bestandsnaam moet met `HS<nummer>_exa` beginnen).
2. Installeer eenmalig: [Poppler voor Windows](https://github.com/oschwartz10612/poppler-windows/releases) (zorg dat `pdftotext` en `pdftoppm` in je PATH staan) en `pip install -r tools/requirements.txt`.
3. Draai (bij een hoofdstuk met meerdere bundels, zoals Hoofdstuk 5, geef je alle PDF's in één keer mee):
   ```powershell
   python tools/extract_vrza.py bronnen/HS4_exa_20260103.pdf
   python tools/build_index.py
   python tools/check_answers.py 4
   ```
4. **Controleer de antwoorden.** Het goede antwoord wordt uit de tekst van de uitwerking gehaald; dat gaat bijna altijd goed, maar niet altijd. `check_answers.py` toont per vraag het gedetecteerde antwoord naast de slotzin. Wijkt iets af of meldt het script "zonder gedetecteerd antwoord", zet het juiste antwoord dan in `tools/answer_overrides.json` (`"hs4-12": "C"`) en draai stap 3 opnieuw.
5. `git add . && git commit -m "Hoofdstuk 4" && git push`.

Alle antwoorden zijn gecontroleerd tegen drie bronnen: de vetgedrukte letter in de uitwerking (`tools/bold_answers.py` en `tools/ink_answers.py`), de uitlegtekst en handmatig lezen. Die bronnen spreken elkaar soms tegen, doordat de uitlegtekst zelf een tikfout in de letter heeft (bijv. 5-77, 5-156, 11-1, 12-126); het vetgedrukte antwoord is dan gevolgd. Vraag 13-45 is weggelaten omdat die twee goede antwoorden heeft. Bij 5-6 is het "officiële" antwoord B aangehouden, ook al is C inhoudelijk verdedigbaar. Afbeeldingen worden als WebP opgeslagen om de repo klein te houden. Let op vraag 3-1: het officiële antwoord is C, hoewel de toelichting eerst B beredeneert (de toelichting legt dat uit).

## Theorie toevoegen voor een hoofdstuk
1. Zet de PDF "Volledige tekst" van het hoofdstuk in `bronnen/` als `THEORIE_HS<N>_<datum>.pdf`.
2. `python tools/build_theory.py bronnen/THEORIE_HS<N>_....pdf` maakt de paragraafindeling (uit de inhoudsopgave) en een pagina-afbeelding per pagina.
3. `python tools/map_questions.py <N> bronnen/THEORIE_HS<N>_....pdf --show` koppelt vragen aan paragrafen op woordovereenkomst en toont het resultaat. Controleer dat en corrigeer in `tools/theory_overrides.json` (`{"hs3-12": ["s32"]}`); draai het script daarna opnieuw.
4. Vul `formulas` in `data/theorie/hoofdstuk-<N>.json` (formuleblad) en draai `python tools/build_index.py`.

Flashcards zet je in `data/theorie/hoofdstuk-N.json` onder `"cards": [{"id":"c1","sec":"s9","q":"vraag","a":"antwoord"}]` (`sec` = id van de paragraaf). `build_theory.py` laat bestaande kaarten, vraagkoppelingen en formules staan. De kaarten van H3 staan in `tools/cards_h3.py` als voorbeeld.

## Bekende beperkingen
- Machten en breuken (I², U²/R) gaan in de uit de PDF gehaalde tekst soms verloren ("I2"). Elke vraag heeft daarom een knop **Toon origineel**; bij twijfel altijd even kijken.
- De toelichting is platte tekst; de knop *Toon originele uitwerking* laat de pagina's uit de cursus zien met figuren en formules.
- Hoofdstuk 1 en 2 hebben bij de VRZA geen examentraining en dus geen vragen in de app.

## Bestanden
```
index.html  css/style.css  js/{app,store,quiz,sync,account,config}.js
Dockerfile  docker-compose.yml  docker/entrypoint.sh  pocketbase/pb_migrations/  supabase/schema.sql
data/index.json  data/hoofdstuk-N.json  img/hsN/…
tools/{extract_vrza,build_index,check_answers}.py  tools/answer_overrides.json
```
