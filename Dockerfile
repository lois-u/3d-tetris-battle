FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm@8

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY shared ./shared
COPY server ./server

RUN pnpm run build:server

EXPOSE 8080

CMD ["node", "server/dist/index.js"]
