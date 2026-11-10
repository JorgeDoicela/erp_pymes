FROM nginx:alpine

RUN apk add --no-cache openssl

# Copiar configuración modular del Reverse Proxy / API Gateway
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# Script de entrada para verificación o generación de certificados SSL
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
