# nginx/Dockerfile — multi-stage build
# Stage 1: build the React SPA
# Stage 2: nginx:alpine serving the SPA + proxying /api/ to Django
#
# Used by docker-compose.prod.yml.
# The full production nginx (TLS + separate frontend container) lives in
# docker/nginx/Dockerfile — this is the simplified single-container variant.

# ── frontend-build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy manifests first for layer caching
COPY apps/frontend/package*.json ./
RUN npm install

# Copy source and build
COPY apps/frontend/ ./
RUN npm run build

# ── nginx ─────────────────────────────────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built React SPA
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy nginx site config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
