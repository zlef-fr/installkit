FROM node:22-slim

# better-sqlite3 needs a toolchain to build its native addon
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

COPY . .
RUN node sdk/build.mjs

EXPOSE 10073
CMD ["node", "server.js"]
