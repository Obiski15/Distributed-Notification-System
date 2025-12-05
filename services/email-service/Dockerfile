FROM node:20-alpine AS builder

RUN npm install -g pnpm@10.20.0

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY services/email-service/package.json ./services/email-service/
COPY shared/package.json ./shared/
COPY services/email-service ./services/email-service
COPY shared ./shared

RUN pnpm install --frozen-lockfile --filter email-service...
RUN pnpm --filter email-service run build


FROM node:20-alpine

RUN npm install -g pnpm@10.20.0

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY services/email-service/package.json ./services/email-service/
COPY shared/package.json ./shared/

RUN pnpm install --prod --frozen-lockfile --filter email-service --ignore-scripts

COPY --from=builder /app/services/email-service/dist ./services/email-service/dist
COPY --from=builder /app/shared/dist ./shared/dist

EXPOSE 3001

CMD ["node", "services/email-service/dist/server.js"]