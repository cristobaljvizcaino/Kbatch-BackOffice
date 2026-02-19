# ============================================
# Stage 1: Build de la aplicación React
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Construir la aplicación (los placeholders quedan en el código)
RUN npm run build

# ============================================
# Stage 2: Servir con Nginx
# ============================================
FROM nginx:alpine

# Eliminar la configuración por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar los archivos de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Variables de entorno (se reemplazan en runtime)
ENV IT-KRESOLVE-METABASE_SITE_URL=""
ENV IT-KRESOLVE-METABASE_SECRET_KEY=""
ENV IT-KRESOLVE-APP_CLIENT_ID=""
ENV IT-KRESOLVE-APP_TENANT_ID=""
ENV IT-KRESOLVE-API_URL=""

# Configuración de nginx para SPA
RUN printf "server { \n\
    listen 8080; \n\
    gzip on; \n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml; \n\
    location / { \n\
    root /usr/share/nginx/html; \n\
    index index.html; \n\
    try_files \$uri \$uri/ /index.html; \n\
    } \n\
    location /health { \n\
    access_log off; \n\
    return 200 'OK'; \n\
    add_header Content-Type text/plain; \n\
    } \n\
    }" > /etc/nginx/conf.d/default.conf

EXPOSE 8080

# En runtime: reemplaza los placeholders con los valores de las variables de entorno
CMD ["/bin/sh", "-c", "find /usr/share/nginx/html -name '*.js' -exec sed -i \
    -e \"s|KRESOLVE_METABASE_SITE_URL_PLACEHOLDER|$(printenv IT-KRESOLVE-METABASE_SITE_URL)|g\" \
    -e \"s|KRESOLVE_METABASE_SECRET_KEY_PLACEHOLDER|$(printenv IT-KRESOLVE-METABASE_SECRET_KEY)|g\" \
    -e \"s|KRESOLVE_APP_CLIENT_ID_PLACEHOLDER|$(printenv IT-KRESOLVE-APP_CLIENT_ID)|g\" \
    -e \"s|KRESOLVE_APP_TENANT_ID_PLACEHOLDER|$(printenv IT-KRESOLVE-APP_TENANT_ID)|g\" \
    -e \"s|KRESOLVE_API_URL_PLACEHOLDER|$(printenv IT-KRESOLVE-API_URL)|g\" \
    {} + && nginx -g 'daemon off;'"]
