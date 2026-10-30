FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_OPS_DOMAIN
ARG VITE_PUBLIC_DOMAIN
ARG VITE_AIOPS_EDGE_URL
ARG VITE_MAP_TILE_URL

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_OPS_DOMAIN=${VITE_OPS_DOMAIN} \
    VITE_PUBLIC_DOMAIN=${VITE_PUBLIC_DOMAIN} \
    VITE_AIOPS_EDGE_URL=${VITE_AIOPS_EDGE_URL} \
    VITE_MAP_TILE_URL=${VITE_MAP_TILE_URL}

COPY package.json package-lock.json ./
COPY apps/ops/package.json ./apps/ops/package.json

RUN npm ci --workspace=ops

COPY apps/ops ./apps/ops

RUN npm run build:ops

FROM nginx:stable-alpine

COPY apps/ops/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/ops/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
