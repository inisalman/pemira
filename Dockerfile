# docker build = image produksi untuk EasyPanel (P8-02).
# Build di mesin luar VPS bila tersedia; docker push ke registry EasyPanel.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --force --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NITRO_PORT=3000 \
    NITRO_HOST=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.output .output
COPY --from=build /app/database/migrate.ts database/migrate.ts
COPY --from=build /app/database/migrations database/migrations
COPY --from=build /app/package.json .
USER app
EXPOSE 3000
# start only; migrations run separately (entrypoint) with DATABASE_URL
CMD ["node", ".output/server/index.mjs"]
