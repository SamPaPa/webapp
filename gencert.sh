#!/usr/bin/env sh
# Generates a self-signed certificate for local development.
# Usage: ./gen-cert.sh [domain]   (default: localhost)
set -e

DOMAIN="${1:-localhost}"
mkdir -p certs

openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -keyout certs/privkey.pem \
  -out certs/fullchain.pem \
  -subj "/CN=${DOMAIN}" \
  -addext "subjectAltName=DNS:${DOMAIN},DNS:localhost,IP:127.0.0.1"

echo "Created certs/fullchain.pem and certs/privkey.pem for ${DOMAIN}"