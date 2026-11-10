#!/bin/sh
set -e

# Si los certificados no existen o están vacíos en /etc/nginx/certs/, generar certificados de desarrollo autofirmados
if [ ! -s /etc/nginx/certs/cert.pem ] || [ ! -s /etc/nginx/certs/key.pem ]; then
    echo "[Frontend Entrypoint] Certificados SSL no encontrados en /etc/nginx/certs/. Generando certificado autofirmado para desarrollo..."
    mkdir -p /etc/nginx/certs
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/certs/key.pem \
        -out /etc/nginx/certs/cert.pem \
        -subj "/CN=localhost"
fi

exec "$@"

