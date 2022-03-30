FROM denoland/deno:1.20.3

WORKDIR /app

USER deno

ADD . .

CMD deno run --allow-net --allow-env backend/index.ts