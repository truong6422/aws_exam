# Nginx reverse-proxy Dockerfile
# Copies nginx.conf into a lean nginx:alpine image.
# SSL certs are mounted at runtime via a volume (see docker-compose.yml).

FROM nginx:1.27-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
