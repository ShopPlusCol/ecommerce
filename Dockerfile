# Imagen de producción portable (Node.js), alternativa a Cloudflare Workers
# para Hostinger, Railway, un VPS o cualquier host compatible con Docker
# (sección 28.2 / 40.3). No usa `output: "standalone"` para no interferir
# con el build del adaptador de Cloudflare, que corre sobre el build normal
# de Next.js.

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src/infrastructure/db ./src/infrastructure/db
COPY --from=builder /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /app/.data /app/public/uploads && chown -R nextjs:nodejs /app/.data /app/public/uploads
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["npm", "run", "start"]
