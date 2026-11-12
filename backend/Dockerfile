FROM node:20-slim

# Instalar OpenSSL, curl y certificados raíz para Prisma ORM y onnxruntime-node nativo (glibc)
RUN apt-get update && apt-get install -y --no-install-recommends openssl curl ca-certificates && rm -rf /var/lib/apt/lists/*

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
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

EXPOSE 5000

# Entrypoint: aplica migraciones y arranca el servidor
ENTRYPOINT ["sh", "./entrypoint.sh"]
