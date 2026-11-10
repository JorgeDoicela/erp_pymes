# Etapa 1: Build de la Aplicación React con Vite
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Argumento para URL relativa de API en producción
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Etapa 2: Servidor Web Nginx ultraligero
FROM nginx:alpine

RUN apk add --no-cache openssl

# Copiar archivos compilados del stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración optimizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Script de entrada para generar certificados autofirmados si no existen
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
