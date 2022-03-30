FROM denoland/deno:1.10.3

WORKDIR /app

USER deno

ADD . .

CMD deno run --allow-net backend/index.ts