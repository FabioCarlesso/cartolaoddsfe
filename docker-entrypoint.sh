#!/bin/sh
# Renderiza a configuração do nginx e sobe o servidor.
#
# Duas variáveis são substituídas no template:
#
#   BACKEND_URL     — destino do proxy de /api/, dado por quem implanta.
#   NGINX_RESOLVER  — servidor(es) de DNS que o nginx usa para re-resolver esse
#                     destino em tempo de requisição. Descoberto aqui, e não
#                     fixado no template, porque o IP do DNS muda conforme a
#                     plataforma (Docker local, rede privada da nuvem, etc).
#
# Sem o resolver o nginx não aceita um `proxy_pass` por variável — e sem
# `proxy_pass` por variável ele resolveria o backend uma única vez, na subida,
# e guardaria o IP para sempre.
set -eu

# Extrai os nameservers do /etc/resolv.conf. Endereços IPv6 vão entre colchetes,
# como a diretiva `resolver` exige. Um NGINX_RESOLVER já definido no ambiente
# vence a descoberta — é a saída para apontar a um DNS específico.
if [ -z "${NGINX_RESOLVER:-}" ]; then
    NGINX_RESOLVER="$(
        awk '/^[[:space:]]*nameserver[[:space:]]/ {
                 print ($2 ~ /:/) ? "[" $2 "]" : $2
             }' /etc/resolv.conf \
        | tr '\n' ' '
    )"
fi

# Container sem resolv.conf utilizável: cai no DNS embutido do Docker. Melhor do
# que abortar a subida — se BACKEND_URL for um IP literal, nada precisa ser
# resolvido e o servidor funciona igual.
if [ -z "${NGINX_RESOLVER% }" ]; then
    NGINX_RESOLVER="127.0.0.11"
    echo "entrypoint: nenhum nameserver em /etc/resolv.conf; usando ${NGINX_RESOLVER}" >&2
fi

export NGINX_RESOLVER

echo "entrypoint: BACKEND_URL=${BACKEND_URL:-<não definido>} NGINX_RESOLVER=${NGINX_RESOLVER}" >&2

envsubst '${BACKEND_URL} ${NGINX_RESOLVER}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf

# Diagnóstico: mostra o resultado da validação no log antes de subir. Não
# aborta — um erro real de configuração derruba o próprio nginx logo abaixo com
# a mesma mensagem, e não vale trocar uma subida que funciona por um
# crash-loop caso o `-t` esbarre em permissão de arquivo temporário.
nginx -t || echo "entrypoint: 'nginx -t' reclamou (ver acima)" >&2

exec nginx -g 'daemon off;'
