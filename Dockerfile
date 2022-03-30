FROM hayd/alpine-deno:1.7.1

WORKDIR /app

USER deno

ADD . .

CMD deno run --allow-net backend/index.ts