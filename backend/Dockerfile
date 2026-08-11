FROM node:20-alpine

# Instalar OpenSSL, curl y librerias necesarias para Prisma ORM en Alpine Linux
RUN apk add --no-cache openssl libc6-compat curl

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

# Copiar y dar permisos al script de entrada
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 5000

# Entrypoint: aplica migraciones y arranca el servidor
ENTRYPOINT ["sh", "./entrypoint.sh"]
