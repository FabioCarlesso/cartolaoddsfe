#!/bin/bash
# Converte os PNGs capturados para os arquivos publicados em src/assets/landing/.
# Uso: scripts/prints/converter.sh <diretorio-com-os-png>
set -euo pipefail

ORIGEM="${1:?informe o diretório com time.png, ranking.png, comparar.png e historico.png}"
DESTINO="$(cd "$(dirname "$0")/../.." && pwd)/src/assets/landing"

for nome in time ranking comparar historico; do
  ffmpeg -y -loglevel error -i "$ORIGEM/$nome.png" -c:v libwebp -quality 82 -compression_level 6 \
    "$DESTINO/$nome.webp"
done

# Imagem do Open Graph: recorte 1440x756 do topo da tela de time, reescalado para 1200x630 —
# a proporção que WhatsApp e LinkedIn esperam na prévia do link.
ffmpeg -y -loglevel error -i "$ORIGEM/time.png" -vf "crop=1440:756:0:0,scale=1200:630" \
  "$DESTINO/og.png"

echo "atualizados em $DESTINO:"
ls -la "$DESTINO"
