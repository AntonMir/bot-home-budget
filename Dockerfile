FROM node:18.16.0-alpine as builder

WORKDIR /app

COPY . /app

RUN npm ci

RUN npm run build

FROM node:18.16-alpine as runner

WORKDIR /app

COPY --from=builder /app/build /app/build

COPY --from=builder /app/node_modules /app/node_modules

COPY --from=builder /app/package.json /app/package.json

COPY --from=builder /app/package-lock.json /app/package-lock.json

COPY --from=builder /app/.env /app/.env

EXPOSE 3000

CMD ["node", "build/index.js"]
