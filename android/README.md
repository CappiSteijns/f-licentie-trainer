# Android-app (apk)

Een dunne WebView-schil om de website: bij de eerste keer vul je het adres van je eigen server in, daarna opent de app die site.
Inloggen en synchroniseren werken dus precies zoals in de browser (zelfde server, zelfde account).

**Bouwen:** gebeurt automatisch op GitHub (`.github/workflows/android.yml`) zodra iets in `android/` verandert.
Het resultaat staat onder *Releases* → `android-latest` → `F-licentie.apk`.

**Handtekening:** de apk wordt getekend met `android/sideload.jks` (wachtwoord `flic-sideload`, alias `flic`). Die sleutel staat
bewust in de repo zodat elke nieuwe versie over de vorige heen kan worden geïnstalleerd; hij is dus niet geheim en bedoeld voor
installeren buiten de Play Store. Wil je een privé-sleutel, zet dan een eigen keystore (base64) in de repo-secrets
`ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` en `ANDROID_KEY_PASSWORD`; de workflow gebruikt die dan.
