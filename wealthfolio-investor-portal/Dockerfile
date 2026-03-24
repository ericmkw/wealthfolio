FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
ARG APP_VERSION
ARG APP_BUILD_COMMIT
ARG APP_BUILD_TIME
ENV APP_VERSION=${APP_VERSION}
ENV APP_BUILD_COMMIT=${APP_BUILD_COMMIT}
ENV APP_BUILD_TIME=${APP_BUILD_TIME}
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
ARG APP_VERSION
ARG APP_BUILD_COMMIT
ARG APP_BUILD_TIME
WORKDIR /app
ENV NODE_ENV=production
ENV APP_VERSION=${APP_VERSION}
ENV APP_BUILD_COMMIT=${APP_BUILD_COMMIT}
ENV APP_BUILD_TIME=${APP_BUILD_TIME}
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/db/migrations ./src/db/migrations
COPY scripts/docker-entrypoint.mjs ./scripts/docker-entrypoint.mjs
EXPOSE 3000
CMD ["node", "scripts/docker-entrypoint.mjs"]
