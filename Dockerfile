FROM denoland/deno:1.10.3

WORKDIR /app

USER deno

ADD . .

CMD deno --version
CMD deno run --allow-net --unstable --allow-env backend/index.ts