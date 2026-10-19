#!/bin/sh
# Maakt (indien opgegeven) een beheerder aan en start PocketBase.
set -e

if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  /pb/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" \
    || echo "WAARSCHUWING: beheerder aanmaken mislukt (wachtwoord minimaal 10 tekens?). Maak hem via de link in deze logs."
fi

exec /pb/pocketbase serve --http=0.0.0.0:8090
