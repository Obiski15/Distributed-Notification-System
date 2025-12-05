FROM node:20-alpine AS builder

RUN npm install -g pnpm@10.20.0

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY services/gateway-service/package.json ./services/gateway-service/
COPY shared/package.json ./shared/
COPY services/gateway-service ./services/gateway-service
COPY shared ./shared

RUN pnpm install --frozen-lockfile --filter gateway-service...
RUN pnpm --filter gateway-service run build


FROM node:20-alpine

RUN npm install -g pnpm@10.20.0

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY services/gateway-service/package.json ./services/gateway-service/
COPY shared/package.json ./shared/

RUN pnpm install --prod --frozen-lockfile --filter gateway-service --ignore-scripts

COPY --from=builder /app/services/gateway-service/dist ./services/gateway-service/dist
COPY --from=builder /app/shared/dist ./shared/dist

EXPOSE 3000

CMD ["node", "services/gateway-service/dist/main.js"]