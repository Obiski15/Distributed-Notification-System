FROM node:20-alpine AS builder

RUN npm install -g pnpm@10.20.0

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY services/push-service/package.json ./services/push-service/
COPY shared/package.json ./shared/
COPY services/push-service ./services/push-service
COPY shared ./shared

RUN pnpm install --frozen-lockfile --filter push-service...
RUN pnpm --filter push-service run build


FROM node:20-alpine

RUN npm install -g pnpm@10.20.0

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY services/push-service/package.json ./services/push-service/
COPY shared/package.json ./shared/

RUN pnpm install --prod --frozen-lockfile --filter push-service --ignore-scripts

COPY --from=builder /app/services/push-service/dist ./services/push-service/dist
COPY --from=builder /app/shared/dist ./shared/dist

EXPOSE 3003

CMD ["node", "services/push-service/dist/server.js"]