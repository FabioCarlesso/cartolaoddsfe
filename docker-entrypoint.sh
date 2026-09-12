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

# O resolver do nginx fala DNS e só DNS: ele não consulta o /etc/hosts. Isso
# atropelaria o padrão de desenvolvimento deste repo — `host.docker.internal`
# existe apenas no /etc/hosts, posto lá pelo Docker Desktop ou pelo
# `extra_hosts` do compose no Linux — e todo /api/ responderia 502
# "could not be resolved (3: Host not found)".
#
# A saída é fixar o IP na URL quando o nome vier do /etc/hosts. Para uma
# entrada de /etc/hosts isso é correto: ela é estática pela vida do container,
# não há o que reconsultar.
#
# Mas o comportamento é OPT-IN, desligado por omissão, e a razão é produção.
# Fixar IP na subida é precisamente o defeito que este entrypoint existe para
# corrigir; aqui ele só é aceitável porque a entrada é estática. Se a
# plataforma de produção puser o hostname do backend no /etc/hosts do
# container — coisa que não se controla daqui —, um padrão "ligado" fixaria
# aquele IP e o backend voltaria a ficar inalcançável no deploy seguinte, com
# o mesmo 504 silencioso de antes.
#
# Então quem liga é quem sabe que precisa: o docker-compose.yml do
# desenvolvimento, onde o `extra_hosts` põe host.docker.internal no
# /etc/hosts. Produção não define a variável e nunca fixa nada — o destino
# segue sendo re-resolvido a cada `valid=10s`, sem depender de premissa
# nenhuma sobre o /etc/hosts de lá.
fixa_host_do_etc_hosts() {
    case "${BACKEND_URL_FROM_ETC_HOSTS:-}" in
        1|true|TRUE|yes|YES) ;;
        *) return 0 ;;
    esac
    [ -n "${BACKEND_URL:-}" ] || return 0

    _resto=${BACKEND_URL#*://}
    case $_resto in
        '['*) return 0 ;;   # literal IPv6 entre colchetes: não há nome a resolver
    esac

    _host=${_resto%%[:/]*}
    [ -n "$_host" ] || return 0

    # Lê o IP do próprio /etc/hosts, em vez de delegar a `getent`: é um utilitário
    # que nem toda imagem enxuta traz, e a intenção aqui é justamente consultar o
    # arquivo, não o resolvedor do sistema. O nome é comparado campo a campo
    # (a partir do segundo, que é onde ficam hostname e apelidos — nunca o IP),
    # sem diferenciar maiúsculas, descartando comentário de linha e de fim de linha.
    _ip=$(awk -v nome="$_host" '
        { sub(/#.*/, "") }
        NF < 2 { next }
        {
            for (i = 2; i <= NF; i++) {
                if (tolower($i) == tolower(nome)) { print $1; exit }
            }
        }' /etc/hosts 2>/dev/null)
    [ -n "$_ip" ] || return 0
    case $_ip in *:*) _ip="[$_ip]" ;; esac   # IPv6 precisa de colchetes na URL

    BACKEND_URL="${BACKEND_URL%%://*}://${_ip}${_resto#"$_host"}"
    export BACKEND_URL
    echo "entrypoint: ${_host} vem do /etc/hosts; fixando ${_ip} (o resolver do nginx não lê /etc/hosts)" >&2
}

fixa_host_do_etc_hosts

echo "entrypoint: BACKEND_URL=${BACKEND_URL:-<não definido>} NGINX_RESOLVER=${NGINX_RESOLVER} BACKEND_URL_FROM_ETC_HOSTS=${BACKEND_URL_FROM_ETC_HOSTS:-off}" >&2

envsubst '${BACKEND_URL} ${NGINX_RESOLVER}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf

# Diagnóstico: mostra o resultado da validação no log antes de subir. Não
# aborta — um erro real de configuração derruba o próprio nginx logo abaixo com
# a mesma mensagem, e não vale trocar uma subida que funciona por um
# crash-loop caso o `-t` esbarre em permissão de arquivo temporário.
nginx -t || echo "entrypoint: 'nginx -t' reclamou (ver acima)" >&2

exec nginx -g 'daemon off;'
