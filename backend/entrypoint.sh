#!/bin/sh
set -e

# Google Vision (OCR) resuelve las credenciales por Application Default Credentials,
# es decir leyendo el fichero al que apunta GOOGLE_APPLICATION_CREDENTIALS.
# En Railway no se pueden montar ficheros, asi que se pasa el JSON entero de la
# service-account en la variable GOOGLE_CREDENTIALS_JSON y aqui lo materializamos.
if [ -n "$GOOGLE_CREDENTIALS_JSON" ]; then
  printf '%s' "$GOOGLE_CREDENTIALS_JSON" > /tmp/gcp-credentials.json
  export GOOGLE_APPLICATION_CREDENTIALS=/tmp/gcp-credentials.json
fi

exec java -jar app.jar
