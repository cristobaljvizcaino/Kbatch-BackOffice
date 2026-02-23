# ============================================
# Stage 1: Build de la aplicación
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================
# Stage 2: Servir con Nginx
# ============================================
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

# ============================================
# Runtime Config (ENVs inyectadas en Cloud Run)
# ============================================
ENV IT-KBATCH_ENVIROMENTS_JSON="{}"
ENV IT-KBATCH_MSAL_CLIENT_ID=""
ENV IT-KBATCH_MSAL_AUTHORITY=""

# Configuración nginx optimizada para SPA
RUN printf 'server {\n\
    listen 8080;\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /health {\n\
        access_log off;\n\
        return 200 "OK";\n\
        add_header Content-Type text/plain;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Script de arranque que genera config.js desde las ENVs
# Nota: usamos printenv porque los nombres tienen guión y ${VAR} no funciona bien
RUN printf '#!/bin/sh\n\
set -eu\n\
ENV_JSON=$(printenv "IT-KBATCH_ENVIROMENTS_JSON" 2>/dev/null || echo "{}")\n\
CLIENT_ID=$(printenv "IT-KBATCH_MSAL_CLIENT_ID" 2>/dev/null || echo "")\n\
AUTHORITY=$(printenv "IT-KBATCH_MSAL_AUTHORITY" 2>/dev/null || echo "")\n\
cat > /usr/share/nginx/html/config.js <<EOF\n\
window.kbatch_selector_enviroments = $ENV_JSON;\n\
window.kbatch_msal_config = {"clientId":"$CLIENT_ID","authority":"$AUTHORITY"};\n\
EOF\n' > /docker-entrypoint.d/99-generate-config.sh \
    && chmod +x /docker-entrypoint.d/99-generate-config.sh

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]