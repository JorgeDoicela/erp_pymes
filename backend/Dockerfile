FROM node:20-alpine

# Instalar OpenSSL y librerias necesarias para Prisma ORM en Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copiar archivos de dependencias y schema de Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias del backend
RUN npm install

# Copiar el resto del código del backend
COPY . .

# Generar el cliente de Prisma para Linux Alpine
RUN npx prisma generate

EXPOSE 5000

# Script de inicio: sincroniza el esquema Prisma con la BD y arranca el servidor
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/server.js"]
