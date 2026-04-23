# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/cartolaoddsfe/browser /usr/share/nginx/html

RUN chown -R appuser:appgroup /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 80

CMD ["sh", "-c", \
     "envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template \
      > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
