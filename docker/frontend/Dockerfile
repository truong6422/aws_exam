# Frontend Dockerfile — multi-stage build
# Stages:
#   deps        → install node_modules (layer-cached)
#   development → deps stage, source bind-mounted at runtime, Vite HMR
#   builder     → full build producing /app/dist
#   production  → nginx:alpine serving the static /dist bundle

# ── deps ──────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only the manifest — no package-lock.json in this project
COPY apps/frontend/package.json ./
# npm install instead of npm ci (no lockfile present)
RUN npm install

# ── development ───────────────────────────────────────────────────────────────
FROM deps AS development

# Source is bind-mounted at runtime; no full COPY here.
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# ── builder ───────────────────────────────────────────────────────────────────
FROM deps AS builder

COPY apps/frontend/ .

# Accept build-time env vars (e.g. VITE_API_BASE_URL)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ── production ────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx site; main proxy config lives in the nginx service
RUN rm /etc/nginx/conf.d/default.conf

# Copy built static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Lightweight config: serve /usr/share/nginx/html, defer API proxying to
# the dedicated nginx reverse-proxy container.
COPY docker/frontend/nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
