FROM node:20-alpine AS builder

RUN npm install -g pnpm@10.20.0

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY services/template-service/package.json ./services/template-service/
COPY shared/package.json ./shared/
COPY services/template-service ./services/template-service
COPY shared ./shared

RUN pnpm install --frozen-lockfile --filter template-service...
RUN pnpm --filter template-service run build


FROM node:20-alpine

RUN npm install -g pnpm@10.20.0

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY services/template-service/package.json ./services/template-service/
COPY shared/package.json ./shared/

RUN pnpm install --prod --frozen-lockfile --filter template-service --ignore-scripts

COPY --from=builder /app/services/template-service/dist ./services/template-service/dist
COPY --from=builder /app/shared/dist ./shared/dist

EXPOSE 3002

CMD ["node", "services/template-service/dist/server.js"]