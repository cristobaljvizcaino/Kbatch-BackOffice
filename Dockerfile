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
# Runtime Config (una sola ENV con JSON)
# ============================================
# En Cloud Run/deploy, sobreescribe esta variable con el JSON de ambientes.
# Ejemplo: IT-KBATCH_ENVIROMENTS_JSON='{"PAYIN-KASHIO-D1":{"api_url":"https://...","auth_user":"x","auth_password":"y"}}'
ENV IT-KBATCH_ENVIROMENTS_JSON="{}"

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

# Script de arranque que genera config.js desde la ENV
# Nota: usamos printenv porque el nombre tiene guión y ${VAR} no funciona bien
RUN printf '#!/bin/sh\n\
set -eu\n\
CONFIG_JSON=$(printenv "IT-KBATCH_ENVIROMENTS_JSON" 2>/dev/null || echo "{}")\n\
cat > /usr/share/nginx/html/config.js <<EOF\n\
window.kbatch_selector_enviroments = $CONFIG_JSON;\n\
EOF\n' > /docker-entrypoint.d/99-generate-config.sh \
    && chmod +x /docker-entrypoint.d/99-generate-config.sh

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]