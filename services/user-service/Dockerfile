# ----------------------------------------
# Stage 1: Builder
# ----------------------------------------
FROM node:20-alpine AS builder

# Install pnpm specific version
RUN npm install -g pnpm@10.20.0

WORKDIR /app


# Copy Workspace Configs
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./

# Copy Manifests (package.json) ONLY
# This allows Docker to cache the 'install' step if dependencies haven't changed
COPY services/user-service/package.json ./services/user-service/
COPY shared/package.json ./shared/

# Install Dependencies with CACHING
# --mount saves downloaded packages to your disk so re-builds are instant
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy Source Code (After install, so code changes don't re-trigger install)
COPY services/user-service ./services/user-service
COPY shared ./shared

# Re-link workspace dependencies after copying source
# This ensures pnpm workspace symlinks point to actual copied files
RUN pnpm install --offline --frozen-lockfile

# Build Shared Library FIRST
RUN pnpm --filter @dns/shared run build

# Build User Service
RUN pnpm --filter user-service run build


# ----------------------------------------
# Stage 2: Production Runner
# ----------------------------------------
FROM node:20-alpine

RUN npm install -g pnpm@10.20.0

WORKDIR /app

# Copy Workspace Configs & Manifests
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY services/user-service/package.json ./services/user-service/
COPY shared/package.json ./shared/

# Surgically remove the 'prepare' script
# This stops Husky from crashing the build, allowing us to remove --ignore-scripts
RUN npm pkg delete scripts.prepare

# Install ONLY Production Dependencies with CACHING
# --ignore-scripts is REMOVED so symlinks are created!
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --filter user-service...

# Copy Built Code
COPY --from=builder /app/services/user-service/dist ./services/user-service/dist
COPY --from=builder /app/shared/dist ./shared/dist

EXPOSE 3004

CMD ["node", "services/user-service/dist/server.js"]