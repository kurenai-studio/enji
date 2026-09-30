# Enji preview host for Docker (linux/arm64 or amd64).
# Build from the enji repo root:
#   docker build -f docker/Dockerfile -t enji:local .
#
# Run against a project on the host:
#   docker run --rm -p 7460-7470:7460-7470 \
#     -e WATCH_POLL=1 \
#     -v /path/to/project:/work \
#     -w /work enji:local host start --project /work
#
# DaoCloud mirror: Docker Hub pulls from this machine often time out.
FROM docker.m.daocloud.io/library/node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /enji

# Package sources only — host darwin node_modules must not enter the image.
COPY package.json package-lock.json ./
COPY bin ./bin
COPY host ./host
COPY lib ./lib
COPY scripts ./scripts
COPY templates ./templates
COPY docs ./docs
COPY vendor/cocos-core ./vendor/cocos-core
COPY docker/entrypoint.sh /usr/local/bin/enji-docker-entry
# vendor/cocos-core was npm-installed on macOS, so its optional native packages
# (rollup-darwin-*, sharp, …) do not match Linux. Reinstall the Linux ones.
RUN chmod +x /usr/local/bin/enji-docker-entry \
  && npm install --omit=dev \
  && ARCH="$(node -p "process.arch==='arm64'?'arm64':'x64'")" \
  && ROLLUP="@rollup/rollup-linux-${ARCH}-gnu" \
  && npm install --omit=dev --no-save --no-audit --no-fund "$ROLLUP" \
       --prefix vendor/cocos-core \
  && npm install --omit=dev --no-save --no-audit --no-fund "$ROLLUP" \
       --prefix vendor/cocos-core/node_modules/@cocos/ccbuild \
  && npm rebuild sharp --prefix vendor/cocos-core || true \
  && node -e "require('rollup'); console.log('rollup ok')" \
       --prefix vendor/cocos-core/node_modules/@cocos/ccbuild || \
     node -e "require('/enji/vendor/cocos-core/node_modules/@cocos/ccbuild/node_modules/rollup'); console.log('nested rollup ok')"

ENV PATH="/enji/bin:${PATH}"
ENV WATCH_POLL=1
ENV WATCH_POLL_MS=1000
# Preview URL advertised as localhost so host-side browsers work via -p publish.
ENV PORT=7460

WORKDIR /work
EXPOSE 7460-7470
ENTRYPOINT ["/usr/local/bin/enji-docker-entry"]
CMD ["host", "start", "--project", "."]
